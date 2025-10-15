/**
 * ErrorBoundary - Obsługa błędów React dla widoku sesji nauki
 *
 * Catches unexpected errors i pokazuje fallback UI
 */

import React from "react";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StudyErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Study session error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Coś poszło nie tak</h2>
                  <p className="text-muted-foreground">Wystąpił nieoczekiwany błąd podczas sesji nauki.</p>
                  {this.state.error && (
                    <details className="mt-4 text-left">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Szczegóły błędu
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="gap-2"
                  >
                    <Home className="h-5 w-5" />
                    Powrót do panelu
                  </Button>
                  <Button size="lg" onClick={() => window.location.reload()} className="gap-2">
                    <RotateCw className="h-5 w-5" />
                    Odśwież stronę
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
