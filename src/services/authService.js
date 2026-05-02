import api from './api'

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password })
  return res.data.data
}

export const registerUser = async (data) => {
  const res = await api.post('/auth/register', data)
  return res.data.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data.data
}