import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";
import { alertingService } from "@/services/alertingService";
import { SchedulerError, handleSchedulerError } from "@/utils/errorHandling";
import { ErrorDisplay } from "./error/ErrorDisplay";
import { calculateBackoffDelay, sleep, RetryConfig } from "./utils/retryHandler";

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
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000
  };

  public state: State = {
    hasError: false,
    retryCount: 0
  };

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
    
    // Enhanced error handling for stream-related errors
    if (error.message.includes('body stream already read')) {
      console.log('Detected stream consumption error, handling specially');
      this.handleStreamError(error);
      return;
    }
    
    if (error instanceof SchedulerError) {
      handleSchedulerError(error, {
        functionName: 'SchedulerErrorBoundary',
        attempt: this.state.retryCount + 1,
        maxAttempts: this.retryConfig.maxRetries
      }).catch(console.error);
    }
    
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
  }

  private handleStreamError = async (error: Error) => {
    console.log('Handling stream error, will attempt recovery');
    toast({
      title: "Stream Error Detected",
      description: "Attempting to recover...",
      variant: "default", // Changed from "warning" to "default"
    });

    // Force a clean reload of the data
    await this.handleRetry();
  };

  private handleRetry = async () => {
    console.log(`Attempting retry ${this.state.retryCount + 1} of ${this.retryConfig.maxRetries}`);
    
    if (this.state.retryCount >= this.retryConfig.maxRetries) {
      console.error('Max retries exceeded');
      toast({
        title: "Error Recovery Failed",
        description: "Maximum retry attempts exceeded. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      const delay = calculateBackoffDelay(
        this.state.retryCount,
        this.retryConfig
      );
      
      await sleep(delay);
      
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
        <ErrorDisplay
          error={this.state.error!}
          retryCount={this.state.retryCount}
          maxRetries={this.retryConfig.maxRetries}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}