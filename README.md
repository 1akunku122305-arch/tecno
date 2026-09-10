# MENTORA — Your Academic Growth Partner

Mentora adalah platform bimbingan dan konsultasi akademik yang menghubungkan
mahasiswa dengan mentor **berdasarkan kebutuhan akademik** (bidang, mata kuliah,
topik, waktu, budget, keahlian, pengalaman, dan rating). Platform dirancang
**fleksibel dan scalable** — tidak terbatas pada Informatika; kategori, mata
kuliah, dan topik dikelola dari database/panel admin.

Aplikasi ini adalah **MVP nyata**: semua data dinamis berasal dari Supabase
(PostgreSQL + Auth + Storage), tanpa data dummy, tanpa mock API, tanpa fake
authentication, dan tanpa localStorage sebagai database.

---

## 1. Struktur Folder Project

```
tecno/
├── supabase/
│   └── migrations/
│       └── 20240101000000_init.sql   ← SEMUA schema, trigger, RLS, seed config
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── page.tsx                  ← Landing page
│   │   ├── layout.tsx                ← Root layout (metadata/SEO)
│   │   ├── globals.css               ← Tailwind v4 theme
│   │   ├── middleware.ts             ← Session refresh + route guard
│   │   ├── (auth)/                   ← login / register / forgot-password / reset-password
│   │   ├── find-mentor/              ← Form "Cari Mentor" + hasil matching
│   │   ├── mentors/[id]/             ← Profil mentor publik
│   │   ├── book/[mentorId]/          ← Wizard booking
│   │   ├── student/                  ← dashboard, bookings, sessions, history, profile, notifications
│   │   ├── mentor/                   ← dashboard, bookings, schedule, sessions, reviews, earnings, profile, notifications
│   │   └── admin/                    ← dashboard, users, mentors, categories, subjects, bookings, notifications
│   ├── components/
│   │   ├── ui/                       ← Button, Card, Badge, Form, Alert, EmptyState (reusable)
│   │   ├── landing/                  ← Navbar & sections landing
│   │   ├── dashboard/                ← DashboardShell, nav, setup panel, booking list, session actions
│   │   ├── mentor/                   ← MatchCard, Stars, availability manager, profile editor, meeting URL
│   │   ├── booking/                  ← BookingForm (2-step wizard)
│   │   ├── review/                   ← ReviewForm (rating 1–5 + teks)
│   │   ├── profile/                  ← ProfileForm + avatar upload
│   │   └── admin/                    ← CategoryManager, SubjectManager, role/status controls
│   ├── lib/
│   │   ├── supabase/                 ← server client, browser client, middleware helper
│   │   ├── auth/                     ← server actions auth + role guards
│   │   ├── matching/                 ← weights.ts, scoring.ts, explain.ts (ALGORITMA TERPISAH)
│   │   ├── utils.ts                  ← formatter/helper murni
│   │   └── site.ts                   ← identitas situs
│   ├── services/                     ← service layer terpisah
│   │   ├── catalog.service.ts        ← kategori/subjek/topik
│   │   ├── mentor.service.ts         ← fetch & hydrate mentor + statistik live
│   │   ├── matching.service.ts       ← orkestrasi matching (DB filter → scoring)
│   │   ├── booking.service.ts        ← booking/session lifecycle
│   │   ├── review.service.ts         ← rating & review (1× per booking completed)
│   │   ├── notification.service.ts   ← baca/tandai notifikasi (event-driven)
│   │   ├── profile.service.ts        ← profil pengguna
│   │   ├── storage.service.ts        ← upload avatar (Supabase Storage)
│   │   ├── mentor-onboarding.service.ts ← profil/jadwal mentor (server actions)
│   │   ├── admin.service.ts          ← statistik & CRUD admin
│   │   └── *-actions.ts              ← "use server" actions (auth, booking, review, profile, admin)
│   ├── types/index.ts                ← semua interface TypeScript
│   └── middleware.ts
├── .env.example
├── next.config.mjs
├── package.json
└── README.md
```

Separation of concerns: **authentication, database, matching, booking,
payment-ready, notification** masing-masing punya modul sendiri — tidak ada
logika yang ditumpuk di komponen UI.

---

## 2. Tech Stack

| Layer      | Teknologi                                        |
|------------|--------------------------------------------------|
| Frontend   | Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 |
| Backend    | Next.js Server Components + Server Actions + Supabase |
| Database   | Supabase PostgreSQL (RLS aktif)                  |
| Auth       | Supabase Auth (email/password + reset password)  |
| Storage    | Supabase Storage (`avatars` bucket, public read) |
| Deploy     | Vercel                                           |
| Icons      | lucide-react                                     |

