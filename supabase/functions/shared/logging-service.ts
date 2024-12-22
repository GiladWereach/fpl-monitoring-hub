export function logDebug(functionName: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${functionName}] ${message}`, ...args);
}

export function logError(functionName: string, message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${functionName}] ERROR: ${message}`, error);
  
  // Additional error details
  if (error?.response) {
    console.error(`[${timestamp}] [${functionName}] Response status:`, error.response.status);
    console.error(`[${timestamp}] [${functionName}] Response data:`, error.response.data);
  }
}

export function logWarning(functionName: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [${functionName}] WARNING: ${message}`, ...args);
}

export function logInfo(functionName: string, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}] [${functionName}] INFO: ${message}`, ...args);
}