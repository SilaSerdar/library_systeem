export interface User {
  id: string
  email: string
  name: string
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN'
}

export const auth = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token: string) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),
  isWorker: () => {
    const user = auth.getUser()
    return user?.role === 'WORKER' || user?.role === 'ADMIN'
  },
  logout: () => {
    auth.removeToken()
    auth.removeUser()
  },
}

