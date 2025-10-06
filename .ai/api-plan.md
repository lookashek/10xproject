# REST API Plan for 10x-cards

## 1. Resources

The API exposes the following main resources mapped to database tables:

- **Flashcards** → `flashcards` table
- **Generations** → `generations` table

Note: `generation_error_logs` is used internally for logging and does not expose public endpoints.
Note: Authentication and user management will be implemented later.

## 2. Endpoints

### 2.1 Flashcards

#### List Flashcards
- **Method**: `GET`
- **Path**: `/api/flashcards`
- **Description**: Returns a paginated list of flashcards, sorted by creation date (newest first)
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 50, max: 100): Items per page
  - `source` (optional): Filter by source (`ai-full`, `ai-edited`, `manual`)
  - `search` (optional): Search in front/back text
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "front": "What is TypeScript?",
      "back": "A statically typed superset of JavaScript",
      "source": "ai-full",
      "generation_id": 45,
      "created_at": "2025-10-06T10:00:00Z",
      "updated_at": "2025-10-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters

#### Get Single Flashcard
- **Method**: `GET`
- **Path**: `/api/flashcards/{id}`
- **Description**: Returns details of a specific flashcard
- **Success Response** (200 OK):
```json
{
  "id": 123,
  "front": "What is TypeScript?",
  "back": "A statically typed superset of JavaScript",
  "source": "ai-full",
  "generation_id": 45,
  "created_at": "2025-10-06T10:00:00Z",
  "updated_at": "2025-10-06T10:00:00Z"
}
```
- **Error Responses**:
  - `404 Not Found`: Flashcard does not exist

#### Create Flashcard(s)
- **Method**: `POST`
- **Path**: `/api/flashcards`
- **Description**: Creates one or more flashcards (manual or from AI generation)
- **Request Body** (single flashcard):
```json
{
  "front": "What is React?",
  "back": "A JavaScript library for building user interfaces",
  "source": "manual"
}
```
- **Request Body** (batch from generation):
```json
{
  "flashcards": [
    {
      "front": "What is Astro?",
      "back": "A modern web framework for content-focused websites",
      "source": "ai-full",
      "generation_id": 45
    },
    {
      "front": "What is Tailwind CSS?",
      "back": "A utility-first CSS framework",
      "source": "ai-edited",
      "generation_id": 45
    }
  ]
}
```
- **Success Response** (201 Created):
```json
{
  "data": [
    {
      "id": 124,
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-06T11:00:00Z",
      "updated_at": "2025-10-06T11:00:00Z"
    }
  ]
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid request body or validation error
  - `409 Conflict`: Duplicate flashcard (same front and back already exists)
  - `422 Unprocessable Entity`: Front exceeds 200 chars, back exceeds 500 chars, or invalid source value

#### Update Flashcard
- **Method**: `PUT`
- **Path**: `/api/flashcards/{id}`
- **Description**: Updates an existing flashcard
- **Request Body**:
```json
{
  "front": "What is TypeScript? (Updated)",
  "back": "A strongly typed programming language that builds on JavaScript"
}
```
- **Success Response** (200 OK):
```json
{
  "id": 123,
  "front": "What is TypeScript? (Updated)",
  "back": "A strongly typed programming language that builds on JavaScript",
  "source": "ai-edited",
  "generation_id": 45,
  "created_at": "2025-10-06T10:00:00Z",
  "updated_at": "2025-10-06T11:30:00Z"
}
```
- **Error Responses**:
  - `404 Not Found`: Flashcard does not exist
  - `400 Bad Request`: Invalid request body
  - `409 Conflict`: Updated values create a duplicate
  - `422 Unprocessable Entity`: Front exceeds 200 chars or back exceeds 500 chars

#### Delete Flashcard
- **Method**: `DELETE`
- **Path**: `/api/flashcards/{id}`
- **Description**: Permanently deletes a flashcard
- **Success Response** (204 No Content)
- **Error Responses**:
  - `404 Not Found`: Flashcard does not exist

---

### 2.2 Generations

#### Generate Flashcards with AI
- **Method**: `POST`
- **Path**: `/api/generations`
- **Description**: Sends source text to LLM API (OpenRouter.ai), creates a generation record, and returns proposed flashcards
- **Request Body**:
```json
{
  "source_text": "TypeScript is a strongly typed programming language..."
}
```
- **Success Response** (201 Created):
```json
{
  "generation": {
    "id": 46,
    "generated_count": 5,
    "source_text_hash": "sha256_hash",
    "source_text_length": 1250,
    "generation_duration": 3200,
    "created_at": "2025-10-06T12:00:00Z"
  },
  "proposed_flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language that builds on JavaScript"
    },
    {
      "front": "What are the benefits of TypeScript?",
      "back": "Type safety, better IDE support, and early error detection"
    }
  ]
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing source_text or model
  - `422 Unprocessable Entity`: source_text length not between 1000-10000 characters
  - `409 Conflict`: Generation for this source_text (hash) already exists
  - `500 Internal Server Error`: LLM API error (logged to generation_error_logs)
  - `503 Service Unavailable`: LLM API temporarily unavailable

