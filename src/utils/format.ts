import { CATEGORY_PRICE_DEFAULTS } from '../data/defaultProducts';

/**
 * Format currency in Algerian Dinars (DA / د.ج)
 */
export function formatDA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0,00 DA';
  const parts = amount.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart},${parts[1]} DA`;
}

/**
 * Simple formatted DA without decimals if integer
 */
export function formatDACompact(amount: number): string {
  if (isNaN(amount)) return '0 DA';
  const isInt = Math.floor(amount) === amount;
  if (isInt) {
    return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA`;
  }
  return formatDA(amount);
}

/**
 * Calculate Algerian Cash Change breakdown (Billet & Pièces de monnaie algérienne)
 * Banknotes: 2000 DA, 1000 DA, 500 DA
 * Coins: 200 DA, 100 DA, 50 DA, 20 DA, 10 DA, 5 DA
 */
export interface DenominationBreakdown {
  value: number;
  type: 'billet' | 'piece';
  label: string;
  count: number;
}

export function calculateAlgerianChange(total: number, tendered: number): {
  changeAmount: number;
  breakdown: DenominationBreakdown[];
} {
  const diff = tendered - total;
  if (diff <= 0) {
    return { changeAmount: 0, breakdown: [] };
  }

  const denominations: { value: number; type: 'billet' | 'piece'; label: string }[] = [
    { value: 2000, type: 'billet', label: 'Billet 2 000 DA' },
    { value: 1000, type: 'billet', label: 'Billet 1 000 DA' },
    { value: 500, type: 'billet', label: 'Billet 500 DA' },
    { value: 200, type: 'piece', label: 'Pièce 200 DA' },
    { value: 100, type: 'piece', label: 'Pièce 100 DA' },
    { value: 50, type: 'piece', label: 'Pièce 50 DA' },
    { value: 20, type: 'piece', label: 'Pièce 20 DA' },
    { value: 10, type: 'piece', label: 'Pièce 10 DA' },
    { value: 5, type: 'piece', label: 'Pièce 5 DA' },
  ];

  let remaining = Math.round(diff);
  const breakdown: DenominationBreakdown[] = [];

  for (const denom of denominations) {
    if (remaining >= denom.value) {
      const count = Math.floor(remaining / denom.value);
      remaining %= denom.value;
      breakdown.push({
        value: denom.value,
        type: denom.type,
        label: denom.label,
        count
      });
    }
  }

  return {
    changeAmount: diff,
    breakdown
  };
}

/**
 * Generate simple pseudo EAN-13 bar pattern representation for SVG rendering
 */
export function getBarcodePattern(code: string): number[] {
  // Return pseudo widths (1, 2, 3, 4 units) based on characters
  const clean = code.replace(/\D/g, '') || '6130000000000';
  const pattern: number[] = [1, 1, 1]; // start guard
  for (let i = 0; i < clean.length; i++) {
    const digit = parseInt(clean[i], 10) || 0;
    pattern.push(
      (digit % 3) + 1,
      ((digit * 2) % 3) + 1,
      ((digit * 3) % 3) + 1,
      1
    );
  }
  pattern.push(1, 1, 1, 1, 1); // end guard
  return pattern;
}

/**
 * Auto-suggest a price in DA for an unknown barcode or product
 */
export function estimatePriceForProduct(name: string, category?: string): number {
  if (category && CATEGORY_PRICE_DEFAULTS[category]) {
    return CATEGORY_PRICE_DEFAULTS[category];
  }
  
  const lower = name.toLowerCase();
  if (lower.includes('huile') || lower.includes('oil')) return 650;
  if (lower.includes('lait') || lower.includes('milk')) return 145;
  if (lower.includes('jus') || lower.includes('juice')) return 150;
  if (lower.includes('eau') || lower.includes('water')) return 45;
  if (lower.includes('chocolat') || lower.includes('biscuit')) return 120;
  if (lower.includes('couscous') || lower.includes('pâtes')) return 160;
  if (lower.includes('fromage') || lower.includes('cheese')) return 320;
  if (lower.includes('savon') || lower.includes('lessive')) return 190;
  if (lower.includes('café') || lower.includes('coffee')) return 260;

  return 150; // generic default in DA
}
