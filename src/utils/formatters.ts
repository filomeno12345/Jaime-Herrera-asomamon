/**
 * Utility functions for Colombian currency and number formatting
 */

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  
  // Colombian format: $ 51.748 (using dot for thousands, no decimals for COP usually)
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toLocaleString('es-CO');
  
  return `${isNegative ? '-$ ' : '$ '}${formatted}`;
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0';
  }
  return amount.toLocaleString('es-CO');
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Safely parses numbers from Excel or user input, handling Colombian and standard formats:
 * e.g. "$ 3.044", "3.044", "3,044", "51.748", "1.200.000", "$ 1.200.000", "45", "10.5"
 */
export function parseColombianNumber(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') {
    return isNaN(raw) ? 0 : raw;
  }

  const str = String(raw).trim();
  if (!str) return 0;

  // Clean out currency signs, spaces, letters (COP, etc.)
  const clean = str.replace(/[$\sA-Za-z]/g, '');
  if (!clean) return 0;

  // Check if contains both dot and comma e.g. "1.500,50" or "1,500.50"
  if (clean.includes('.') && clean.includes(',')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      // "1.500,50" -> dots are thousands, comma is decimal
      const normalized = clean.replace(/\./g, '').replace(',', '.');
      const val = parseFloat(normalized);
      return isNaN(val) ? 0 : Math.round(val);
    } else {
      // "1,500.50" -> commas are thousands, dot is decimal
      const normalized = clean.replace(/,/g, '');
      const val = parseFloat(normalized);
      return isNaN(val) ? 0 : Math.round(val);
    }
  }

  // If only dot:
  // e.g. "3.044" or "51.748" or "1.500.000" (Colombian thousands separator)
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length > 2) {
      return parseInt(clean.replace(/\./g, ''), 10) || 0;
    }
    // If followed by exactly 3 digits, e.g. "3.044" or "51.748" -> thousands separator
    if (parts[1].length === 3) {
      return parseInt(parts[0] + parts[1], 10) || 0;
    }
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  }

  // If only comma:
  if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts.length > 2 || parts[1].length === 3) {
      return parseInt(clean.replace(/,/g, ''), 10) || 0;
    }
    const val = parseFloat(clean.replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }

  const result = parseFloat(clean);
  return isNaN(result) ? 0 : result;
}
