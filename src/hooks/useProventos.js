import { useState, useEffect, useCallback } from 'react';
import { proventosStorage } from '../services/storageService';

export const useProventos = () => {
  const [proventos, setProventos] = useState(() => proventosStorage.get());

  useEffect(() => {
    proventosStorage.set(proventos);
  }, [proventos]);

  const addProvento = useCallback((newProvento) => {
    setProventos((prev) => [...prev, { id: String(Date.now()), ...newProvento }]);
  }, []);

  const updateProvento = useCallback((proventoId, updates) => {
    setProventos((prev) =>
      prev.map((p) => (p.id === proventoId ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProvento = useCallback((proventoId) => {
    setProventos((prev) => prev.filter((p) => p.id !== proventoId));
  }, []);

  return {
    proventos,
    setProventos,
    addProvento,
    updateProvento,
    deleteProvento
  };
};