#### List Generations
- **Method**: `GET`
- **Path**: `/api/generations`
- **Description**: Returns a paginated list of generation history with statistics
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 50): Items per page
- **Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 46,
      "generated_count": 5,
      "accepted_unedited_count": 3,
      "accepted_edited_count": 1,
      "source_text_hash": "sha256_hash",
      "source_text_length": 1250,
      "generation_duration": 3200,
      "created_at": "2025-10-06T12:00:00Z",
      "updated_at": "2025-10-06T12:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters

#### Get Generation Details
- **Method**: `GET`
- **Path**: `/api/generations/{id}`
- **Description**: Returns details of a specific generation including associated flashcards
- **Success Response** (200 OK):
```json
{
  "id": 46,
  "generated_count": 5,
  "accepted_unedited_count": 3,
  "accepted_edited_count": 1,
  "source_text_hash": "sha256_hash",
  "source_text_length": 1250,
  "generation_duration": 3200,
  "created_at": "2025-10-06T12:00:00Z",
  "updated_at": "2025-10-06T12:05:00Z",
  "flashcards": [
    {
      "id": 125,
      "front": "What is TypeScript?",
      "back": "A strongly typed programming language that builds on JavaScript",
      "source": "ai-full"
    }
  ]
}
```
- **Error Responses**:
  - `404 Not Found`: Generation does not exist

---

## 3. Validation and Business Logic

**Note**: Authentication and authorization will be implemented in a later phase. For now, all endpoints are accessible without authentication.

### 3.1 Flashcards Validation

#### Field Constraints
- `front`: Required, max 200 characters, non-empty after trim
- `back`: Required, max 500 characters, non-empty after trim
- `source`: Required, must be one of: `ai-full`, `ai-edited`, `manual`
- `generation_id`: Optional (null for manual flashcards), must reference existing generation if provided

#### Business Rules
1. **Uniqueness**: Cannot have duplicate flashcards (same `front` and `back` combination)
   - Returns `409 Conflict` if duplicate detected
2. **Source Validation**:
   - `manual` flashcards must have `generation_id = null`
   - `ai-full` flashcards must have valid `generation_id` and cannot be edited
   - `ai-edited` flashcards must have valid `generation_id` and contain modifications
3. **Batch Creation**: When creating flashcards from a generation, the API:
   - Validates all flashcards before inserting any
   - Updates `accepted_unedited_count` and `accepted_edited_count` in generations table
   - Uses database transaction to ensure atomicity
4. **Update Logic**: When updating a flashcard:
   - If original source was `ai-full` and content changes, source becomes `ai-edited`
   - `updated_at` timestamp is automatically refreshed via trigger

### 3.2 Generations Validation

#### Field Constraints
- `source_text`: Required, min 1000 characters, max 10000 characters
- `model`: Required, non-empty string (e.g., `anthropic/claude-3.5-sonnet`)

