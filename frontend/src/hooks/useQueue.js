import { useState, useEffect, useCallback } from 'react';
import { getTodayQueue, completePatient } from '../services/queueService';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

export const useQueue = () => {
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const socket = io(API_URL);

  const refresh = useCallback(async () => {
    try {
      const queueData = await getTodayQueue();
      setQueue(queueData.queue || []);
      setStats(queueData.stats || {});
      // Determine next patient from queue data (first pending patient)
      const nextPatient = (queueData.queue || []).find(p => p.status !== 'completed') || null;
      setCurrentPatient(nextPatient);
    } catch (err) {
      console.error('[useQueue] Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refresh();
    // Listen for real-time updates
    socket.on('queue_updated', () => {
      refresh();
    });
    socket.on('all_queues_updated', () => {
      refresh();
    });
    return () => {
      socket.disconnect();
    };
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
