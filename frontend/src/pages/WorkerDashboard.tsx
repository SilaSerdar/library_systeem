import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { useToast } from '@/components/ui/use-toast'
import { BookOpen, Search, ShoppingCart, Package, LogOut, Plus, BookPlus, UserPlus, Clock, Edit, Trash2, Settings, RotateCcw } from 'lucide-react'

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

function RentalManagement() {
  const [bookId, setBookId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dueDays, setDueDays] = useState('14')
  const [loading, setLoading] = useState(false)
  const [allBooks, setAllBooks] = useState<any[]>([])
  const token = auth.getToken()!
  const { toast } = useToast()

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      const response = await api.get('/api/books?limit=1000', token)
      setAllBooks(response.books || [])
    } catch (error: any) {
      console.error('Kitap yükleme hatası:', error)
    }
  }

  const handleRental = async () => {
    if (!bookId || !customerId) {
      toast({
        title: 'Hata',
        description: 'Lütfen kitap ve müşteri seçin',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await api.post('/api/rentals', {
        bookId,
        customerId,
        dueDays: parseInt(dueDays),
      }, token)
      
      toast({
        title: 'Başarılı',
        description: 'Kitap başarıyla kiralandı',
      })
      
      setBookId('')
      setCustomerId('')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kiralama başarısız',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Kiralama</CardTitle>
          <CardDescription>Kitap kiralama işlemi yapın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="book-select">Kitap</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger id="book-select">
                <SelectValue placeholder="Kitap seçin" />
              </SelectTrigger>
              <SelectContent>
                {allBooks.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} - {book.author} (Mevcut: {book.availableCopies})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer-id">Müşteri ID</Label>
            <Input
              id="customer-id"
              placeholder="Müşteri ID girin"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due-days">Teslim Günü</Label>
            <Input
              id="due-days"
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              min="1"
            />
          </div>
          
          <Button onClick={handleRental} disabled={loading} className="w-full">
            {loading ? 'İşleniyor...' : 'Kirala'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function RegisterCustomer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const token = auth.getToken()!
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Şifreler eşleşmiyor',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.post(
        '/api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'CUSTOMER',
        },
        token
      )

      toast({
        title: 'Başarılı',
        description: `Müşteri başarıyla kaydedildi: ${response.user?.email}`,
      })

      // Formu sıfırla
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Müşteri kaydedilemedi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Müşteri Kaydı</CardTitle>
          <CardDescription>Yeni müşteri kaydı oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">İsim Soyisim *</Label>
              <Input
                id="customer-name"
                placeholder="Ad Soyad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email *</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-password">Şifre *</Label>
                <Input
                  id="customer-password"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-confirm-password">Şifre Tekrar *</Label>
                <Input
                  id="customer-confirm-password"
                  type="password"
                  placeholder="Şifreyi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AddBook() {
  const [isbn, setIsbn] = useState('')
  const [loadingISBN, setLoadingISBN] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    publishedYear: '',
    totalCopies: '1',
    location: '',
    imageUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const token = auth.getToken()!
  const { toast } = useToast()

  const fetchBookByISBN = async () => {
    if (!isbn.trim()) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen ISBN girin',
        variant: 'destructive',
      })
      return
    }

    setLoadingISBN(true)
    try {
      const response = await api.get(`/api/books/search-isbn/${encodeURIComponent(isbn)}`, token)
      if (response.book) {
        setFormData({
          title: response.book.title || '',
          author: response.book.author || '',
          isbn: response.book.isbn || isbn,
          description: response.book.description || '',
          category: '',
          publishedYear: response.book.publishedYear ? String(response.book.publishedYear) : '',
          totalCopies: '1',
          location: '',
          imageUrl: response.book.imageUrl || '',
        })
        toast({
          title: 'Başarılı',
          description: 'Kitap bilgileri yüklendi',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kitap bilgisi bulunamadı',
        variant: 'destructive',
      })
    } finally {
      setLoadingISBN(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/books', formData, token)
      
      toast({
        title: response.action === 'updated' ? 'Kitap Güncellendi' : 'Başarılı',
        description: response.message || 'Kitap başarıyla eklendi',
      })
      
      // Formu sıfırla
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        category: '',
        publishedYear: '',
        totalCopies: '1',
        location: '',
        imageUrl: '',
      })
      setIsbn('')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kitap eklenemedi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ISBN ile Otomatik Yükleme</CardTitle>
          <CardDescription>ISBN girerek kitap bilgilerini otomatik olarak yükleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="ISBN (örn: 9789750719307)"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchBookByISBN()}
            />
            <Button onClick={fetchBookByISBN} disabled={loadingISBN}>
              {loadingISBN ? 'Yükleniyor...' : 'Bilgileri Yükle'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Kitap Ekle</CardTitle>
          <CardDescription>Manuel olarak kitap bilgilerini girin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Kitap Adı *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Yazar *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="örn: Roman, Bilim-Kurgu, Tarih"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishedYear">Yayın Yılı</Label>
                <Input
                  id="publishedYear"
                  type="number"
                  value={formData.publishedYear}
                  onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                  placeholder="2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalCopies">Toplam Kopya Sayısı *</Label>
                <Input
                  id="totalCopies"
                  type="number"
                  min="1"
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Konum *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="örn: A-1-1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Kitap Kapağı URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Kitap kapağı önizleme"
                  className="w-32 h-48 object-cover rounded border"
                />
              )}
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Ekleniyor...' : 'Kitabı Ekle'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function RentedBooksList() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [returningId, setReturningId] = useState<string | null>(null)
  const token = auth.getToken()!
  const { toast } = useToast()

  useEffect(() => {
    loadRentals()
  }, [])

  const loadRentals = async () => {
    try {
      const response = await api.get('/api/rentals/all', token)
      const allRentals = response.rentals || []
      
      // Filter to only show active rentals (BORROWED or OVERDUE)
      const activeRentals = allRentals.filter((rental: any) => 
        rental.status === 'BORROWED' || rental.status === 'OVERDUE'
      )
      
      // Sort rentals: overdue first, then by due date (soonest first)
      const sortedRentals = activeRentals.sort((a: any, b: any) => {
        const now = new Date()
        const aDue = new Date(a.dueDate)
        const bDue = new Date(b.dueDate)
        
        // Overdue books first
        const aOverdue = a.status === 'OVERDUE' || (aDue < now && a.status === 'BORROWED')
        const bOverdue = b.status === 'OVERDUE' || (bDue < now && b.status === 'BORROWED')
        
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
        
        // Then sort by due date (soonest first)
        return aDue.getTime() - bDue.getTime()
      })
      
      setRentals(sortedRentals)
    } catch (error: any) {
      console.error('Kiralama yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (rentalId: string) => {
    setReturningId(rentalId)
    try {
      await api.post(`/api/rentals/${rentalId}/return`, {}, token)
      toast({
        title: 'Başarılı',
        description: 'Kitap başarıyla iade edildi',
      })
      loadRentals()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kitap iade edilemedi',
        variant: 'destructive',
      })
    } finally {
      setReturningId(null)
    }
  }

  if (loading) return <p>Yükleniyor...</p>

  return (
    <div className="space-y-4">
      {rentals.length === 0 ? (
        <p className="text-center text-muted-foreground">Henüz kiralanan kitap yok</p>
      ) : (
        rentals.map((rental) => {
          const dueDate = new Date(rental.dueDate)
          const now = new Date()
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const isOverdue = dueDate < now && rental.status === 'BORROWED'
          
          return (
            <Card key={rental.id} className={isOverdue ? 'border-red-300 bg-red-50' : daysUntilDue <= 3 ? 'border-yellow-300 bg-yellow-50' : ''}>
              <CardHeader>
                <CardTitle>{rental.book.title}</CardTitle>
                <CardDescription>{rental.book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Müşteri:</span> {rental.customer.name} ({rental.customer.email})
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Kiralama Tarihi:</span>{' '}
                    {new Date(rental.borrowedAt).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Teslim Tarihi:</span>{' '}
                    {dueDate.toLocaleDateString('tr-TR')}
                    {isOverdue && (
                      <span className="ml-2 text-red-600 font-semibold">
                        (Gecikmiş - {Math.abs(daysUntilDue)} gün)
                      </span>
                    )}
                    {!isOverdue && daysUntilDue <= 3 && (
                      <span className="ml-2 text-yellow-600 font-semibold">
                        ({daysUntilDue} gün kaldı)
                      </span>
                    )}
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
                  <div className="mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleReturn(rental.id)}
                      disabled={returningId === rental.id}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {returningId === rental.id ? 'İade Ediliyor...' : 'Kitabı İade Et'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

function PurchaseSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    bookTitle: '',
    author: '',
    isbn: '',
    reason: '',
    priority: '5',
  })
  const token = auth.getToken()!
  const { toast } = useToast()

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/api/purchase-suggestions', token)
      setSuggestions(response.suggestions || [])
    } catch (error: any) {
      console.error('Öneri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/purchase-suggestions', {
        ...formData,
        priority: parseInt(formData.priority),
      }, token)
      
      toast({
        title: 'Başarılı',
        description: 'Alım önerisi oluşturuldu',
      })
      
      setFormData({
        bookTitle: '',
        author: '',
        isbn: '',
        reason: '',
        priority: '5',
      })
      setShowForm(false)
      loadSuggestions()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Öneri oluşturulamadı',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/api/purchase-suggestions/${id}/status`, { status }, token)
      toast({
        title: 'Başarılı',
        description: 'Durum güncellendi',
      })
      loadSuggestions()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Durum güncellenemedi',
        variant: 'destructive',
      })
    }
  }

  if (loading && suggestions.length === 0) return <p>Yükleniyor...</p>

  const statusLabels: Record<string, string> = {
    PENDING: 'Beklemede',
    APPROVED: 'Onaylandı',
    REJECTED: 'Reddedildi',
    PURCHASED: 'Satın Alındı',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Alım Önerileri</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Öneri
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Alım Önerisi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Kitap Adı *</Label>
                <Input
                  id="title"
                  value={formData.bookTitle}
                  onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Yazar</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Neden *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Oluştur
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {suggestions.length === 0 ? (
        <p className="text-center text-muted-foreground">Henüz öneri yok</p>
      ) : (
        suggestions.map((suggestion) => (
          <Card key={suggestion.id}>
            <CardHeader>
              <CardTitle>{suggestion.bookTitle}</CardTitle>
              <CardDescription>
                {suggestion.author && `${suggestion.author} • `}
                {suggestion.isbn && `ISBN: ${suggestion.isbn} • `}
                Öncelik: {suggestion.priority}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">{suggestion.reason}</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      suggestion.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      suggestion.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      suggestion.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {statusLabels[suggestion.status] || suggestion.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {suggestion.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(suggestion.id, 'APPROVED')}
                        >
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(suggestion.id, 'REJECTED')}
                        >
                          Reddet
                        </Button>
                      </>
                    )}
                    {suggestion.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(suggestion.id, 'PURCHASED')}
                      >
                        Satın Alındı Olarak İşaretle
                      </Button>
                    )}
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

function BookManagement() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBook, setEditingBook] = useState<any | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    publishedYear: '',
    totalCopies: '',
    availableCopies: '',
    location: '',
    imageUrl: '',
  })
  const token = auth.getToken()!
  const { toast } = useToast()

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      const response = await api.get('/api/books?limit=1000', token)
      setBooks(response.books || [])
    } catch (error: any) {
      console.error('Kitap yükleme hatası:', error)
      toast({
        title: 'Hata',
        description: 'Kitaplar yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (book: any) => {
    setEditingBook(book)
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      category: book.category || '',
      publishedYear: book.publishedYear ? String(book.publishedYear) : '',
      totalCopies: String(book.totalCopies),
      availableCopies: String(book.availableCopies),
      location: book.location || '',
      imageUrl: book.imageUrl || '',
    })
    setShowEditForm(true)
  }

  const handleDelete = async (bookId: string, bookTitle: string) => {
    if (!confirm(`"${bookTitle}" kitabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }

    try {
      await api.delete(`/api/books/${bookId}`, token)
      toast({
        title: 'Başarılı',
        description: 'Kitap başarıyla silindi',
      })
      loadBooks()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kitap silinemedi',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch(`/api/books/${editingBook.id}`, formData, token)
      toast({
        title: 'Başarılı',
        description: 'Kitap başarıyla güncellendi',
      })
      setShowEditForm(false)
      setEditingBook(null)
      loadBooks()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kitap güncellenemedi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && books.length === 0) return <p>Yükleniyor...</p>

  return (
    <div className="space-y-4">
      {showEditForm && editingBook && (
        <Card>
          <CardHeader>
            <CardTitle>Kitap Düzenle</CardTitle>
            <CardDescription>{editingBook.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Kitap Adı *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-author">Yazar *</Label>
                  <Input
                    id="edit-author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-isbn">ISBN</Label>
                  <Input
                    id="edit-isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategori</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="örn: Roman, Bilim-Kurgu, Tarih"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-publishedYear">Yayın Yılı</Label>
                  <Input
                    id="edit-publishedYear"
                    type="number"
                    value={formData.publishedYear}
                    onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                    placeholder="2024"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-totalCopies">Toplam Kopya *</Label>
                  <Input
                    id="edit-totalCopies"
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-availableCopies">Mevcut Kopya *</Label>
                  <Input
                    id="edit-availableCopies"
                    type="number"
                    min="0"
                    max={formData.totalCopies}
                    value={formData.availableCopies}
                    onChange={(e) => setFormData({ ...formData, availableCopies: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Konum *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="örn: A-1-1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-imageUrl">Kitap Kapağı URL</Label>
                <Input
                  id="edit-imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Kitap kapağı önizleme"
                    className="w-32 h-48 object-cover rounded border"
                  />
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditForm(false)
                  setEditingBook(null)
                }}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Kitaplar ({books.length})</h3>
        {books.length === 0 ? (
          <p className="text-center text-muted-foreground">Henüz kitap yok</p>
        ) : (
          books.map((book) => (
            <Card key={book.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="mt-2 space-y-1">
                      {book.isbn && (
                        <p className="text-sm">
                          <span className="font-medium">ISBN:</span> {book.isbn}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Konum:</span> {book.location}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Stok:</span> {book.availableCopies} / {book.totalCopies}
                      </p>
                      {book.category && (
                        <p className="text-sm">
                          <span className="font-medium">Kategori:</span> {book.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(book)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(book.id, book.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default function WorkerDashboard() {
  const navigate = useNavigate()
  const user = auth.getUser()!

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kütüphane Yönetim Sistemi - Çalışan Paneli</h1>
          <div className="flex items-center gap-4">
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
            <TabsTrigger value="add-book">
              <BookPlus className="mr-2 h-4 w-4" />
              Kitap Ekle
            </TabsTrigger>
            <TabsTrigger value="manage-books">
              <Settings className="mr-2 h-4 w-4" />
              Kitap Yönetimi
            </TabsTrigger>
            <TabsTrigger value="register-customer">
              <UserPlus className="mr-2 h-4 w-4" />
              Müşteri Kaydet
            </TabsTrigger>
            <TabsTrigger value="rentals">
              <Package className="mr-2 h-4 w-4" />
              Kiralama Yönetimi
            </TabsTrigger>
            <TabsTrigger value="rented-books">
              <Clock className="mr-2 h-4 w-4" />
              Kiralanan Kitaplar
            </TabsTrigger>
            <TabsTrigger value="purchase-suggestions">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Alım Önerileri
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
          
          <TabsContent value="add-book" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Yeni Kitap Ekle</CardTitle>
                <CardDescription>ISBN ile otomatik yükleme veya manuel kitap ekleme</CardDescription>
              </CardHeader>
              <CardContent>
                <AddBook />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage-books" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kitap Yönetimi</CardTitle>
                <CardDescription>Kitapları düzenleyin, stok yönetimi yapın veya silin</CardDescription>
              </CardHeader>
              <CardContent>
                <BookManagement />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register-customer" className="mt-4">
            <RegisterCustomer />
          </TabsContent>
          
          <TabsContent value="rentals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kitap Kiralama</CardTitle>
                <CardDescription>Müşteriler için kitap kiralama işlemi yapın</CardDescription>
              </CardHeader>
              <CardContent>
                <RentalManagement />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rented-books" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Kiralanan Kitaplar</CardTitle>
                <CardDescription>Süresi yakında dolacak kitaplar en üstte gösterilir</CardDescription>
              </CardHeader>
              <CardContent>
                <RentedBooksList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="purchase-suggestions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Yeni Kitap Alım Önerileri</CardTitle>
                <CardDescription>Yeni kitap alımları için öneriler oluşturun ve yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <PurchaseSuggestions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

