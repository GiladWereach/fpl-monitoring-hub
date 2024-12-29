export function logDebug(context: string, message: string, ...args: any[]) {
  console.log(`[${context}] ${message}`, ...args);
}

export function logError(context: string, message: string, error?: any) {
  console.error(`[${context}] ${message}`, error || '');
}

export function logInfo(context: string, message: string, metadata?: Record<string, any>) {
  console.info(`[${context}] ${message}`, metadata || '');
}