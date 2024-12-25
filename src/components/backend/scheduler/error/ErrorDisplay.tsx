import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: Error;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
}

export function ErrorDisplay({ 
  error, 
  retryCount, 
  maxRetries, 
  onRetry 
}: ErrorDisplayProps) {
  console.log('Rendering ErrorDisplay with:', { error, retryCount, maxRetries });
  
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-4">
          <p className="text-sm">{error.message}</p>
          {retryCount < maxRetries ? (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry ({retryCount + 1}/{maxRetries})
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            If the problem persists, please contact support with error ID: {Date.now().toString(36)}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}