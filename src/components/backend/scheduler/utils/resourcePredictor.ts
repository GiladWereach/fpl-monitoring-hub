interface UsagePattern {
  timestamp: number;
  usage: number;
}

export interface PredictionResult {
  predictedUsage: number;
  confidence: number;
  anomalyScore: number;
}

export class ResourcePredictor {
  private usageHistory: Map<string, UsagePattern[]> = new Map();
  private readonly HISTORY_LIMIT = 100;
  private readonly ANOMALY_THRESHOLD = 2.0; // Standard deviations

  recordUsage(functionName: string, usage: number): void {
    const history = this.usageHistory.get(functionName) || [];
    history.push({ timestamp: Date.now(), usage });
    
    if (history.length > this.HISTORY_LIMIT) {
      history.shift();
    }
    
    this.usageHistory.set(functionName, history);
    console.log(`Recorded usage for ${functionName}: ${usage}`);
  }

  predictNextUsage(functionName: string): PredictionResult {
    const history = this.usageHistory.get(functionName) || [];
    if (history.length < 2) {
      return {
        predictedUsage: 0,
        confidence: 0,
        anomalyScore: 0
      };
    }

    // Calculate moving averages of different periods
    const shortTermAvg = this.calculateMovingAverage(history, 5);
    const mediumTermAvg = this.calculateMovingAverage(history, 20);
    const longTermAvg = this.calculateMovingAverage(history, 50);

    // Weight the predictions based on history length
    const weightedPrediction = this.calculateWeightedPrediction(shortTermAvg, mediumTermAvg, longTermAvg, history.length);
    
    // Calculate confidence based on prediction stability
    const confidence = this.calculateConfidence(history);
    
    // Detect anomalies
    const anomalyScore = this.calculateAnomalyScore(history, weightedPrediction);
    
    console.log(`Predicted usage for ${functionName}:`, {
      prediction: weightedPrediction,
      confidence,
      anomalyScore
    });

    return {
      predictedUsage: weightedPrediction,
      confidence,
      anomalyScore
    };
  }

  private calculateMovingAverage(history: UsagePattern[], window: number): number {
    const recentUsage = history.slice(-window);
    return recentUsage.reduce((sum, entry) => sum + entry.usage, 0) / recentUsage.length;
  }

  private calculateWeightedPrediction(short: number, medium: number, long: number, historyLength: number): number {
    // Adjust weights based on history length
    const shortWeight = Math.min(0.6, historyLength / this.HISTORY_LIMIT);
    const mediumWeight = Math.min(0.3, (historyLength / this.HISTORY_LIMIT) * 0.5);
    const longWeight = 1 - shortWeight - mediumWeight;

    return (short * shortWeight) + (medium * mediumWeight) + (long * longWeight);
  }

  private calculateConfidence(history: UsagePattern[]): number {
    if (history.length < 10) return 0.5;

    // Calculate variance in recent predictions
    const recentUsage = history.slice(-10).map(h => h.usage);
    const variance = this.calculateVariance(recentUsage);
    const maxVariance = Math.max(...recentUsage) * 0.5;

    // Higher variance = lower confidence
    return Math.max(0.1, Math.min(1.0, 1 - (variance / maxVariance)));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateAnomalyScore(history: UsagePattern[], prediction: number): number {
    if (history.length < 10) return 0;

    const recentUsage = history.slice(-10).map(h => h.usage);
    const mean = recentUsage.reduce((sum, val) => sum + val, 0) / recentUsage.length;
    const stdDev = Math.sqrt(this.calculateVariance(recentUsage));

    // Calculate z-score
    return Math.abs((prediction - mean) / (stdDev || 1));
  }
}