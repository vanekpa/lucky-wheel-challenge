import { useState, useEffect } from 'react';

export const useTurnTimer = () => {
  const [turnTimer, setTurnTimer] = useState(0); // 0 = disabled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage (set by PlayerSetup)
    const localValue = localStorage.getItem('turn_timer');
    if (localValue !== null) {
      setTurnTimer(parseInt(localValue) || 0);
    }
    setLoading(false);
  }, []);

  const updateTurnTimer = (value: number) => {
    setTurnTimer(value);
    localStorage.setItem('turn_timer', value.toString());
  };

  return { turnTimer, setTurnTimer: updateTurnTimer, loading };
};
