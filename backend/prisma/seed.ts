import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...')

  // Örnek çalışan oluştur
  const workerPassword = await bcrypt.hash('123456', 10)
  const worker = await prisma.user.upsert({
    where: { email: 'calisan@kutuphane.com' },
    update: {},
    create: {
      email: 'calisan@kutuphane.com',
      password: workerPassword,
      name: 'Test Çalışan',
      role: 'WORKER',
    },
  })
  console.log('Çalışan oluşturuldu:', worker.email)

  // Örnek müşteri oluştur
  const customerPassword = await bcrypt.hash('123456', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'musteri@example.com' },
    update: {},
    create: {
      email: 'musteri@example.com',
      password: customerPassword,
      name: 'Test Müşteri',
      role: 'CUSTOMER',
    },
  })
  console.log('Müşteri oluşturuldu:', customer.email)

  // Örnek kitaplar oluştur
  const books = [
    {
      title: 'Suç ve Ceza',
      author: 'Fyodor Dostoyevski',
      isbn: '9789750719307',
      description: 'Rus edebiyatının en önemli eserlerinden biri',
      category: 'Klasik',
      publishedYear: 1866,
      totalCopies: 5,
      availableCopies: 3,
      location: 'A-1-1',
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '9789750719314',
      description: 'Distopya edebiyatının başyapıtı',
      category: 'Distopya',
      publishedYear: 1949,
      totalCopies: 4,
      availableCopies: 2,
      location: 'A-1-2',
    },
    {
      title: 'Simyacı',
      author: 'Paulo Coelho',
      isbn: '9789750807813',
      description: 'Kişisel gelişim ve felsefe',
      category: 'Felsefe',
      publishedYear: 1988,
      totalCopies: 6,
      availableCopies: 5,
      location: 'B-2-1',
    },
    {
      title: 'Beyaz Gemi',
      author: 'Cengiz Aytmatov',
      isbn: '9789750807820',
      description: 'Modern Türk edebiyatı klasikleri',
      category: 'Roman',
      publishedYear: 1970,
      totalCopies: 3,
      availableCopies: 2,
      location: 'B-2-2',
    },
    {
      title: 'İnce Memed',
      author: 'Yaşar Kemal',
      isbn: '9789750807837',
      description: 'Türk edebiyatının önemli eseri',
      category: 'Roman',
      publishedYear: 1955,
      totalCopies: 7,
      availableCopies: 4,
      location: 'B-2-3',
    },
  ]

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    })
  }
  console.log(`${books.length} kitap oluşturuldu`)

  console.log('Seed işlemi tamamlandı!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

