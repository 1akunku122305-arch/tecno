import type { Category } from "@/types";
import { ButtonLink } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  Compass,
  HeartHandshake,
  MessageSquareQuote,
  Search,
  Star,
  Wallet,
  Layers,
} from "lucide-react";

export function Hero() {
  return (
    <section className="bg-hero-grid relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Platform bimbingan akademik untuk mahasiswa
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-ink-950 sm:text-6xl">
          Temukan mentor yang{" "}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            benar-benar cocok
          </span>{" "}
          dengan kebutuhanmu
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
          Jelaskan kebutuhan akademikmu — bidang, mata kuliah, waktu, dan budget.
          Mentora merekomendasikan mentor yang paling sesuai.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/find-mentor" size="lg" className="w-full sm:w-auto">
            Temukan Mentor <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/register?role=mentor" variant="outline" size="lg" className="w-full sm:w-auto">
            Jadi Mentor
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-400">Gratis mendaftar · Untuk semua bidang akademik · Book & konsultasi online</p>
      </div>
    </section>
  );
}

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Masalah</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-950 sm:text-4xl">
            Sulit menemukan mentor yang benar-benar sesuai dengan kebutuhanmu?
          </h2>
          <p className="mt-4 text-ink-600">
            Browsing mentor satu per satu, menebak-nebak siapa yang paham materi kamu,
            lalu ketemu mentor yang tidak cocok — itu pembunuh waktu dan semangat belajar.
          </p>
          <ul className="mt-6 space-y-3 text-ink-700">
            {[
              "Kebingungan memilih mentor dari sekian banyak pilihan",
              "Ketidakcocokan materi dan gaya mengajar",
              "Jadwal mentor yang tidak fleksibel",
              "Harga yang tidak sesuai dengan budget",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" aria-hidden />
                <span className="text-sm sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-ink-200 bg-ink-50 p-6 sm:p-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <MessageSquareQuote className="h-4 w-4 text-brand-600" aria-hidden />
              Cerita mahasiswa
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              "Aku butuh bantuan struktur data minggu ini, tapi semua mentor yang kelihatan bagus
              harganya mahal atau jadwalnya bentrok. Akhirnya aku belajar sendiri."
            </p>
            <p className="mt-3 text-xs text-ink-400">— Pengalaman umum mahasiswa</p>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Compass className="h-4 w-4 text-brand-600" aria-hidden />
              Target kami
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Di Mentora, kamu cukup menjelaskan apa yang kamu butuhkan, kapan, dan dengan budget
              berapa — kami bantu menemukan mentor yang paling sesuai.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Search, title: "Tentukan kebutuhan", desc: "Pilih bidang, mata kuliah, topik, tanggal, dan budget kamu." },
  { icon: Compass, title: "Temukan mentor", desc: "Mentora mencocokkan kebutuhanmu dengan mentor yang relevan." },
  { icon: CalendarCheck, title: "Booking sesi", desc: "Pilih mentor dan booking slot sesuai jadwalmu." },
  { icon: HeartHandshake, title: "Konsultasi", desc: "Sesi berlangsung online dengan link meeting." },
  { icon: Star, title: "Berikan evaluasi", desc: "Rating & review membantu mahasiswa lain." },
];

export function SolutionSection() {
  return (
    <section id="cara-kerja" className="bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-400">Solusi</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Jelaskan kebutuhanmu, temukan mentor yang sesuai
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">
            Alur sederhana dari masalah menjadi solusi — tanpa proses yang rumit.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <step.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="absolute right-4 top-4 text-xs font-bold text-white/30">0{i + 1}</span>
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-300">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Compass, title: "Matching berdasarkan kebutuhan", desc: "Bukan daftar mentor acak — skor kecocokan dihitung dari mata kuliah, topik, jadwal, dan budget." },
  { icon: Layers, title: "Mentor berdasarkan bidang keahlian", desc: "Dari Informatika hingga Bahasa, setiap mentor terverifikasi sesuai bidangnya." },
  { icon: CalendarCheck, title: "Jadwal fleksibel", desc: "Pilih slot yang cocok dengan rutinitas kuliahmu, tanpa negosiasi manual." },
  { icon: Star, title: "Sistem rating dan review", desc: "Rating dihitung real-time dari ulasan mahasiswa yang menyelesaikan sesi." },
  { icon: BookOpen, title: "Berbagai bidang akademik", desc: "Informatika, Matematika, Akuntansi, Manajemen, Bahasa, Desain, dan lainnya." },
  { icon: Wallet, title: "Budget-friendly", desc: "Saring mentor sesuai kisaran harga yang kamu sanggupi." },
];

export function FeatureSection() {
  return (
    <section id="keunggulan" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Keunggulan</p>
        <h2 className="mt-2 text-3xl font-bold text-ink-950 sm:text-4xl">
          Kenapa memilih Mentora?
        </h2>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-ink-200/80 p-6 transition-shadow hover:shadow-md">
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <f.icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="font-bold text-ink-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FieldsSection({ categories, error }: { categories: Category[]; error: string | null }) {
  const display = categories.slice(0, 8);
  return (
    <section id="bidang" className="bg-ink-50/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Bidang yang tersedia</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-950 sm:text-4xl">
            Untuk semua bidang akademik
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-600">
            Data bidang diambil langsung dari database — admin dapat menambahkan bidang baru kapan saja.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-10 max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Bidang belum dapat dimuat: {error}
          </div>
        )}

        {error === null && display.length === 0 && (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-10 text-center">
            <p className="font-semibold text-ink-800">Belum ada bidang tersedia.</p>
            <p className="mt-1 text-sm text-ink-500">
              Admin dapat menambahkan kategori melalui panel admin setelah setup.
            </p>
          </div>
        )}

        {display.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {display.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-ink-200 bg-white p-5 text-center transition-colors hover:border-brand-300"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl" aria-hidden>
                  {cat.icon === "code" ? "💻" : cat.icon === "sigma" ? "∑" : cat.icon === "calculator" ? "🧮" : cat.icon === "briefcase" ? "💼" : cat.icon === "languages" ? "🌐" : "🎓"}
                </div>
                <p className="font-bold text-ink-900">{cat.name}</p>
                {cat.description && <p className="mt-1 text-xs text-ink-500">{cat.description}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <ButtonLink href="/find-mentor" variant="secondary">
            Cari mentor di bidangmu <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center sm:px-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Siap berkembang bersama Mentora?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-100">
          Mulai dari masalah akademik pertamamu hari ini — atau bagikan keahlianmu dan bantu mahasiswa lain bertumbuh.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg" className="w-full bg-white !text-brand-700 hover:bg-brand-50 sm:w-auto">
            Daftar Gratis <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/find-mentor" size="lg" variant="ghost" className="w-full !text-white hover:!bg-white/10 sm:w-auto">
            Lihat Mentor
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm font-semibold text-ink-800">MENTORA</p>
        <p className="text-sm text-ink-500">Your Academic Growth Partner</p>
        <p className="text-xs text-ink-400">© {new Date().getFullYear()} Mentora. Semua data ditampilkan dari database.</p>
      </div>
    </footer>
  );
}
