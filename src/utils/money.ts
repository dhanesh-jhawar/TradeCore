/**
 * Utility for exact monetary calculations.
 * Avoids IEEE 754 floating point inaccuracies by converting to cents (integers)
 * for arithmetic operations.
 */
export class Money {
  /**
   * Safely rounds a float to the nearest 2 decimal places and returns a float.
   */
  static round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Safely adds two monetary floats.
   */
  static add(a: number, b: number): number {
    const centsA = Math.round(a * 100);
    const centsB = Math.round(b * 100);
    return (centsA + centsB) / 100;
  }

  /**
   * Safely subtracts monetary float b from a.
   */
  static subtract(a: number, b: number): number {
    const centsA = Math.round(a * 100);
    const centsB = Math.round(b * 100);
    return (centsA - centsB) / 100;
  }

  /**
   * Safely multiplies a monetary float by an integer quantity.
   */
  static multiply(price: number, quantity: number): number {
    const cents = Math.round(price * 100);
    return (cents * quantity) / 100;
  }
}
