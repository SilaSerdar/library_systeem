export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  get: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const response = await fetch(`${API_URL}${endpoint}`, { headers })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`)
    return data
  },
  
  post: async (endpoint: string, data: any, token?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const responseData = await response.json()
    if (!response.ok) throw new Error(responseData.error || `HTTP error! status: ${response.status}`)
    return responseData
  },
  
  patch: async (endpoint: string, data: any, token?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })
    const responseData = await response.json()
    if (!response.ok) throw new Error(responseData.error || `HTTP error! status: ${response.status}`)
    return responseData
  },
  
  delete: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    const responseData = await response.json()
    if (!response.ok) throw new Error(responseData.error || `HTTP error! status: ${response.status}`)
    return responseData
  },
}

