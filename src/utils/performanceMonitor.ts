/**
 * Performance monitoring and optimization utilities
 * Tracks system performance and provides optimization recommendations
 */

import { PERFORMANCE_THRESHOLDS, TIMEOUT_CONFIG } from '../config/performance';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  requestId: string;
  timestamp: string;
  endpoint: string;
  
  // Timing metrics
  totalDuration: number;
  queueTime: number;
  processingTime: number;
  responseTime: number;
  
  // Request metrics
  requestSize: number;
  responseSize: number;
  retryCount: number;
  
  // Status metrics
  success: boolean;
  errorCode?: string;
  statusCode?: number;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number; // requests per minute
  lastUpdated: string;
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly cleanupInterval = 300000; // 5 minutes
  private lastCleanup = Date.now();

  /**
   * Records a performance metric
   */
  public recordMetric(metric: PerformanceMetrics): void {
    try {
      this.metrics.push({
        ...metric,
        timestamp: new Date().toISOString()
      });

      // Cleanup old metrics if needed
      if (Date.now() - this.lastCleanup > this.cleanupInterval) {
        this.cleanupOldMetrics();
      }

      // Log performance issues
      this.checkPerformanceThresholds(metric);

    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  /**
   * Gets current performance statistics
   */
  public getStats(): PerformanceStats {
    try {
      if (this.metrics.length === 0) {
        return this.getEmptyStats();
      }

      const recentMetrics = this.getRecentMetrics(3600000); // Last hour
      const successfulMetrics = recentMetrics.filter(m => m.success);
      const responseTimes = recentMetrics.map(m => m.totalDuration).sort((a, b) => a - b);

      return {
        totalRequests: recentMetrics.length,
        successfulRequests: successfulMetrics.length,
        failedRequests: recentMetrics.length - successfulMetrics.length,
        averageResponseTime: this.calculateAverage(responseTimes),
        p95ResponseTime: this.calculatePercentile(responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(responseTimes, 99),
        errorRate: recentMetrics.length > 0 
          ? ((recentMetrics.length - successfulMetrics.length) / recentMetrics.length) * 100 
          : 0,
        throughput: this.calculateThroughput(recentMetrics),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to calculate performance stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Gets performance recommendations based on current metrics
   */
  public getRecommendations(): string[] {
    try {
      const stats = this.getStats();
      const recommendations: string[] = [];

      // Response time recommendations
      if (stats.averageResponseTime > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE) {
        recommendations.push('Consider reducing max_tokens or using a faster model');
        recommendations.push('Implement request batching for multiple operations');
      } else if (stats.averageResponseTime > PERFORMANCE_THRESHOLDS.ACCEPTABLE_RESPONSE) {
        recommendations.push('Monitor response times - approaching slow threshold');
      }

      // Error rate recommendations
      if (stats.errorRate > PERFORMANCE_THRESHOLDS.HIGH_ERROR_RATE) {
        recommendations.push('High error rate detected - check API configuration and network');
        recommendations.push('Consider implementing circuit breaker pattern');
      } else if (stats.errorRate > PERFORMANCE_THRESHOLDS.LOW_ERROR_RATE) {
        recommendations.push('Error rate is elevated - monitor for issues');
      }

      // Throughput recommendations
      if (stats.throughput < 1) {
        recommendations.push('Low throughput - consider increasing concurrent request limit');
      } else if (stats.throughput > 30) {
        recommendations.push('High throughput - monitor for rate limiting');
      }

      // P99 response time recommendations
      if (stats.p99ResponseTime > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE * 2) {
        recommendations.push('Some requests are very slow - investigate timeout configurations');
      }

      return recommendations;

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return ['Unable to generate recommendations due to monitoring error'];
    }
  }

  /**
   * Checks if current performance meets thresholds
   */
  public isPerformanceHealthy(): boolean {
    try {
      const stats = this.getStats();
      
      return (
        stats.averageResponseTime < PERFORMANCE_THRESHOLDS.ACCEPTABLE_RESPONSE &&
        stats.errorRate < PERFORMANCE_THRESHOLDS.LOW_ERROR_RATE &&
        stats.p95ResponseTime < PERFORMANCE_THRESHOLDS.SLOW_RESPONSE
      );

    } catch (error) {
      console.error('Failed to check performance health:', error);
      return false;
    }
  }

  /**
   * Gets detailed performance report
   */
  public getDetailedReport(): {
    stats: PerformanceStats;
    recommendations: string[];
    isHealthy: boolean;
    recentErrors: Array<{ code: string; count: number; percentage: number }>;
  } {
    try {
      const stats = this.getStats();
      const recommendations = this.getRecommendations();
      const isHealthy = this.isPerformanceHealthy();
      const recentErrors = this.getRecentErrorBreakdown();

      return {
        stats,
        recommendations,
        isHealthy,
        recentErrors
      };

    } catch (error) {
      console.error('Failed to generate detailed report:', error);
      return {
        stats: this.getEmptyStats(),
        recommendations: ['Error generating report'],
        isHealthy: false,
        recentErrors: []
      };
    }
  }

  /**
   * Cleans up old metrics to prevent memory issues
   */
  private cleanupOldMetrics(): void {
    try {
      const cutoffTime = Date.now() - 3600000; // Keep last hour
      this.metrics = this.metrics.filter(metric => 
        new Date(metric.timestamp).getTime() > cutoffTime
      );

      // Limit total metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      this.lastCleanup = Date.now();
      console.info(`Performance metrics cleanup completed. Retained ${this.metrics.length} metrics.`);

    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * Checks performance thresholds and logs warnings
   */
  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    try {
      // Check response time
      if (metric.totalDuration > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE) {
        console.warn(`Slow response detected: ${metric.totalDuration}ms for ${metric.endpoint}`);
      }

      // Check for errors
      if (!metric.success && metric.errorCode) {
        console.warn(`Request failed: ${metric.errorCode} for ${metric.endpoint}`);
      }

      // Check retry count
      if (metric.retryCount > 2) {
        console.warn(`High retry count: ${metric.retryCount} for ${metric.endpoint}`);
      }

    } catch (error) {
      console.error('Failed to check performance thresholds:', error);
    }
  }

  /**
   * Gets metrics from recent time period
   */
  private getRecentMetrics(timeWindowMs: number): PerformanceMetrics[] {
    const cutoffTime = Date.now() - timeWindowMs;
    return this.metrics.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Calculates average of numeric array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculates percentile of numeric array
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Calculates throughput (requests per minute)
   */
  private calculateThroughput(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const timeSpanMs = Date.now() - new Date(metrics[0].timestamp).getTime();
    const timeSpanMinutes = timeSpanMs / 60000;
    
    return timeSpanMinutes > 0 ? metrics.length / timeSpanMinutes : 0;
  }

  /**
   * Gets breakdown of recent errors
   */
  private getRecentErrorBreakdown(): Array<{ code: string; count: number; percentage: number }> {
    try {
      const recentMetrics = this.getRecentMetrics(3600000); // Last hour
      const errorMetrics = recentMetrics.filter(m => !m.success && m.errorCode);
      
      const errorCounts: Record<string, number> = {};
      errorMetrics.forEach(metric => {
        if (metric.errorCode) {
          errorCounts[metric.errorCode] = (errorCounts[metric.errorCode] || 0) + 1;
        }
      });

      return Object.entries(errorCounts)
        .map(([code, count]) => ({
          code,
          count,
          percentage: (count / errorMetrics.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

    } catch (error) {
      console.error('Failed to get error breakdown:', error);
      return [];
    }
  }

  /**
   * Returns empty stats object
   */
  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Convenience function to record a metric
 */
export function recordPerformanceMetric(metric: Omit<PerformanceMetrics, 'timestamp'>): void {
  globalPerformanceMonitor.recordMetric(metric as PerformanceMetrics);
}

/**
 * Convenience function to get performance stats
 */
export function getPerformanceStats(): PerformanceStats {
  return globalPerformanceMonitor.getStats();
}

/**
 * Convenience function to check if performance is healthy
 */
export function isPerformanceHealthy(): boolean {
  return globalPerformanceMonitor.isPerformanceHealthy();
}