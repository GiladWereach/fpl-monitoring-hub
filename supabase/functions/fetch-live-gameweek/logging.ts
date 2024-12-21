export function logDebug(functionName: string, message: string, data?: any) {
  console.log(`[${functionName}] ${message}`, data ? JSON.stringify(data) : '');
}

export function logError(functionName: string, message: string, error?: any) {
  console.error(`[${functionName}] ERROR - ${message}`, error);
}