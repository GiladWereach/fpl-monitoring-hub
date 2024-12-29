interface UsagePattern {
  timestamp: number;
  usage: number;
}

export class ResourcePredictor {
  private usageHistory: Map<string, UsagePattern[]> = new Map();
  private readonly HISTORY_LIMIT = 100;

  recordUsage(functionName: string, usage: number): void {
    const history = this.usageHistory.get(functionName) || [];
    history.push({ timestamp: Date.now(), usage });
    
    if (history.length > this.HISTORY_LIMIT) {
      history.shift();
    }
    
    this.usageHistory.set(functionName, history);
    console.log(`Recorded usage for ${functionName}: ${usage}`);
  }

  predictNextUsage(functionName: string): number {
    const history = this.usageHistory.get(functionName) || [];
    if (history.length < 2) return 0;

    // Simple moving average prediction
    const recentUsage = history.slice(-5);
    const avgUsage = recentUsage.reduce((sum, entry) => sum + entry.usage, 0) / recentUsage.length;
    
    console.log(`Predicted usage for ${functionName}: ${avgUsage}`);
    return avgUsage;
  }
}