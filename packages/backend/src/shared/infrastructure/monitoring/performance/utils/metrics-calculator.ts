//  "metrics-calculator.ts"
//  metropolitan backend
//  Utility functions for performance metrics calculations

export class MetricsCalculator {
  /**
   * Calculate average of numbers
   */
  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Calculate sum of numbers
   */
  static sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  /**
   * Calculate percentile
   */
  static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Calculate min value
   */
  static min(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.min(...numbers);
  }
  
  /**
   * Calculate max value
   */
  static max(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
  }
}