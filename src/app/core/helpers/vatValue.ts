export function getNumberVat(vatValue: string): number {
  return !isNaN(Number(vatValue)) ? Number(vatValue) : 0;
}

export function getPayloadVat(vatValue: string): string | null {
  return !isNaN(Number(vatValue)) ? vatValue : null;
}
