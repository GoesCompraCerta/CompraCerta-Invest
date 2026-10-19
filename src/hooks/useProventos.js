import { useState, useEffect, useCallback } from 'react';
import { proventosStorage } from '../services/storageService';
import {
  createProvento as createProventoRequest,
  deleteProvento as deleteProventoRequest,
  listProventos,
  updateProvento as updateProventoRequest
} from '../services/proventosService';

export const useProventos = (isAuthenticated) => {
  const [proventos, setProventos] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProventos([]);
      return undefined;
    }

    let cancelled = false;
    const loadProventos = async () => {
      try {
        let loaded = await listProventos();
        if (loaded.length === 0) {
          const legacy = proventosStorage.get();
          if (legacy.length > 0) {
            loaded = [];
            for (const provento of legacy) {
              loaded.push(await createProventoRequest(provento));
            }
          }
        }
        if (!cancelled) {
          proventosStorage.set([]);
          setProventos(loaded);
        }
      } catch {
        if (!cancelled) setProventos(proventosStorage.get());
      }
    };

    loadProventos();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const addProvento = useCallback(async (newProvento) => {
    try {
      const saved = await createProventoRequest(newProvento);
      setProventos((current) => [...current, saved]);
      return saved;
    } catch {
      const saved = { id: String(Date.now()), ...newProvento };
      const next = [...proventos, saved];
      proventosStorage.set(next);
      setProventos(next);
      return saved;
    }
  }, [proventos]);

  const updateProvento = useCallback(async (proventoId, updates) => {
    try {
      const saved = await updateProventoRequest(proventoId, updates);
      setProventos((current) => current.map((item) =>
        String(item.id) === String(proventoId) ? saved : item
      ));
      return saved;
    } catch {
      const next = proventos.map((item) =>
        String(item.id) === String(proventoId) ? { ...item, ...updates } : item
      );
      proventosStorage.set(next);
      setProventos(next);
      return null;
    }
  }, [proventos]);

  const deleteProvento = useCallback(async (proventoId) => {
    try {
      await deleteProventoRequest(proventoId);
      setProventos((current) => current.filter(
        (item) => String(item.id) !== String(proventoId)
      ));
      return true;
    } catch {
      const next = proventos.filter((item) => String(item.id) !== String(proventoId));
      proventosStorage.set(next);
      setProventos(next);
      return false;
    }
  }, [proventos]);

  return {
    proventos,
    setProventos,
    addProvento,
    updateProvento,
    deleteProvento
  };
};
