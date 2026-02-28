import api from './api';

export const searchMedicines = async (query, { limit = 15, category = '' } = {}) => {
  if (!query || query.trim().length < 2) return [];
  const { data } = await api.get('/medicines', {
    params: { search: query.trim(), limit, ...(category && { category }) },
  });
  return data.medicines || [];
};

export const getMedicineById = async (id) => {
  const { data } = await api.get(`/medicines/${id}`);
  return data;
};

export const getCategories = async () => {
  const { data } = await api.get('/medicines/categories');
  return data;
};