---

## 3. Database Schema

Semua tabel menggunakan `uuid` PK, `created_at`/`updated_at`, foreign key, dan
index pada kolom pencarian.

| Tabel                | Fungsi                                                              |
|----------------------|---------------------------------------------------------------------|
| `profiles`           | 1:1 dengan `auth.users`; role (`student`/`mentor`/`admin`) + data umum |
| `categories`         | Bidang akademik (Informatika, Matematika, …) — dikonfigurasi admin  |
| `subjects`           | Mata kuliah, FK → `categories` (bisa ditambah tanpa ubah kode)      |
| `topics`             | Topik/materi, FK → `subjects`                                        |
| `mentor_profiles`    | 1:1 dengan `profiles`; status verifikasi, harga, kategori utama, dsb. |
| `mentor_subjects`    | many-to-many mentor ↔ mata kuliah                                   |
| `mentor_topics`      | many-to-many mentor ↔ topik                                          |
| `mentor_availability`| Slot jadwal mingguan (hari, jam mulai/selesai, aktif)                |
| `bookings`           | booking: student ↔ mentor, subjek, topik, tanggal, waktu, harga, status |
| `sessions`           | sesi konsultasi 1:1 dengan booking; `meeting_url`, status, waktu     |
| `reviews`            | rating 1–5 + teks; unique per booking, hanya booking `completed`     |
| `payments`           | Siap integrasi gateway: amount, method, status, ref, paid_at         |
| `notifications`      | Dibuat oleh database trigger dari event aplikasi (bukan hardcode)   |

Enum: `user_role`, `mentor_status (pending/approved/rejected)`,
`booking_status (pending/confirmed/rejected/cancelled/completed)`,
`payment_status (pending/paid/failed/refunded)`.

---

## 4. Supabase SQL Migration

**Satu file lengkap → `supabase/migrations/20240101000000_init.sql`.** Berisi:

- Pembuatan seluruh tabel, enum, FK, dan index.
- Trigger `handle_new_user`: saat user mendaftar, otomatis membuat `profiles`
  (+ `mentor_profiles` jika role mentor). **Role admin tidak bisa dibuat sendiri**
  (hanya via SQL/dashboard).
- Trigger `prevent_double_booking`: menolak booking tumpang tindih pada mentor
  yang sama (status pending/confirmed).
- Trigger `on_booking_event`: membuat notifikasi (booking baru / dikonfirmasi /
  ditolak / dibatalkan) **dan otomatis membuat `sessions`** saat booking
  dikonfirmasi (meeting URL default mentor disalin).
- Trigger `on_session_completed`: notifikasi "Beri rating" + markah booking
  menjadi `completed`.
- Trigger `prevent_review_unless_completed`: review hanya boleh untuk booking
  yang sudah selesai.
- **Seed hanya data konfigurasi**: 5 kategori + 14 mata kuliah contoh.
  **Tidak ada** fake user, fake mentor, fake rating, fake booking, atau
  statistik palsu.
- **Storage**: bucket `avatars` (public) dibuat otomatis + policy:
  baca publik, tulis hanya ke folder milik sendiri (`{user_id}/…`).

Cara menjalankan: Supabase Dashboard → SQL Editor → paste isi file → Run
(atau `supabase db push` jika memakai Supabase CLI).

> **Project yang sudah berjalan**: kalau file ini sudah pernah dijalankan
> dan kamu menerapkan versi revisi, jalankan ulang bagian
> *Row Level Security* (helper `is_*`, `drop policy`/`create policy`) dan
> *Storage* di SQL Editor — policy `drop if exists` + `create or replace`
> aman dijalankan ulang (idempotent).

---

## 5. RLS Policies (ringkasan)

Semua tabel `enable row level security`. Pola:

- **profiles**: user hanya melihat dirinya sendiri + profil peserta booking-nya
  (helper `is_booking_participant`); user TIDAK bisa mengubah role sendiri
  (helper `is_profile_role_unchanged`) dan insert sendiri hanya role
  student/mentor; admin semua.
- **categories/subjects/topics**: publik hanya membaca yang `is_active = true`;
  tulis hanya admin.
- **mentor_profiles**: publik hanya melihat `approved`; hanya akun ber-role
  `mentor` yang boleh membuat profil mentor; mentor hanya mengubah miliknya
  dan TIDAK BISA mengubah status sendiri (helper `is_mentor_status_unchanged`
  — approve/reject khusus admin); admin semua.
