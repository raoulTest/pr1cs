// ============================================================================
// ALGERIAN LICENSE PLATE GENERATOR
// ============================================================================
// Format: XXXXX YYY WW (Algerian system)
// XXXXX = 5 digits (vehicle registration)
// YYY = 3 digits (series)
// WW = 2 digits (wilaya/province code)

import { randomInt } from './random';

// Wilaya codes for major Algerian cities
export const WILAYA_CODES = {
  ALGIERS: 16,
  ORAN: 31,
  ANNABA: 23,
  BEJAIA: 6,
  SKIKDA: 21,
  MOSTAGANEM: 27,
  GHAZAOUET: 13,
  CONSTANTINE: 25,
  SETIF: 19,
  BATNA: 5,
  BLIDA: 9,
  TLEMCEN: 13,
  TIZI_OUZOU: 15,
  BOUMERDES: 35,
  CHLEF: 2
};

const WILAYA_CODE_LIST = Object.values(WILAYA_CODES);

export function generateAlgerianLicensePlate(wilayaCode?: number): string {
  const registration = randomInt(10000, 99999).toString();
  const series = randomInt(100, 999).toString();
  const wilaya = wilayaCode || WILAYA_CODE_LIST[Math.floor(Math.random() * WILAYA_CODE_LIST.length)];
  return `${registration} ${series} ${wilaya}`;
}

export function generateAlgerianLicensePlates(count: number, wilayaCode?: number): string[] {
  const plates = new Set<string>();
  while (plates.size < count) {
    plates.add(generateAlgerianLicensePlate(wilayaCode));
  }
  return Array.from(plates);
}

export function getWilayaCodeForTerminal(terminalCode: string): number {
  const codeMap: Record<string, number> = {
    'TER-ALGIERS': WILAYA_CODES.ALGIERS,
    'TER-ORAN': WILAYA_CODES.ORAN,
    'TER-ANNABA': WILAYA_CODES.ANNABA,
    'TER-BEJAIA': WILAYA_CODES.BEJAIA,
    'TER-SKIKDA': WILAYA_CODES.SKIKDA,
    'TER-MOSTAGANEM': WILAYA_CODES.MOSTAGANEM,
    'TER-GHAZAOUET': WILAYA_CODES.GHAZAOUET,
  };
  
  return codeMap[terminalCode] || WILAYA_CODES.ALGIERS;
}
