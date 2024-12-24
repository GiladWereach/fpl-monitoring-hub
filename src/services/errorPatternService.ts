import { supabase } from "@/integrations/supabase/client";
import { alertingService } from "./alertingService";

export interface ErrorPattern {
  pattern_id: string;
  error_type: string;
  frequency: number;
  first_seen: Date;
  last_seen: Date;
  affected_functions: string[];
  severity: 'low' | 'medium' | 'high';
}

class ErrorPatternService {
  private static instance: ErrorPatternService;
  private patterns: Map<string, ErrorPattern> = new Map();
  
  private constructor() {
    console.log('Initializing ErrorPatternService');
  }

  public static getInstance(): ErrorPatternService {
    if (!ErrorPatternService.instance) {
      ErrorPatternService.instance = new ErrorPatternService();
    }
    return ErrorPatternService.instance;
  }

  public async analyzePatterns(): Promise<ErrorPattern[]> {
    console.log('Analyzing error patterns');
    
    try {
      const { data: errors, error } = await supabase
        .from('api_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const patterns = this.detectPatterns(errors);
      console.log('Detected patterns:', patterns);
      
      // Alert on concerning patterns
      this.alertOnPatterns(patterns);
      
      return patterns;
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      throw error;
    }
  }

  private detectPatterns(errors: any[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    const patternMap = new Map<string, any>();

    // Group errors by type and function
    errors.forEach(error => {
      const key = `${error.error_type}_${error.endpoint}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          count: 0,
          errors: [],
          firstSeen: error.created_at,
          lastSeen: error.created_at
        });
      }
      const pattern = patternMap.get(key);
      pattern.count++;
      pattern.errors.push(error);
      pattern.lastSeen = error.created_at;
    });

    // Analyze patterns
    patternMap.forEach((data, key) => {
      const [errorType, endpoint] = key.split('_');
      const timeSpan = new Date(data.lastSeen).getTime() - new Date(data.firstSeen).getTime();
      const frequency = data.count / (timeSpan / (1000 * 60 * 60)); // errors per hour

      patterns.push({
        pattern_id: key,
        error_type: errorType,
        frequency,
        first_seen: new Date(data.firstSeen),
        last_seen: new Date(data.lastSeen),
        affected_functions: [endpoint],
        severity: this.calculateSeverity(frequency, data.count)
      });
    });

    return patterns;
  }

  private calculateSeverity(frequency: number, totalCount: number): 'low' | 'medium' | 'high' {
    if (frequency > 10 || totalCount > 100) return 'high';
    if (frequency > 5 || totalCount > 50) return 'medium';
    return 'low';
  }

  private alertOnPatterns(patterns: ErrorPattern[]): void {
    patterns.forEach(pattern => {
      if (pattern.severity === 'high') {
        alertingService.alert(
          'ERROR_PATTERN_DETECTED',
          'critical',
          `High frequency error pattern detected: ${pattern.error_type}`,
          {
            pattern_id: pattern.pattern_id,
            frequency: pattern.frequency,
            affected_functions: pattern.affected_functions
          }
        );
      }
    });
  }
}

export const errorPatternService = ErrorPatternService.getInstance();