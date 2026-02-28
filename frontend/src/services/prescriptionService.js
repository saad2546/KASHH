import api from './api';

export const validateWithAI = async (patient, medicines, diagnosis) =>
  (await api.post('/ai/validate-prescription', { patient, medicines, diagnosis })).data;

export const createPrescription = async (payload) =>
  (await api.post('/prescriptions', payload)).data;

export const listPrescriptions = async (page = 1) =>
  (await api.get('/prescriptions', { params: { page } })).data;
