//  "vat-calculator.service.ts"
//  metropolitan backend
//  Service for VAT calculations

export interface VatCalculation {
  netAmount: number;
  vatAmount: number;
}

export class VatCalculatorService {
  private static readonly VAT_RATE = 0.23; // Polish standard VAT rate
  
  /**
   * Calculate VAT amounts from total amount
   */
  static calculate(totalAmount: number): VatCalculation {
    const netAmount = totalAmount / (1 + this.VAT_RATE);
    const vatAmount = totalAmount - netAmount;
    
    return { netAmount, vatAmount };
  }
  
  /**
   * Get VAT rate percentage
   */
  static getVatRatePercentage(): number {
    return this.VAT_RATE * 100;
  }
}