- **mentor_subjects / mentor_topics / mentor_availability**: seleksi hanya
  untuk mentor approved/pemilik/admin; tulis hanya pemilik/admin.
- **bookings**: student membaca booking miliknya; mentor membaca booking
  yang berkaitan dengannya; insert hanya untuk student (ke mentor approved,
  subjek/topik wajib, harga = harga mentor); student hanya bisa men-`pending`/
  `cancel`, mentor `confirmed`/`rejected`/`completed`.
- **sessions**: baca = partisipan (student/mentor) atau admin; **update hanya
  mentor/admin** (student tidak bisa mulai/selesaikan sesi atau mengganti
  link meeting).
- **reviews**: insert hanya oleh student pemilik booking dengan status
  `completed`; unique booking.
- **payments**: baca hanya pemilik booking/mentor terkait/admin; insert student
  pemilik booking **hanya status `pending` dengan amount = harga booking**
  (tidak bisa membuat baris "paid" palsu).
- **notifications**: hanya pemilik notifikasi.

Helper `public.is_admin()` dan `public.is_mentor_owner()` (`security definer`)
dipakai di banyak policy. **Service role key tidak pernah dipakai di client.**

---

## 6. Environment Variables

```bash
# .env.local (lihat .env.example)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # opsional; di Vercel otomatis
```

> **Jangan pernah** memasukkan `service_role` key pada variabel `NEXT_PUBLIC_*`.

---

## 7. Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial Supabase
npm run dev                  # http://localhost:3000
```

Build produksi:

```bash
npm run build   # ✓ verified, tanpa error
npm run start
```

Tanpa env var, aplikasi tetap berjalan: landing page menampilkan bidang dari
database dan petunjuk setup yang jelas (tidak crash).

---

## 8. Menghubungkan Supabase (langkah setup)

1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan `supabase/migrations/20240101000000_init.sql` di **SQL Editor**.
3. Salin **Project URL** + **anon key** ke `.env.local`.
4. Storage bucket `avatars` **sudah dibuat otomatis** oleh migration (public,
   policy tulis hanya folder milik sendiri) — tidak perlu setup manual.
5. **Authentication → URL Configuration**: masukkan URL situs
   (`http://localhost:3000` lokal; URL Vercel untuk produksi) dan redirect
   URL termasuk `.../reset-password`.
6. **Opsional (cepat untuk prototype)**: Authentication → Providers → Email →
   matikan **Confirm email** agar registrasi langsung login.
7. Jadikan akun pertama **admin** (tidak bisa lewat UI, by design):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@mentora.id');
```

---

## 9. Deploy ke Vercel

1. Push repo ke GitHub.
2. Vercel → **New Project** → import repo.
3. Tambahkan environment variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SITE_URL` (URL Vercel).
4. Deploy (framework auto-detected: Next.js). Build sudah terverifikasi
   `npm run build` ✓.
5. Update Supabase Auth URL Configuration dengan URL Vercel + redirect
   `/reset-password`.

---

## 10. Fitur yang Sudah Diimplementasikan (Phase 1)

- ✅ Register/login/logout/forgot & reset password (Supabase Auth, role di metadata)
- ✅ Route protection per role (`/login?next=…`, guard RSC per role)
- ✅ Landing page modern + SEO metadata + OG + bidang dari database + empty/setup state
- ✅ Profil student (nama, foto via Supabase Storage, universitas, prodi, semester, bio)
- ✅ Cari mentor: kategori → mata kuliah (dari DB) → topik → tanggal → waktu → durasi → budget
- ✅ **Matching algoritma transparan** (service terpisah `lib/matching` + `services/matching`):
  bobot default **subjek 30% · topik 20% · availability 20% · budget 15% · rating 10% · pengalaman 5%**,
  skor 0–100 **tanpa random**, gate relevansi (subjek tidak cocok → skor dikap ≤45),
  bobot configurable, breakdown ditampilkan di UI.
- ✅ Hasil matching + mentor card (foto, verified badge, bidang, subjek, rating live, sesi,
  harga, jadwal, skor) + empty state + "Ubah Kebutuhan"
- ✅ Profil mentor publik (rating & jumlah sesi **dihitung dari database**)
- ✅ Registrasi/onboarding mentor: profil, kategori, banyak mata kuliah, topik, harga,
  jadwal mingguan (add/aktif/nonaktif/hapus), link meeting default
- ✅ Verifikasi mentor (pending → approve/reject di admin; hanya `approved` yang tampil & bisa di-booking)
- ✅ Booking 2-step wizard + validasi server & DB (mentor approved, slot kosong,
  subjek+topik wajib, harga = harga mentor, availability sesuai jadwal)
