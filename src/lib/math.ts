export function round(n: number, d: number): number {
  const factor = Math.pow(10, d);
  return Math.round(n * factor) / factor;
}