#### Business Rules
1. **Duplicate Prevention**: Same source text (by hash) cannot be generated twice
   - Returns `409 Conflict` with message suggesting to use existing generation
2. **Hash Calculation**: `source_text_hash` is calculated server-side using SHA-256
3. **Generation Flow**:
   ```
   1. Validate source_text length (1000-10000 chars)
   2. Calculate source_text_hash
   3. Check for existing generation with same hash
   4. Call OpenRouter.ai API with source_text and model
   5. Parse LLM response into flashcard proposals
   6. Create generation record with:
      - generated_count = number of proposed flashcards
      - generation_duration = time taken for LLM API call (ms)
      - accepted_unedited_count = null (updated later)
      - accepted_edited_count = null (updated later)
   7. Return generation record and proposed flashcards
   ```
4. **Error Handling**: If LLM API fails:
   - Create record in `generation_error_logs` table
   - Return `500 Internal Server Error` or `503 Service Unavailable`
   - Include error details in response body
5. **Statistics Update**: When flashcards are accepted:
   - Increment `accepted_unedited_count` for flashcards with `source = 'ai-full'`
   - Increment `accepted_edited_count` for flashcards with `source = 'ai-edited'`
   - Update `updated_at` timestamp

### 3.3 General Validation Rules

#### Input Sanitization
- All text input is trimmed and sanitized to prevent XSS
- HTML tags are stripped or escaped
- SQL injection prevented by parameterized queries (Supabase handles this)

#### Security Headers
All API responses should include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

#### Rate Limiting
- **Generation endpoint**: 10 requests per hour (expensive LLM calls)
- **Other endpoints**: 100 requests per minute
- Returns `429 Too Many Requests` when limit exceeded

#### Pagination Limits
- Default page size: varies by endpoint (20-50 items)
- Maximum page size: varies by endpoint (50-100 items)
- Large result sets use cursor-based pagination for performance

#### Error Response Format
All error responses follow consistent format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text exceeds maximum length of 200 characters",
    "details": {
      "field": "front",
      "constraint": "max_length",
      "max": 200,
      "actual": 215
    }
  }
}
```

### 3.4 LLM Integration Logic

#### OpenRouter.ai Configuration
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Authentication**: API key in `Authorization` header
- **Model Selection**: User can choose from supported models (default: `anthropic/claude-3.5-sonnet`)

#### Prompt Engineering
System prompt for flashcard generation:
```
You are an expert at creating educational flashcards. Given a text, extract key concepts and create clear, concise question-answer pairs. Each flashcard should:
- Have a specific, unambiguous question on the front
- Have a complete, accurate answer on the back
- Front text: max 200 characters
- Back text: max 500 characters
- Return valid JSON array of objects with "front" and "back" fields
```

#### Response Parsing
- Parse JSON array from LLM response
- Validate each flashcard proposal (length constraints)
- Filter out invalid proposals
- Set `generated_count` to number of valid proposals

---

## 4. Additional Considerations

### 4.1 Performance Optimization
- Database indexes on `created_at DESC` for efficient sorting and pagination
- Unique indexes enforce constraints without additional queries
- Optional trigram indexes (pg_trgm) for text search on front/back fields
- Connection pooling via Supabase for database connections

### 4.2 Monitoring and Analytics
- Track generation success/failure rates
- Monitor LLM API response times
- Log all generation errors to `generation_error_logs`
- Calculate acceptance rate: `(accepted_unedited_count + accepted_edited_count) / generated_count`

### 4.3 Future Enhancements (Out of Scope for MVP)
- WebSocket support for real-time generation progress
- Batch generation (multiple texts at once)
- Export flashcards to various formats (Anki, CSV)
- Spaced repetition algorithm integration (would require additional fields in flashcards table)
- Flashcard tags and categories
- Search with advanced filters

### 4.4 API Versioning
- Current version: v1 (implicit in `/api/` prefix)
- Future versions can use `/api/v2/` prefix
- Maintain backward compatibility for at least 6 months after new version release

