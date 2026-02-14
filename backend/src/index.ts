import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const app = new Elysia();
const prisma = new PrismaClient();

app
  .use(cors())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Kütüphane Yönetim Sistemi API",
          version: "1.0.0",
          description: "Kütüphane yönetim sistemi için REST API",
        },
        tags: [
          { name: "auth", description: "Kimlik doğrulama işlemleri" },
          { name: "books", description: "Kitap işlemleri" },
          { name: "rentals", description: "Kiralama işlemleri" },
          { name: "recommendations", description: "AI kitap önerileri" },
          { name: "purchase-suggestions", description: "Yeni kitap alım önerileri" },
        ],
      },
    })
  )
  .get("/", () => ({
    message: "Kütüphane Yönetim Sistemi API",
    version: "1.0.0",
  }));

// Auth Routes
app.group("/api/auth", (app) =>
  app
    .post(
      "/register",
      async ({ body, set }) => {
        try {
          const { email, password, name, role = "CUSTOMER" } = body as any;

          if (!email || !password || !name) {
            set.status = 400;
            return { error: "Email, şifre ve isim gereklidir" };
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name,
              role: role as any,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          });

          return { message: "Kullanıcı başarıyla oluşturuldu", user };
        } catch (error: any) {
          set.status = 400;
          return { error: error.message || "Kayıt başarısız" };
        }
      },
      {
        detail: {
          tags: ["auth"],
          summary: "Yeni kullanıcı kaydı",
        },
      }
    )
    .post(
      "/login",
      async ({ body, jwt, set }) => {
        try {
          const { email, password } = body as any;

          if (!email || !password) {
            set.status = 400;
            return { error: "Email ve şifre gereklidir" };
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            set.status = 401;
            return { error: "Geçersiz email veya şifre" };
          }

          const validPassword = await bcrypt.compare(password, user.password);

          if (!validPassword) {
            set.status = 401;
            return { error: "Geçersiz email veya şifre" };
          }

          const token = await jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
          });

          return {
            message: "Giriş başarılı",
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          };
        } catch (error: any) {
          set.status = 500;
          return { error: error.message || "Giriş başarısız" };
        }
      },
      {
        detail: {
          tags: ["auth"],
          summary: "Kullanıcı girişi",
        },
      }
    )
);

// Protected route helper
const authMiddleware = async ({ jwt, headers, set }: any) => {
  const token = headers.authorization?.replace("Bearer ", "");

  if (!token) {
    set.status = 401;
    return { error: "Token bulunamadı" };
  }

  const payload = await jwt.verify(token);

  if (!payload) {
    set.status = 401;
    return { error: "Geçersiz token" };
  }

  return payload;
};

