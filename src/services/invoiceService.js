import api from './api'

export const getInvoices = async (params = {}) => {
  const res = await api.get('/invoices', { params })
  return res.data.data
}

export const getInvoiceById = async (id) => {
  const res = await api.get(`/invoices/${id}`)
  return res.data.data
}

export const createInvoice = async (data) => {
  const res = await api.post('/invoices', data)
  return res.data.data
}

export const updateInvoice = async (id, data) => {
  const res = await api.put(`/invoices/${id}`, data)
  return res.data.data
}

export const deleteInvoice = async (id) => {
  const res = await api.delete(`/invoices/${id}`)
  return res.data
}

export const sendInvoice = async (id) => {
  const res = await api.post(`/invoices/${id}/send`)
  return res.data.data
}

export const markInvoicePaid = async (id) => {
  const res = await api.post(`/invoices/${id}/mark-paid`)
  return res.data.data
}

export const cancelInvoice = async (id) => {
  const res = await api.post(`/invoices/${id}/cancel`)
  return res.data.data
}

export const duplicateInvoice = async (id) => {
  const res = await api.post(`/invoices/${id}/duplicate`)
  return res.data.data
}

export const downloadInvoicePdf = async (id) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  return res.data
}

export const getOverdueInvoices = async () => {
  const res = await api.get('/invoices/overdue')
  return res.data.data
}