import api from './api'

export const getDashboardStats = async () => {
  const res = await api.get('api/dashboard/stats')
  return res.data.data
}

export const getRevenueChart = async (months = 6) => {
  const res = await api.get('api/dashboard/revenue-chart', { params: { months } })
  return res.data.data
}