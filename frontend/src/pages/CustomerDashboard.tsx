import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { useToast } from '@/components/ui/use-toast'
import { BookOpen, Search, Sparkles, LogOut, Download } from 'lucide-react'

function BookSearch() {
  const [search, setSearch] = useState('')
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const token = auth.getToken()!

  const loadAllBooks = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/books?limit=1000', token)
      setBooks(response.books || [])
    } catch (error: any) {
      console.error('Kitap yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Sayfa yüklendiğinde tüm kitapları göster
    loadAllBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      if (search.trim()) {
        // Arama yapıldığında
        const response = await api.get(`/api/books/search/location?search=${encodeURIComponent(search)}`, token)
        setBooks(response.books || [])
      } else {
        // Arama boşsa tüm kitapları göster
        await loadAllBooks()
      }
    } catch (error: any) {
      console.error('Arama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Kitap adı, yazar veya ISBN ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          Ara
        </Button>
      </div>
      
      {books.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">
            {search.trim() ? `Arama Sonuçları (${books.length})` : `Tüm Kitaplar (${books.length})`}
          </h3>
          {books.map((book) => (
            <Card key={book.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Konum:</span> {book.location}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Mevcut:</span> {book.availableCopies} / {book.totalCopies}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!loading && books.length === 0 && (
        <p className="text-center text-muted-foreground">Kitap bulunamadı</p>
      )}
      
      {loading && (
        <p className="text-center text-muted-foreground">Yükleniyor...</p>
      )}
    </div>
  )
}

function Recommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = auth.getToken()!

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const response = await api.get('/api/recommendations', token)
      setRecommendations(response.recommendations || [])
    } catch (error: any) {
      console.error('Öneri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Yükleniyor...</p>

  return (
    <div className="space-y-4">
      {recommendations.length === 0 ? (
        <p className="text-center text-muted-foreground">Henüz öneri bulunmuyor</p>
      ) : (
        recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardHeader>
              <CardTitle>{rec.title}</CardTitle>
              <CardDescription>{rec.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">{rec.reason}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Konum:</span> {rec.location}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Uyum Skoru:</span> {(rec.score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Mevcut: {rec.availableCopies}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function MyRentals() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = auth.getToken()!

  useEffect(() => {
    loadRentals()
  }, [])

  const loadRentals = async () => {
    try {
      const response = await api.get('/api/rentals/my-rentals', token)
      setRentals(response.rentals || [])
    } catch (error: any) {
      console.error('Kiralama yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Yükleniyor...</p>

  return (
    <div className="space-y-4">
      {rentals.length === 0 ? (
        <p className="text-center text-muted-foreground">Henüz kiraladığınız kitap yok</p>
      ) : (
        rentals.map((rental) => (
          <Card key={rental.id}>
            <CardHeader>
              <CardTitle>{rental.book.title}</CardTitle>
              <CardDescription>{rental.book.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Kiralama Tarihi:</span>{' '}
                  {new Date(rental.borrowedAt).toLocaleDateString('tr-TR')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Teslim Tarihi:</span>{' '}
                  {new Date(rental.dueDate).toLocaleDateString('tr-TR')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Durum:</span>{' '}
                  <span className={`font-semibold ${
                    rental.status === 'BORROWED' ? 'text-blue-600' :
                    rental.status === 'OVERDUE' ? 'text-red-600' :
                    'text-green-600'
                  }`}>
                    {rental.status === 'BORROWED' ? 'Ödünç Alındı' :
                     rental.status === 'OVERDUE' ? 'Gecikmiş' :
                     'İade Edildi'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const user = auth.getUser()!
  const { toast } = useToast()

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  const generateIdentityPDF = async () => {
    try {
      // Dynamic import for jsPDF and jsbarcode
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      const jsbarcodeModule = await import('jsbarcode')
      const JsBarcode = jsbarcodeModule.default

      // Create PDF
      const doc = new jsPDF()
      
      // PDF başlığı
      doc.setFontSize(20)
      doc.text('Kütüphane Üyelik Kimliği', 105, 30, { align: 'center' })
      
      // Ayırıcı çizgi
      doc.setLineWidth(0.5)
      doc.line(20, 40, 190, 40)
      
      // Kullanıcı bilgileri
      doc.setFontSize(14)
      doc.text('Üye Bilgileri', 20, 55)
      
      doc.setFontSize(12)
      let yPos = 70
      
      doc.setFont(undefined, 'bold')
      doc.text('İsim:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(user.name, 60, yPos)
      
      yPos += 15
      doc.setFont(undefined, 'bold')
      doc.text('Email:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(user.email, 60, yPos)
      
      yPos += 15
      doc.setFont(undefined, 'bold')
      doc.text('Üye ID:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(user.id, 60, yPos)
      
      // Barkod oluştur
      yPos += 25
      doc.setFont(undefined, 'bold')
      doc.text('Üye Barkodu:', 20, yPos)
      
      // Geçici bir canvas oluştur
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, user.id, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 5
      })
      
      // Canvas'ı PDF'e ekle
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 20, yPos + 5, 100, 25)
      
      // Alt bilgi
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text('Bu belge kütüphane işlemleri için kullanılabilir.', 105, 180, { align: 'center' })
      doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 105, 185, { align: 'center' })
      
      // PDF'i indir
      doc.save(`kutuphane-kimlik-${user.name.replace(/\s+/g, '-')}.pdf`)
      
      toast({
        title: 'Başarılı',
        description: 'Kimlik kartı PDF olarak indirildi',
      })
    } catch (error: any) {
      console.error('PDF oluşturma hatası:', error)
      toast({
        title: 'Hata',
        description: 'PDF oluşturulamadı: ' + error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kütüphane Yönetim Sistemi</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={generateIdentityPDF}>
              <Download className="mr-2 h-4 w-4" />
              Kimlik Kartı İndir
            </Button>
            <span className="text-sm text-muted-foreground">Hoş geldiniz, {user.name}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="search" className="w-full">
          <TabsList>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Kitap Ara
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Önerileri
            </TabsTrigger>
            <TabsTrigger value="rentals">
              <BookOpen className="mr-2 h-4 w-4" />
              Kiraladıklarım
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kitap Konumu Bul</CardTitle>
                <CardDescription>Kitap adı, yazar veya ISBN ile arayın</CardDescription>
              </CardHeader>
              <CardContent>
                <BookSearch />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Kitap Önerileri</CardTitle>
                <CardDescription>Size özel kitap önerileri</CardDescription>
              </CardHeader>
              <CardContent>
                <Recommendations />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rentals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kiraladığım Kitaplar</CardTitle>
                <CardDescription>Kiraladığınız kitapların listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <MyRentals />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

