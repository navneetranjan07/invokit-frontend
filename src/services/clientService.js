import api from './api'

export const getClients = async (params = {}) => {
  const res = await api.get('/clients', { params })
  return res.data.data
}

export const getActiveClients = async () => {
  const res = await api.get('/clients/active')
  return res.data.data
}

export const getClientById = async (id) => {
  const res = await api.get(`/clients/${id}`)
  return res.data.data
}

export const createClient = async (data) => {
  const res = await api.post('/clients', data)
  return res.data.data
}

export const updateClient = async (id, data) => {
  const res = await api.put(`/clients/${id}`, data)
  return res.data.data
}

export const deleteClient = async (id) => {
  const res = await api.delete(`/clients/${id}`)
  return res.data
}

export const deactivateClient = async (id) => {
  const res = await api.patch(`/clients/${id}/deactivate`)
  return res.data.data
}

export const activateClient = async (id) => {
  const res = await api.patch(`/clients/${id}/activate`)
  return res.data.data
}