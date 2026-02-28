import api from './api';

export const getTodayQueue = async () => (await api.get('/queue/today')).data;
export const completePatient = async (id) => (await api.post(`/queue/complete/${id}`)).data;
