// ============================================================================
// ISO 6346 CONTAINER NUMBER GENERATOR
// ============================================================================
// Format: 4 letters (owner code) + 6 digits + 1 check digit
// Example: MSCU1234567, CMAU7654321

const OWNER_CODES = [
  'MSCU', 'CMAU', 'COSU', 'HLCU', 'EGHU', 'OOLU', 'TXGU', 'MAEU',
  'CMDU', 'PONU', 'KKFU', 'HDMU', 'YMLU', 'ZIMU', 'WHLU', 'NYKU',
  'TCKU', 'APLU', 'ANLU', 'CGMU', 'SUDU', 'EISU', 'PCLU', 'DOLU',
  'ECMU', 'GVCU', 'KMTU', 'LGLU', 'MFTU', 'MMBU', 'MRTU', 'NALU',
  'NOSU', 'NSLU', 'PCVU', 'PLNU', 'PRGU', 'RCLU', 'SGLU',
  'SMLU', 'SNBU', 'SPLU', 'TCLU', 'TRIU', 'TTLU', 'UACU', 'UESU',
  'UNIU', 'VASU', 'WECU', 'XTRU', 'ZCSU'
];

const LETTER_VALUES: Record<string, number> = {
  'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18,
  'I': 19, 'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27,
  'Q': 28, 'R': 29, 'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36,
  'Y': 37, 'Z': 38
};

const POSITION_WEIGHTS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];

function calculateCheckDigit(ownerCode: string, serial: string): string {
  const fullNumber = ownerCode + serial;
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    const char = fullNumber[i];
    if (char === undefined) continue;
    const value = LETTER_VALUES[char] ?? parseInt(char, 10);
    const weight = POSITION_WEIGHTS[i] ?? 1;
    sum += value * weight;
  }
  
  const checkDigit = sum % 11;
  return checkDigit === 10 ? '0' : checkDigit.toString();
}

export function generateContainerNumber(): string {
  const ownerCode = OWNER_CODES[Math.floor(Math.random() * OWNER_CODES.length)] ?? 'MSCU';
  const serial = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const checkDigit = calculateCheckDigit(ownerCode, serial);
  return `${ownerCode}${serial}${checkDigit}`;
}

export function generateContainerNumbers(count: number): string[] {
  const numbers = new Set<string>();
  while (numbers.size < count) {
    numbers.add(generateContainerNumber());
  }
  return Array.from(numbers);
}

export function isValidContainerNumber(number: string): boolean {
  if (number.length !== 11) return false;
  
  const ownerCode = number.substring(0, 4);
  const serial = number.substring(4, 10);
  const checkDigit = number.substring(10, 11);
  
  const calculatedDigit = calculateCheckDigit(ownerCode, serial);
  return checkDigit === calculatedDigit;
}
