import api from './api'

export const getSettings = async () => {
  const res = await api.get('/settings')
  return res.data.data
}

export const updateSettings = async (data) => {
  const res = await api.put('/settings', data)
  return res.data.data
}

export const getProfile = async () => {
  const res = await api.get('/users/profile')
  return res.data.data
}

export const updateProfile = async (data) => {
  const res = await api.put('/users/profile', data)
  return res.data.data
}

export const changePassword = async (data) => {
  const res = await api.put('/users/change-password', data)
  return res.data
}