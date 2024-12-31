export const logDebug = (context: string, message: string, ...args: any[]) => {
console.log(`[DEBUG] [${context}] ${message}`, ...args);
};

export const logError = (context: string, message: string, error?: any) => {
console.error(`[ERROR] [${context}] ${message}`, error || '');
};

export const logInfo = (context: string, message: string, metadata?: Record<string, any>) => {
console.info(`[INFO] [${context}] ${message}`, metadata || '');
};
