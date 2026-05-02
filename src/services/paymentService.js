import api from './api'

export const getPayments = async (params = {}) => {
  const res = await api.get('/payments', { params })
  return res.data.data
}

export const getPaymentsByInvoice = async (invoiceId) => {
  const res = await api.get(`/payments/invoice/${invoiceId}`)
  return res.data.data
}

export const recordPayment = async (data) => {
  const res = await api.post('/payments', data)
  return res.data.data
}

export const deletePayment = async (id) => {
  const res = await api.delete(`/payments/${id}`)
  return res.data
}