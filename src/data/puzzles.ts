export const puzzles = [
  {
    id: '1',
    phrase: 'KOLOTOČ ŠTĚSTÍ',
    category: 'TV Show',
  },
  {
    id: '2',
    phrase: 'NEJLEPŠÍ PŘÍTEL ČLOVĚKA',
    category: 'Přísloví',
  },
  {
    id: '3',
    phrase: 'RANNÍ PTÁČE DÁL DOSKÁČE',
    category: 'Přísloví',
  },
  {
    id: '4',
    phrase: 'ZLATÁ PRAHA',
    category: 'Místo',
  },
  {
    id: '5',
    phrase: 'VŠECHNO ZLÉ JE PRO NĚCO DOBRÉ',
    category: 'Přísloví',
  },
  {
    id: '6',
    phrase: 'Karel GOTT',
    category: 'Osobnost',
  },
  {
    id: '7',
    phrase: 'VÁNOČNÍ STROMEK',
    category: 'Tradice',
  },
  {
    id: '8',
    phrase: 'ČESKÉ DRÁHY',
    category: 'Doprava',
  },
];

export const wheelSegments = [
  // První polovina (0-15)
  { id: 0, value: 'NIČ', color: 'nic', type: 'nic' as const },
  { id: 1, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 2, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 3, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 4, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 5, value: 1000, color: 'wheel-yellow', type: 'points' as const },
  { id: 6, value: 2000, color: 'wheel-blue', type: 'points' as const },
  { id: 7, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 8, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 9, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 10, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 11, value: 1000, color: 'wheel-yellow', type: 'points' as const },
  { id: 12, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 13, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 14, value: 2000, color: 'wheel-blue', type: 'points' as const },
  { id: 15, value: 100, color: 'wheel-purple', type: 'points' as const },
  
  // Druhá polovina (16-31)
  { id: 16, value: 'BANKROT', color: 'bankrot', type: 'bankrot' as const },
  { id: 17, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 18, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 19, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 20, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 21, value: 2000, color: 'wheel-blue', type: 'points' as const },
  { id: 22, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 23, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 24, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 25, value: 1000, color: 'wheel-yellow', type: 'points' as const },
  { id: 26, value: 100, color: 'wheel-purple', type: 'points' as const },
  { id: 27, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 28, value: 1000, color: 'wheel-yellow', type: 'points' as const },
  { id: 29, value: 200, color: 'wheel-red', type: 'points' as const },
  { id: 30, value: 500, color: 'wheel-green', type: 'points' as const },
  { id: 31, value: 100, color: 'wheel-purple', type: 'points' as const },
];
