/**
 * All monetary values in the database are stored as integers in paisa.
 * 1 taka = 100 paisa.
 * This file is the single source of truth for all currency conversion and display.
 * Never import currency conversion logic from anywhere else.
 */

/** Convert taka (user-facing, possibly decimal) to paisa (integer, DB-safe) */
export function takaToPaisa(taka: number): number {
  return Math.round(taka * 100);
}

/** Convert paisa (DB integer) to taka (display decimal) */
export function paisaToTaka(paisa: number): number {
  return paisa / 100;
}

/**
 * Format paisa as a display string in taka.
 * Examples: 150000 → "৳1,500.00"  |  50 → "৳0.50"
 */
export function formatTaka(paisa: number): string {
  const taka = paisaToTaka(paisa);
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(taka);
}

/**
 * Distribute a total paisa amount equally among `n` people.
 * The first person absorbs any rounding remainder (1 paisa max).
 * Returns an array of paisa amounts, length === n, sum === totalPaisa.
 */
export function distributeEqually(totalPaisa: number, n: number): number[] {
  const base = Math.floor(totalPaisa / n);
  const remainder = totalPaisa - base * n;
  return Array.from({ length: n }, (_, i) =>
    i === 0 ? base + remainder : base,
  );
}

/**
 * Validate that an array of paisa split amounts sums exactly to the total.
 * Use this before writing any expense split to the DB.
 */
export function validateSplitSum(
  splits: number[],
  totalPaisa: number,
): boolean {
  return splits.reduce((a, b) => a + b, 0) === totalPaisa;
}
