import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use(config => {
  const noAuthRoutes = ['/users/register/', '/users/login/']
  const isAuthRoute = noAuthRoutes.some(r => config.url?.includes(r))
  
  if (!isAuthRoute) {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api