// Books Routes
app.group("/api/books", (app) =>
  app
    .get(
      "/",
      async ({ query }) => {
        const { search, category, page = "1", limit = "20" } = query as any;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where: any = {};

        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
            { isbn: { contains: search, mode: "insensitive" } },
          ];
        }

        if (category) {
          where.category = category;
        }

        const [books, total] = await Promise.all([
          prisma.book.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { title: "asc" },
          }),
          prisma.book.count({ where }),
        ]);

        return {
          books,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        };
      },
      {
        detail: {
          tags: ["books"],
          summary: "Kitapları listele",
        },
      }
    )
    .get(
      "/:id",
      async ({ params }) => {
        const book = await prisma.book.findUnique({
          where: { id: params.id },
        });

        if (!book) {
          return { error: "Kitap bulunamadı" };
        }

        return { book };
      },
      {
        detail: {
          tags: ["books"],
          summary: "Kitap detayları",
        },
      }
    )
    .get(
      "/search/location",
      async ({ query, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        const { search } = query as any;

        if (!search) {
          set.status = 400;
          return { error: "Arama terimi gereklidir" };
        }

        const books = await prisma.book.findMany({
          where: {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { author: { contains: search, mode: "insensitive" } },
              { isbn: { contains: search, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            author: true,
            location: true,
            availableCopies: true,
            totalCopies: true,
          },
        });

        return { books };
      },
      {
        detail: {
          tags: ["books"],
          summary: "Kitap konumunu ara",
        },
      }
    )
    .get(
      "/search-isbn/:isbn",
      async ({ params, set }) => {
        const { isbn } = params;
        
        try {
          // Önce Open Library API'yi dene
          let bookData = null;
          let source = "";
          
          // Open Library API (ISBN: prefix olmadan)
          try {
            const olResponse = await fetch(
              `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0',
                },
              }
            );
            
            if (olResponse.ok) {
              const olData = await olResponse.json();
              const bookKey = `ISBN:${isbn}`;
              
              if (olData[bookKey] && olData[bookKey].title) {
                bookData = olData[bookKey];
                source = "Open Library";
              }
            }
          } catch (e) {
            console.log("Open Library API hatası:", e);
          }
          
          // Eğer Open Library'de bulunamadıysa, Google Books API'yi dene
          if (!bookData) {
            try {
              const gbResponse = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
                {
                  headers: {
                    'User-Agent': 'Mozilla/5.0',
                  },
                }
              );
              
              if (gbResponse.ok) {
                const gbData = await gbResponse.json();
                
                if (gbData.items && gbData.items.length > 0) {
                  const volume = gbData.items[0].volumeInfo;
                  bookData = {
                    title: volume.title || "",
                    authors: volume.authors ? [{ name: volume.authors.join(", ") }] : [],
                    subtitle: volume.subtitle || "",
                    description: volume.description || "",
                    publishedDate: volume.publishedDate || "",
                    imageLinks: volume.imageLinks || {},
                  };
                  source = "Google Books";
                }
              }
            } catch (e) {
              console.log("Google Books API hatası:", e);
            }
          }
          
          if (!bookData || !bookData.title) {
            set.status = 404;
            return { error: "Bu ISBN ile kitap bulunamadı. Lütfen bilgileri manuel olarak girin." };
          }
          
          // Yayın tarihini parse et
          let publishedYear = null;
          if (bookData.publish_date || bookData.publishedDate) {
            const dateStr = bookData.publish_date || bookData.publishedDate;
            const yearMatch = dateStr.match(/\d{4}/);
            if (yearMatch) {
              publishedYear = parseInt(yearMatch[0]);
            }
          }
          
          // Açıklama/description
          let description = "";
          if (source === "Google Books") {
            description = bookData.description || bookData.subtitle || "";
          } else {
            description = bookData.subtitle || bookData.excerpts?.[0]?.text || bookData.notes || "";
          }
          
          // Resim URL'i
          let imageUrl = null;
          if (source === "Google Books") {
            imageUrl = bookData.imageLinks?.thumbnail?.replace("http://", "https://") || 
                      bookData.imageLinks?.smallThumbnail?.replace("http://", "https://") || null;
          } else {
            imageUrl = bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small || null;
          }
          
          return {
            book: {
              title: bookData.title || "",
              author: bookData.authors?.[0]?.name || bookData.authors?.[0] || "",
              isbn: isbn,
              description: description,
              publishedYear: publishedYear,
              imageUrl: imageUrl,
            },
            source: source,
          };
        } catch (error: any) {
          console.error("ISBN arama hatası:", error);
          set.status = 500;
          return { error: error.message || "Kitap bilgisi çekilemedi. Lütfen bilgileri manuel olarak girin." };
        }
      },
      {
        detail: {
          tags: ["books"],
          summary: "ISBN ile kitap bilgisi çek (Open Library/Google Books API)",
        },
      }
    )
    .post(
      "/",
      async ({ body, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar kitap ekleyebilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const {
          title,
          author,
          isbn,
          description,
          category,
          publishedYear,
          totalCopies,
          location,
          imageUrl,
        } = body as any;

        if (!title || !author || !location) {
          set.status = 400;
          return { error: "Başlık, yazar ve konum gereklidir" };
        }

        // ISBN varsa ve veritabanında aynı ISBN ile kitap varsa, kopya sayısını artır
        if (isbn) {
          const existingBook = await prisma.book.findUnique({
            where: { isbn: isbn },
          });

          if (existingBook) {
            const newTotalCopies = existingBook.totalCopies + (totalCopies ? parseInt(totalCopies) : 1);
            const newAvailableCopies = existingBook.availableCopies + (totalCopies ? parseInt(totalCopies) : 1);
            
            const updatedBook = await prisma.book.update({
              where: { isbn: isbn },
              data: {
                totalCopies: newTotalCopies,
                availableCopies: newAvailableCopies,
                // Konum ve diğer bilgileri de güncelle (eğer farklıysa)
                location: location || existingBook.location,
                description: description || existingBook.description,
                category: category || existingBook.category,
                imageUrl: imageUrl || existingBook.imageUrl,
              },
            });

            return {
              message: `Bu kitap zaten mevcut. Kopya sayısı artırıldı. (Toplam: ${newTotalCopies}, Mevcut: ${newAvailableCopies})`,
              book: updatedBook,
              action: "updated",
            };
          }
        }

        // Yeni kitap ekle
        try {
          const book = await prisma.book.create({
            data: {
              title,
              author,
              isbn: isbn || null,
              description: description || null,
              category: category || null,
              publishedYear: publishedYear ? parseInt(publishedYear) : null,
              totalCopies: totalCopies ? parseInt(totalCopies) : 1,
              availableCopies: totalCopies ? parseInt(totalCopies) : 1,
              location,
              imageUrl: imageUrl || null,
            },
          });

          return {
            message: "Kitap başarıyla eklendi",
            book,
            action: "created",
          };
        } catch (error: any) {
          // Unique constraint hatası (ISBN duplicate)
          if (error.code === "P2002" && error.meta?.target?.includes("isbn")) {
            set.status = 409;
            return { error: "Bu ISBN ile bir kitap zaten mevcut. Kopya sayısını artırmak için kitabı bulun ve güncelleyin." };
          }
          throw error;
        }
      },
      {
        detail: {
          tags: ["books"],
          summary: "Yeni kitap ekle (Worker only)",
        },
      }
    )
    .patch(
      "/:id",
      async ({ params, body, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar kitap güncelleyebilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const book = await prisma.book.findUnique({
          where: { id: params.id },
        });

        if (!book) {
          set.status = 404;
          return { error: "Kitap bulunamadı" };
        }

        const {
          title,
          author,
          isbn,
          description,
          category,
          publishedYear,
          totalCopies,
          availableCopies,
          location,
          imageUrl,
        } = body as any;

        // availableCopies kontrolü: totalCopies'den fazla olamaz
        let finalAvailableCopies = availableCopies !== undefined 
          ? parseInt(availableCopies) 
          : book.availableCopies;
        
        const finalTotalCopies = totalCopies !== undefined 
          ? parseInt(totalCopies) 
          : book.totalCopies;

        if (finalAvailableCopies > finalTotalCopies) {
          set.status = 400;
          return { error: "Mevcut kopya sayısı toplam kopya sayısından fazla olamaz" };
        }

        // ISBN değişikliği kontrolü
        if (isbn && isbn !== book.isbn) {
          const existingBook = await prisma.book.findUnique({
            where: { isbn: isbn },
          });

          if (existingBook && existingBook.id !== params.id) {
            set.status = 409;
            return { error: "Bu ISBN ile başka bir kitap zaten mevcut" };
          }
        }

        const updatedBook = await prisma.book.update({
          where: { id: params.id },
          data: {
            ...(title && { title }),
            ...(author && { author }),
            ...(isbn !== undefined && { isbn: isbn || null }),
            ...(description !== undefined && { description: description || null }),
            ...(category !== undefined && { category: category || null }),
            ...(publishedYear !== undefined && { publishedYear: publishedYear ? parseInt(publishedYear) : null }),
            ...(totalCopies !== undefined && { totalCopies: finalTotalCopies }),
            ...(availableCopies !== undefined && { availableCopies: finalAvailableCopies }),
            ...(location && { location }),
            ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
          },
        });

        return {
          message: "Kitap başarıyla güncellendi",
          book: updatedBook,
        };
      },
      {
        detail: {
          tags: ["books"],
          summary: "Kitap güncelle (Worker only)",
        },
      }
    )
    .delete(
      "/:id",
      async ({ params, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar kitap silebilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const book = await prisma.book.findUnique({
          where: { id: params.id },
          include: {
            rentals: {
              where: {
                status: {
                  in: ["BORROWED", "OVERDUE"],
                },
              },
            },
          },
        });

        if (!book) {
          set.status = 404;
          return { error: "Kitap bulunamadı" };
        }

        // Eğer aktif kiralama varsa, silme işlemini engelle
        if (book.rentals.length > 0) {
          set.status = 400;
          return { 
            error: `Bu kitap şu anda ${book.rentals.length} aktif kiralama kaydına sahip. Önce tüm kitapların iade edilmesi gerekiyor.` 
          };
        }

        await prisma.book.delete({
          where: { id: params.id },
        });

        return {
          message: "Kitap başarıyla silindi",
        };
      },
      {
        detail: {
          tags: ["books"],
          summary: "Kitap sil (Worker only)",
        },
      }
    )
);

// Recommendations Routes
app.group("/api/recommendations", (app) =>
  app
    .get(
      "/",
      async ({ headers, jwt: jwtPlugin, set }) => {
        const user = await authMiddleware({ jwt: jwtPlugin, headers, set });
        if (user.error) return user;

        // Basit AI öneri algoritması (gerçek uygulamada daha gelişmiş olmalı)
        const userRentals = await prisma.rental.findMany({
          where: { customerId: user.id },
          include: { book: true },
        });

        const readCategories = userRentals.map((r) => r.book.category).filter(Boolean);
        const readAuthors = userRentals.map((r) => r.book.author);

        // Kullanıcının okuduğu kategorilere göre öneri
        const recommendations = await prisma.book.findMany({
          where: {
            AND: [
              { category: { in: readCategories } },
              { id: { notIn: userRentals.map((r) => r.bookId) } },
              { availableCopies: { gt: 0 } },
            ],
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        });

        // Önerileri skorla ve neden ekle
        const recommendationsWithScore = await Promise.all(
          recommendations.map(async (book) => {
            let score = 0.5;
            let reason = "";

            if (readCategories.includes(book.category || "")) {
              score += 0.3;
              reason += `${book.category} kategorisinden kitaplar okumuşsunuz. `;
            }

            if (readAuthors.includes(book.author)) {
              score += 0.2;
              reason += `${book.author} yazarından kitap okumuşsunuz. `;
            }

            // Daha önce önerilmiş mi kontrol et
            const existing = await prisma.recommendation.findUnique({
              where: {
                userId_bookId: {
                  userId: user.id,
                  bookId: book.id,
                },
              },
            });

            if (!existing) {
              await prisma.recommendation.create({
                data: {
                  userId: user.id,
                  bookId: book.id,
                  score: Math.min(score, 1.0),
                  reason: reason || "Size uygun görünüyor.",
                },
              });
            }

            return {
              ...book,
              score: Math.min(score, 1.0),
              reason: reason || "Size uygun görünüyor.",
            };
          })
        );

        return {
          recommendations: recommendationsWithScore.sort((a, b) => b.score - a.score),
        };
      },
      {
        detail: {
          tags: ["recommendations"],
          summary: "Kullanıcı için AI kitap önerileri",
        },
      }
    )
);

// Rentals Routes
app.group("/api/rentals", (app) =>
  app
    .post(
      "/",
      async ({ body, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar kiralama işlemi yapabilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const { bookId, customerId, dueDays = 14 } = body as any;

        if (!bookId || !customerId) {
          set.status = 400;
          return { error: "Kitap ID ve müşteri ID gereklidir" };
        }

        const book = await prisma.book.findUnique({
          where: { id: bookId },
        });

        if (!book) {
          set.status = 404;
          return { error: "Kitap bulunamadı" };
        }

        if (book.availableCopies <= 0) {
          set.status = 400;
          return { error: "Kitap şu anda mevcut değil" };
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

        const rental = await prisma.rental.create({
          data: {
            bookId,
            customerId,
            workerId: user.id,
            dueDate,
          },
        });

        await prisma.book.update({
          where: { id: bookId },
          data: {
            availableCopies: book.availableCopies - 1,
          },
        });

        return {
          message: "Kitap başarıyla kiralandı",
          rental: await prisma.rental.findUnique({
            where: { id: rental.id },
            include: { book: true, customer: true },
          }),
        };
      },
      {
        detail: {
          tags: ["rentals"],
          summary: "Yeni kiralama oluştur (Worker only)",
        },
      }
    )
    .get(
      "/my-rentals",
      async ({ headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        const rentals = await prisma.rental.findMany({
          where: { customerId: user.id },
          include: {
            book: true,
          },
          orderBy: { borrowedAt: "desc" },
        });

        // Automatically mark rentals as OVERDUE if past due date
        const now = new Date();
        const overdueUpdates = [];
        for (const rental of rentals) {
          if (rental.status === "BORROWED" && new Date(rental.dueDate) < now) {
            overdueUpdates.push(
              prisma.rental.update({
                where: { id: rental.id },
                data: { status: "OVERDUE" },
              })
            );
            rental.status = "OVERDUE";
          }
        }
        if (overdueUpdates.length > 0) {
          await Promise.all(overdueUpdates);
        }

        return { rentals };
      },
      {
        detail: {
          tags: ["rentals"],
          summary: "Kullanıcının kiraladığı kitaplar",
        },
      }
    )
    .get(
      "/all",
      async ({ headers, jwt, set, query }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar tüm kiralamaları görebilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const { status, page = "1", limit = "50" } = query as any;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where: any = {};
        if (status) {
          where.status = status;
        }

        const rentals = await prisma.rental.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            book: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { borrowedAt: "desc" },
        });

        // Automatically mark rentals as OVERDUE if past due date
        const now = new Date();
        const overdueUpdates = [];
        for (const rental of rentals) {
          if (rental.status === "BORROWED" && new Date(rental.dueDate) < now) {
            overdueUpdates.push(
              prisma.rental.update({
                where: { id: rental.id },
                data: { status: "OVERDUE" },
              })
            );
            rental.status = "OVERDUE";
          }
        }
        if (overdueUpdates.length > 0) {
          await Promise.all(overdueUpdates);
        }

        const total = await prisma.rental.count({ where });

        return {
          rentals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        };
      },
      {
        detail: {
          tags: ["rentals"],
          summary: "Tüm kiralamaları listele (Worker only)",
        },
      }
    )
    .post(
      "/:id/return",
      async ({ params, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        // Sadece çalışanlar iade işlemi yapabilir
        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const rental = await prisma.rental.findUnique({
          where: { id: params.id },
          include: { book: true },
        });

        if (!rental) {
          set.status = 404;
          return { error: "Kiralama kaydı bulunamadı" };
        }

        if (rental.status === "RETURNED") {
          set.status = 400;
          return { error: "Kitap zaten iade edilmiş" };
        }

        const now = new Date();
        // Always mark as RETURNED when returning, regardless of due date
        // The OVERDUE status is only for tracking while the book is still borrowed
        const updatedRental = await prisma.rental.update({
          where: { id: params.id },
          data: {
            status: "RETURNED",
            returnedAt: now,
          },
        });

        await prisma.book.update({
          where: { id: rental.bookId },
          data: {
            availableCopies: rental.book.availableCopies + 1,
          },
        });

        return {
          message: "Kitap başarıyla iade edildi",
          rental: updatedRental,
        };
      },
      {
        detail: {
          tags: ["rentals"],
          summary: "Kitap iade et (Worker only)",
        },
      }
    )
);

// Purchase Suggestions Routes (Worker only)
app.group("/api/purchase-suggestions", (app) =>
  app
    .get(
      "/",
      async ({ headers, jwt: jwtPlugin, set }) => {
        const user = await authMiddleware({ jwt: jwtPlugin, headers, set });
        if (user.error) return user;

        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const suggestions = await prisma.purchaseSuggestion.findMany({
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          include: {
            book: true,
          },
        });

        return { suggestions };
      },
      {
        detail: {
          tags: ["purchase-suggestions"],
          summary: "Alım önerilerini listele (Worker only)",
        },
      }
    )
    .post(
      "/",
      async ({ body, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const { bookTitle, author, isbn, reason, priority = 5 } = body as any;

        if (!bookTitle || !reason) {
          set.status = 400;
          return { error: "Kitap adı ve öneri nedeni gereklidir" };
        }

        const suggestion = await prisma.purchaseSuggestion.create({
          data: {
            bookTitle,
            author,
            isbn,
            reason,
            priority: Math.min(Math.max(priority, 1), 10),
            suggestedBy: user.id,
          },
        });

        return {
          message: "Alım önerisi başarıyla oluşturuldu",
          suggestion,
        };
      },
      {
        detail: {
          tags: ["purchase-suggestions"],
          summary: "Yeni alım önerisi oluştur (Worker only)",
        },
      }
    )
    .patch(
      "/:id/status",
      async ({ params, body, headers, jwt, set }) => {
        const user = await authMiddleware({ jwt, headers, set });
        if (user.error) return user;

        if (user.role !== "WORKER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Bu işlem için yetkiniz yok" };
        }

        const { status } = body as any;

        if (!status) {
          set.status = 400;
          return { error: "Durum gereklidir" };
        }

        const suggestion = await prisma.purchaseSuggestion.update({
          where: { id: params.id },
          data: { status: status as any },
        });

        return {
          message: "Öneri durumu güncellendi",
          suggestion,
        };
      },
      {
        detail: {
          tags: ["purchase-suggestions"],
          summary: "Öneri durumunu güncelle (Worker only)",
        },
      }
    )
);

const port = parseInt(process.env.PORT || "3001");

app.listen(port, () => {
  console.log(`🚀 Kütüphane Yönetim Sistemi API ${port} portunda çalışıyor`);
  console.log(`📚 Swagger dokümantasyonu: http://localhost:${port}/swagger`);
});

