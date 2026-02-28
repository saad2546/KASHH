import { useState, useEffect, useCallback } from 'react';
import { getTodayQueue, getNextPatient, completePatient } from '../services/queueService';
import { toast } from 'sonner';

export const useQueue = () => {
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [queueData, nextData] = await Promise.all([
        getTodayQueue(), getNextPatient(),
      ]);
      setQueue(queueData.queue || []);
      setStats(queueData.stats || {});
      setCurrentPatient(nextData.patient || null);
    } catch (err) {
      console.error('[useQueue] Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 30 seconds for new patients
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markComplete = useCallback(async (patientId) => {
    try {
      const result = await completePatient(patientId);
      setCurrentPatient(result.next || null);
      setQueue((prev) =>
        prev.map((p) => p.id === patientId ? { ...p, status: 'completed' } : p)
      );
      setStats((prev) => ({
        ...prev,
        waiting: Math.max(0, prev.waiting - 1),
        completed: prev.completed + 1,
      }));
      if (result.next) {
        toast.success(`Next: Token ${result.next.tokenNumber} — ${result.next.patientName}`);
      } else {
        toast.info('Queue complete for today!');
      }
      return result;
    } catch (err) {
      toast.error('Failed to mark consultation complete');
      throw err;
    }
  }, []);

  return { queue, currentPatient, stats, loading, refresh, markComplete };
};
