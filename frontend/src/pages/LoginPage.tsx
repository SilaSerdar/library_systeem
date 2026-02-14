import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')
  const [workerEmail, setWorkerEmail] = useState('')
  const [workerPassword, setWorkerPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', {
        email: customerEmail,
        password: customerPassword,
      })
      
      auth.setToken(response.token)
      auth.setUser(response.user)
      
      if (response.user.role === 'WORKER' || response.user.role === 'ADMIN') {
        navigate('/worker')
      } else {
        navigate('/customer')
      }
      
      toast({
        title: 'Başarılı',
        description: 'Giriş yapıldı',
      })
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Giriş başarısız',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', {
        email: workerEmail,
        password: workerPassword,
      })
      
      auth.setToken(response.token)
      auth.setUser(response.user)
      
      if (response.user.role === 'WORKER' || response.user.role === 'ADMIN') {
        navigate('/worker')
      } else {
        navigate('/customer')
      }
      
      toast({
        title: 'Başarılı',
        description: 'Giriş yapıldı',
      })
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Giriş başarısız',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Kütüphane Yönetim Sistemi</CardTitle>
          <CardDescription className="text-center">Lütfen giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Müşteri</TabsTrigger>
              <TabsTrigger value="worker">Çalışan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer">
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Şifre</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="worker">
              <form onSubmit={handleWorkerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-email">Email</Label>
                  <Input
                    id="worker-email"
                    type="email"
                    placeholder="calisan@kutuphane.com"
                    value={workerEmail}
                    onChange={(e) => setWorkerEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-password">Şifre</Label>
                  <Input
                    id="worker-password"
                    type="password"
                    value={workerPassword}
                    onChange={(e) => setWorkerPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

