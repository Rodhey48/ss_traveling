import pendopoLogo from '@/assets/ss_travel/ss-transport-pendopo.webp';
import ssTransportWordmark from '@/assets/ss_travel/ss-transport-wordmark.webp';
import ssTravelingWordmark from '@/assets/ss_travel/ss-traveling-wordmark.webp';
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import UserAuthForm from './components/user-auth-form';

// Background Carousel Imagery (Custom Generated for SS Traveling & SS Transport)
import slideAkapNavy from '@/assets/ss_travel/carausel/slide-akap-navy.webp';
import slideAkap from '@/assets/ss_travel/carausel/slide-akap.webp';
import slideGarage from '@/assets/ss_travel/carausel/slide-garage.webp';
import slideInterior from '@/assets/ss_travel/carausel/slide-interior.webp';
import slideWisata from '@/assets/ss_travel/carausel/slide-wisata.webp';

const carouselSlides = [
  {
    src: slideAkap,
    alt: 'Armada Bus AKAP SS Transport Tol Trans Jawa',
    caption: 'Layanan Bus AKAP Reguler Tangerang – Yogyakarta',
  },
  {
    src: slideInterior,
    alt: 'Interior Kabin Mewah Sleeper & Luxury 2-1 SS Travel',
    caption: 'Kabin Eksekutif Mewah Sleeper & Luxury Seat',
  },
  {
    src: slideWisata,
    alt: 'Layanan Bus Pariwisata & Charter SS Traveling',
    caption: 'Layanan Sewa Pariwisata & Tour Wisata Domestik',
  },
  {
    src: slideGarage,
    alt: 'Depot & Garasi Pusat Armada Bus SS Traveling',
    caption: 'Manajemen Pemeliharaan & Kesiapan Armada',
  },
  {
    src: slideAkapNavy,
    alt: 'Executive Fleet Line SS Transport',
    caption: 'Armada Tangguh Berstandar Keselamatan Tinggi',
  },
];

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-zinc-950 font-sans">
      <div className="absolute inset-0 z-0">
        <Carousel
          opts={{
            loop: true,
            watchDrag: false
          }}
          plugins={[
            Autoplay({
              delay: 6000,
              stopOnInteraction: false
            })
          ]}
          className="h-full w-full"
        >
          <CarouselContent className="ml-0 h-full">
            {carouselSlides.map((slide, index) => (
              <CarouselItem key={index} className="h-full basis-full pl-0 relative overflow-hidden">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="h-full w-full object-cover object-[center_35%] transform scale-120 transition-transform duration-1000 ease-out"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {/* Softened Vignette & Clearer Background Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-black/75" />
      </div>

      <div className="relative z-10 flex h-full min-h-screen w-full flex-col lg:flex-row">
        {/* Left Side: Corporate Hero & Dual Business Units Showcase */}
        <div className="hidden flex-1 flex-col justify-center px-10 lg:flex xl:px-20 z-10 py-12">
          {/* Main Brand Emblem */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/95 p-2 shadow-xl border border-white/30 backdrop-blur-md flex items-center justify-center shrink-0">
              <img
                src={pendopoLogo}
                alt="SS Traveling Emblem"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
                PT SS Traveling Official
              </span>
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                Transport & Fleet Management System
              </span>
            </div>
          </div>

          <h1 className="max-w-2xl text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Satu Ekosistem Cerdas <br />
            <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
              Untuk Dua Lini Bisnis Utama.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            Sistem ERP terpadu untuk operasional armada, rekonsiliasi kasir pool anti-netting, akuntansi single-entry GL, serta penjadwalan bus.
          </p>

          {/* Dual Business Showcase Cards */}
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-2xl">
            {/* Division 1: SS Transport (AKAP) */}
            <div className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-extrabold tracking-wider border border-emerald-400/40 uppercase">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Divisi AKAP
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Trayek Reguler</span>
              </div>
              <div className="bg-white/95 rounded-xl p-2.5 flex items-center justify-center shadow-inner h-12 mb-3">
                <img
                  src={ssTransportWordmark}
                  alt="SS Transport Wordmark"
                  className="max-h-8 w-auto object-contain filter drop-shadow-xs"
                />
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Layanan bus antarkota reguler rute Tangerang – Yogyakarta PP dengan Luxury & Sleeper seat.
              </p>
            </div>

            {/* Division 2: SS Traveling (Wisata & Charter) */}
            <div className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 text-[10px] font-extrabold tracking-wider border border-cyan-400/40 uppercase">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" /> Divisi Wisata
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sewa & Charter</span>
              </div>
              <div className="bg-white/95 rounded-xl p-2.5 flex items-center justify-center shadow-inner h-12 mb-3">
                <img
                  src={ssTravelingWordmark}
                  alt="SS Traveling Wordmark"
                  className="max-h-8 w-auto object-contain filter drop-shadow-xs"
                />
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Layanan sewa bus pariwisata, corporate gathering tour, shuttle, dan paket perjalanan wisata.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              Sistem Aktif & Terlindungi (Command Center)
            </span>
          </div>
        </div>

        {/* Right Side: Auth Form Container with Obsidian Frosted Glass & Subtle Pendopo Watermark */}
        <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-145 xl:w-160">
          <div className="relative w-full max-w-115 rounded-[2.5rem] border border-white/15 bg-zinc-950/80 p-8 sm:p-10 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
            {/* Gleaming Top Accent Rim */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            {/* Subtle Watermark Logo Pendopo in Card Background (Enlarged & Highlighted) */}
            <div className="absolute -bottom-14 -right-14 w-96 h-96 sm:w-105 sm:h-105 pointer-events-none select-none opacity-[0.18] filter drop-shadow-[0_10px_35px_rgba(16,185,129,0.25)] transition-all">
              <img
                src={pendopoLogo}
                alt=""
                className="w-full h-full object-contain transform -rotate-6 scale-120"
              />
            </div>

            {/* Ambient Radial Glow behind Watermark */}
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Brand View */}
            <div className="mb-6 flex flex-col items-center justify-center lg:hidden text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/95 p-2 shadow-md border border-white/20 mb-2.5 flex items-center justify-center">
                <img
                  src={pendopoLogo}
                  alt="SS Traveling Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold tracking-wider uppercase">
                <span>SS Transport</span>
                <span className="text-emerald-400">•</span>
                <span>SS Travelink</span>
              </div>
            </div>

            {/* Card Header */}
            <div className="mb-7 flex flex-col space-y-2 text-center relative z-10">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase mx-auto shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Portal Masuk Petugas
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Selamat Datang
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Masuk ke sistem operasional internal SS Traveling ERP
              </p>
            </div>

            <UserAuthForm />

            <p className="mt-7 px-4 text-center text-xs leading-relaxed text-zinc-500 relative z-10">
              Dengan masuk, Anda menyetujui{' '}
              <Link
                to="/terms"
                className="font-medium underline underline-offset-4 text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Syarat & Ketentuan
              </Link>{' '}
              serta{' '}
              <Link
                to="/privacy"
                className="font-medium underline underline-offset-4 text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Kebijakan Privasi
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
