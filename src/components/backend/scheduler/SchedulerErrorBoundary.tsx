import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { alertingService } from "@/services/alertingService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class SchedulerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0
  };

  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  public static getDerivedStateFromError(error: Error): State {
    console.error('Scheduler error caught:', error);
    return { 
      hasError: true, 
      error,
      retryCount: 0 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Scheduler error details:', error, errorInfo);
    
    // Log to alerting service
    alertingService.alert(
      'SCHEDULER_ERROR',
      'error',
      error.message,
      {
        component: 'SchedulerErrorBoundary',
        errorInfo: errorInfo,
        stackTrace: error.stack
      }
    );

    this.setState({ errorInfo });

    // Show toast notification
    toast({
      title: "Scheduler Error",
      description: `An error occurred: ${error.message}`,
      variant: "destructive",
    });
  }

  private handleRetry = async () => {
    console.log(`Attempting retry ${this.state.retryCount + 1} of ${this.MAX_RETRIES}`);
    
    if (this.state.retryCount >= this.MAX_RETRIES) {
      console.error('Max retries exceeded');
      toast({
        title: "Error Recovery Failed",
        description: "Maximum retry attempts exceeded. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Implement exponential backoff
    const delay = this.RETRY_DELAY * Math.pow(2, this.state.retryCount);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      this.setState(prevState => ({
        hasError: false,
        retryCount: prevState.retryCount + 1
      }));
      
      toast({
        title: "Retrying",
        description: "Attempting to recover from error...",
      });
    } catch (retryError) {
      console.error('Error during retry:', retryError);
      this.setState({ hasError: true });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-4">
              <p className="text-sm">{this.state.error?.message}</p>
              {this.state.retryCount < this.MAX_RETRIES ? (
                <Button 
                  variant="outline" 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry ({this.state.retryCount + 1}/{this.MAX_RETRIES})
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

    return this.props.children;
  }
}