- ✅ **Anti double booking** (trigger DB + validasi service)
- ✅ Sesi: dibuat otomatis saat booking confirmed; field `meeting_url` (Google Meet dsb.),
  "Mulai Sesi" / "Selesaikan Sesi" sesuai permission; booking berubah `completed`
- ✅ Rating & review 1–5 + teks, hanya untuk booking completed, satu review per booking,
  rating mentor dihitung real-time
- ✅ Dashboard student & mentor (statistik dari DB, empty state di semua panel)
- ✅ Admin: statistik, user management, mentor approve/reject, kategori & mata kuliah CRUD
  (aktif/nonaktif), monitoring booking
- ✅ Notifikasi event-driven (DB trigger): booking baru, dikonfirmasi, ditolak, sesi selesai
  + halaman notifikasi & tandai dibaca
- ✅ Loading/empty/error/success states di semua halaman data; tidak ada angka palsu
- ✅ Responsive (sidebar → bottom mobile nav, tabel scroll, form tidak overflow)
- ✅ Aksesibilitas dasar: semantic HTML, label, focus ring, aria, keyboard
- ✅ Struktur payment siap integrasi gateway (`payments` + UI "Payment integration
  coming soon" — **tidak ada transaksi palsu**)
- ✅ `npm run build` berhasil tanpa error

---

## 11. Fitur yang Belum Diimplementasikan (Phase 2)

- ❌ Payment gateway nyata (Midtrans/Xendit) — UI & tabel siap; onboarding gateway
  + webhook + kalkulasi komisi/earnings belum aktif
- ❌ Video call engine — memakai `meeting_url` (Google Meet) sesuai MVP
- ❌ Realtime push notification (Supabase Realtime) — notifikasi tersimpan dan
  terlihat saat navigasi
- ❌ Chat antar student-mentor
- ❌ Advanced matching (embedding/semantic) — algoritma modular, tinggal ganti `scoring.ts`
- ❌ Analytics lanjutan, premium mentor/featured, subscription, institutional partnership
- ❌ Email/WhatsApp notifikasi otomatis di luar App
- ❌ Profil photo cropping sebelum upload (upload langsung)

---

## 12. Potensi Error / Konfigurasi yang Masih Diperlukan

1. **Email confirmation aktif** → registrasi tidak langsung login; user perlu klik
   tautan email. Untuk prototype, matikan Confirm email (lihat §8.6).
2. **Role admin belum diset** → `/admin/*` mengalihkan ke dashboard sesuai role
   akun (by design). Set lewat SQL (§8.7).
4. **URL redirect Auth** salah → reset password/link konfirmasi tidak sampai ke
   halaman yang benar.
5. **Harga booking**: sistem memvalidasi `price` = `mentor_profiles.price_per_session`;
   jika mentor mengubah harga setelah form dibuka, booking ditolak dengan pesan jelas.
6. **Slot terpakai**: validasi client + service + trigger DB; error diformat ramah.
7. **Timezone**: tanggal/waktu disimpan sebagai `date`/`time` (tanpa zona);
   cocok untuk MVP dengan konvensi waktu lokal Indonesia.
8. **Supabase Realtime** untuk notifikasi belum diaktifkan (Phase 2).
9. Menghapus kategori akan menghapus mata kuliah & relasi mentor terkait
   (cascade) — gunakan "Nonaktifkan" bila ragu.
10. Jika UI menampilkan "Supabase belum dikonfigurasi", berarti env vars belum
    diisi — bukan bug.

---

## 13. Matching — Ringkasan

`src/lib/matching/scoring.ts` murni & deterministik:

- `subjectScore` — 100 hanya jika subjek mentor = subjek yang dicari (relevansi
  akademik diutamakan; tanpa cocok → skor dikap ≤ 45%).
- `topicScore` — token overlap antara teks topik dengan nama subjek/headline/bio/topik mentor.
- `availabilityScore` — slot mingguan mentor mencakup tanggal+jam+durasi permintaan.
- `budgetScore` — harga dalam rentang budget → 100, di luar rentang makin turun.
- `ratingScore` — rata-rata/5 (0 jika belum ada review — tanpa baseline palsu).
- `experienceScore` — tahun pengalaman dengan diminishing returns.

Bobot di `weights.ts` (default 30/20/20/15/10/5) dinormalisasi otomatis dan
mudah diganti tanpa menyentuh komponen UI.

*Mentora MVP — dibangun oleh Arena Agent Mode.*
