// Generate a unique session code like "KOLO-5847"
export const generateSessionCode = (): string => {
  const prefix = 'KOLO';
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${prefix}-${number}`;
};

// Validate session code format
export const isValidSessionCode = (code: string): boolean => {
  return /^KOLO-\d{4}$/.test(code.toUpperCase());
};

// Normalize session code (uppercase, trim)
export const normalizeSessionCode = (code: string): string => {
  return code.trim().toUpperCase();
};
