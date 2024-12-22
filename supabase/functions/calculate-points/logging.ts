export function logDebug(context: string, message: string, data?: any) {
  console.log(`[${context}] ${message}`, data ? JSON.stringify(data) : '');
}

export function logError(context: string, message: string, error: any) {
  console.error(`[${context}] ${message}:`, error);
}