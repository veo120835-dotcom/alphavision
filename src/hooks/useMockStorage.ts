import { useState, useEffect, useCallback } from 'react';

/**
 * A hook that provides localStorage-based storage for features that don't have
 * database tables yet. This allows components to function with local data storage.
 */
export function useMockStorage<T>(key: string, initialValue: T[] = []) {
  const [data, setData] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [key]);

  const saveData = useCallback((newData: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }, [key]);

  const addItem = useCallback((item: T) => {
    const newData = [...data, item];
    saveData(newData);
    return newData;
  }, [data, saveData]);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const newData = data.map(item => 
      (item as any).id === id ? { ...item, ...updates } : item
    );
    saveData(newData);
    return newData;
  }, [data, saveData]);

  const removeItem = useCallback((id: string) => {
    const newData = data.filter(item => (item as any).id !== id);
    saveData(newData);
    return newData;
  }, [data, saveData]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setData([]);
  }, [key]);

  return {
    data,
    loading,
    setData: saveData,
    addItem,
    updateItem,
    removeItem,
    clear,
    refresh: () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        setData(JSON.parse(stored));
      }
    }
  };
}

/**
 * Generate mock data for demos and testing
 */
export function generateMockId(): string {
  return crypto.randomUUID();
}

export function generateMockTimestamp(): string {
  return new Date().toISOString();
}
