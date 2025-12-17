import { useState, useEffect } from 'react';

export const useTurnTimer = () => {
  const [turnTimer, setTurnTimer] = useState(10); // 10s default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage (set by PlayerSetup), default to 10
    const localValue = localStorage.getItem('turn_timer');
    if (localValue !== null) {
      setTurnTimer(parseInt(localValue) || 10);
    } else {
      // Set default in localStorage
      localStorage.setItem('turn_timer', '10');
    }
    setLoading(false);
  }, []);

  const updateTurnTimer = (value: number) => {
    setTurnTimer(value);
    localStorage.setItem('turn_timer', value.toString());
  };

  return { turnTimer, setTurnTimer: updateTurnTimer, loading };
};
