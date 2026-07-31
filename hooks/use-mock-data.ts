"use client";

import { useState, useEffect } from 'react';

export function useMockData<T>(data: T[], delay = 600) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(data);
      setIsLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [data, delay]);

  return { data: items, isLoading, error: null };
}
