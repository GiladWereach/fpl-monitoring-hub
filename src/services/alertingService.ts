import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AlertingService {
  private static instance: AlertingService;
  private alertBuffer: Alert[] = [];
  private readonly BUFFER_FLUSH_INTERVAL = 10000; // 10 seconds
  private readonly BUFFER_SIZE_LIMIT = 100;

  private constructor() {
    this.startPeriodicFlush();
    console.log('Alerting service initialized');
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  private startPeriodicFlush(): void {
    setInterval(() => this.flushAlerts(), this.BUFFER_FLUSH_INTERVAL);
    console.log('Started periodic alert flushing');
  }

  private async flushAlerts(): Promise<void> {
    if (this.alertBuffer.length === 0) return;

    console.log(`Flushing ${this.alertBuffer.length} alerts`);
    const alerts = [...this.alertBuffer];
    this.alertBuffer = [];

    try {
      const { error } = await supabase
        .from('api_error_logs')
        .insert(
          alerts.map(alert => ({
            error_type: alert.type,
            endpoint: alert.metadata?.endpoint || 'system',
            error_details: alert.message,
            created_at: alert.timestamp.toISOString()
          }))
        );

      if (error) throw error;
      console.log('Successfully flushed alerts to database');
    } catch (error) {
      console.error('Error flushing alerts:', error);
      // Re-add critical alerts back to buffer
      this.alertBuffer.push(
        ...alerts.filter(a => a.severity === 'critical')
      );
    }
  }

  public alert(
    type: string,
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, any>
  ): void {
    console.log(`New alert: [${severity}] ${type} - ${message}`);
    
    const alert: Alert = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata
    };

    this.alertBuffer.push(alert);

    // Show UI toast for warning and above
    if (severity !== 'info') {
      toast({
        title: type,
        description: message,
        variant: severity === 'critical' ? 'destructive' : 'default',
      });
    }

    // Immediate flush for critical alerts
    if (severity === 'critical') {
      this.flushAlerts();
    }
    // Check buffer size
    else if (this.alertBuffer.length >= this.BUFFER_SIZE_LIMIT) {
      console.log('Alert buffer size limit reached, triggering flush');
      this.flushAlerts();
    }
  }

  public async getRecentAlerts(): Promise<Alert[]> {
    console.log('Fetching recent alerts');
    try {
      const { data: logs, error } = await supabase
        .from('api_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return logs.map(log => ({
        id: log.id.toString(),
        type: log.error_type,
        severity: this.determineSeverity(log),
        message: log.error_details || 'No details provided',
        timestamp: new Date(log.created_at),
        metadata: {
          endpoint: log.endpoint,
          retryCount: log.retry_count
        }
      }));
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      throw error;
    }
  }

  private determineSeverity(log: any): AlertSeverity {
    if (log.retry_count >= 3) return 'critical';
    if (log.error_type === 'SYSTEM_ERROR') return 'error';
    if (log.error_type === 'VALIDATION_ERROR') return 'warning';
    return 'info';
  }
}

export const alertingService = AlertingService.getInstance();