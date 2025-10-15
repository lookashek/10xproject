// OpenRouter service implemented per implementation plan
// Contains: types, custom error, and OpenRouterService class

import type { z } from "zod";

// =============================
// Types
// =============================

export interface OpenRouterConfig {
  apiKey: string;
  apiUrl?: string;
  defaultModel?: string;
  requestTimeout?: number;
  httpReferer?: string;
  appTitle?: string;
}

export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ResponseSchema<T> {
  name: string;
  schema: z.ZodSchema<T>;
  jsonSchema: object;
}

export interface OpenRouterCompletionRequest<T = string> {
  systemMessage: string;
  userMessage: string;
  model?: string;
  modelParams?: ModelParameters;
  responseSchema?: ResponseSchema<T>;
  metadata?: {
    operationName?: string;
    userId?: string;
    [key: string]: any;
  };
}

export interface OpenRouterCompletionResponse<T> {
  data: T;
  durationMs: number;
  metadata?: {
    model: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    tokensTotal?: number;
  };
}

export type OpenRouterErrorCode =
  | "CONFIG_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMIT"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "API_ERROR";

// =============================
// Custom Error
// =============================

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: OpenRouterErrorCode,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "OpenRouterError";
  }

  isRetryable(): boolean {
    return (
      this.code === "TIMEOUT" ||
      this.code === "NETWORK_ERROR" ||
      this.code === "SERVICE_UNAVAILABLE" ||
      this.code === "RATE_LIMIT"
    );
  }

  toApiError() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// =============================
// Service
// =============================

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly requestTimeout: number;
  private readonly httpReferer: string;
  private readonly appTitle: string;

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new OpenRouterError("OpenRouter API key is required", "CONFIG_ERROR", 500);
    }

    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl ?? "https://openrouter.ai/api/v1/chat/completions";
    this.defaultModel = config.defaultModel ?? "anthropic/claude-3.5-sonnet";
    this.requestTimeout = config.requestTimeout ?? 60000;
    this.httpReferer = config.httpReferer ?? "https://10xproject.app";
    this.appTitle = config.appTitle ?? "10x Flashcards";
  }

  // -----------------------------
  // Public API
  // -----------------------------

  async generateCompletion<T = string>(
    request: OpenRouterCompletionRequest<T>
  ): Promise<OpenRouterCompletionResponse<T>> {
    const startTime = Date.now();

    const requestBody = this.buildRequestBody<T>(request);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.requestTimeout);

    try {
      const httpResponse = await this.executeRequest(requestBody, abortController.signal);
      clearTimeout(timeoutId);

      const responseData = await httpResponse.json();

      const data = await this.parseAndValidateResponse<T>(responseData, request.responseSchema?.schema);

      const durationMs = Date.now() - startTime;
      const metadata = this.extractMetadata(responseData);

      return { data, durationMs, metadata };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timed out", "TIMEOUT", 503);
      }

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError("Network error occurred", "NETWORK_ERROR", 503);
    }
  }

  async generateCompletionWithRetry<T = string>(
    request: OpenRouterCompletionRequest<T>,
    maxRetries = 3
  ): Promise<OpenRouterCompletionResponse<T>> {
    let lastError: OpenRouterError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateCompletion(request);
      } catch (error) {
        if (error instanceof OpenRouterError && error.isRetryable() && attempt < maxRetries) {
          lastError = error;
          const backoffMs = 1000 * attempt;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
        if (error instanceof OpenRouterError) {
          throw error;
        }
        throw new OpenRouterError("Network error occurred", "NETWORK_ERROR", 503);
      }
    }

    throw lastError ?? new OpenRouterError("Unknown error", "API_ERROR", 500);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateCompletion({
        systemMessage: "You are a helpful assistant.",
        userMessage: 'Say "OK"',
        modelParams: { maxTokens: 10 },
      });
      return true;
    } catch (error) {
      // Keep this quiet; just return false on failure
      return false;
    }
  }

  // -----------------------------
  // Internals
  // -----------------------------

  private buildRequestBody<T>(request: OpenRouterCompletionRequest<T>): Record<string, any> {
    const body: Record<string, any> = {
      model: request.model ?? this.defaultModel,
      messages: [
        { role: "system", content: request.systemMessage },
        { role: "user", content: request.userMessage },
      ],
    };

    if (request.modelParams) {
      this.applyModelParameters(body, request.modelParams);
    }

    if (request.responseSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: request.responseSchema.name,
          strict: true,
          schema: request.responseSchema.jsonSchema,
        },
      };
    }

    return body;
  }

  private applyModelParameters(body: Record<string, any>, params: ModelParameters): void {
    if (params.temperature !== undefined) {
      body.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      body.max_tokens = params.maxTokens;
    }
    if (params.topP !== undefined) {
      body.top_p = params.topP;
    }
    if (params.frequencyPenalty !== undefined) {
      body.frequency_penalty = params.frequencyPenalty;
    }
    if (params.presencePenalty !== undefined) {
      body.presence_penalty = params.presencePenalty;
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": this.httpReferer,
      "X-Title": this.appTitle,
    };
  }

  private async executeRequest(body: object, abortSignal: AbortSignal): Promise<Response> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: abortSignal,
      });

      if (!response.ok) {
        await this.handleHttpError(response);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("Request timed out", "TIMEOUT", 503);
      }
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError("Network error", "NETWORK_ERROR", 503);
    }
  }

  private async parseAndValidateResponse<T>(responseData: any, schema?: z.ZodSchema<T>): Promise<T> {
    const content = responseData?.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenRouterError("Invalid response structure from OpenRouter", "INVALID_RESPONSE", 500);
    }

    if (!schema) {
      return content as T;
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      throw new OpenRouterError("Failed to parse JSON from response", "PARSE_ERROR", 500, { rawContent: content });
    }

    const validationResult = schema.safeParse(parsedContent);
    if (!validationResult.success) {
      throw new OpenRouterError("Response failed schema validation", "VALIDATION_ERROR", 500, {
        errors: validationResult.error.errors,
        receivedData: parsedContent,
      });
    }

    return validationResult.data;
  }

  private async handleHttpError(response: Response): Promise<never> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // ignore parse error
    }

    const errorMessage = errorData?.error?.message || "Unknown error";

    switch (response.status) {
      case 400:
        throw new OpenRouterError(`Bad request: ${errorMessage}`, "BAD_REQUEST", 400, errorData);
      case 401:
        throw new OpenRouterError("Invalid API key", "UNAUTHORIZED", 401);
      case 402:
        throw new OpenRouterError("Insufficient credits in OpenRouter account", "INSUFFICIENT_CREDITS", 402);
      case 429:
        throw new OpenRouterError("Rate limit exceeded", "RATE_LIMIT", 429, {
          retryAfter: response.headers.get("Retry-After"),
        });
      case 500:
      case 502:
      case 503:
      case 504:
        throw new OpenRouterError("OpenRouter service temporarily unavailable", "SERVICE_UNAVAILABLE", 503);
      default:
        throw new OpenRouterError(`API error: ${errorMessage}`, "API_ERROR", response.status, errorData);
    }
  }

  private extractMetadata(data: any): OpenRouterCompletionResponse<any>["metadata"] {
    return {
      model: data?.model,
      tokensPrompt: data?.usage?.prompt_tokens,
      tokensCompletion: data?.usage?.completion_tokens,
      tokensTotal: data?.usage?.total_tokens,
    };
  }
}
