import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import UserAuthForm from './components/user-auth-form';
import Autoplay from 'embla-carousel-autoplay';

// Using placeholder images for now since assets are not copied yet
const images = [
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366',
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366',
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366',
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'
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
              delay: 5000,
              stopOnInteraction: false
            })
          ]}
          className="h-full w-full"
        >
          <CarouselContent className="-ml-0 h-full">
            {images.map((src, index) => (
              <CarouselItem key={index} className="h-full basis-full pl-0">
                <img
                  src={src}
                  alt={`Background SS TRAVEL ${index + 1}`}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/80" />
      </div>

      <div className="relative z-10 flex h-full min-h-screen w-full flex-col lg:flex-row">
        <div className="hidden flex-1 flex-col justify-center px-12 lg:flex xl:px-24">
          <div className="mb-10 flex items-center text-2xl font-bold tracking-widest text-[#1cb85a]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-3 h-8 w-8"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            SS TRAVEL
          </div>

          <h1 className="max-w-2xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Reliable <br />
            <span className="bg-gradient-to-r from-[#1cb85a] to-emerald-200 bg-clip-text text-transparent drop-shadow-lg">
              transportation.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-300">
            ERP system for managing fleet, finance, and human resources for SS Traveling.
          </p>

          <div className="mt-12 flex items-center gap-4 text-sm font-medium text-gray-400">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Sistem Aktif & Terlindungi
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-[600px] xl:w-[700px]">
          <div className="w-full max-w-[450px] rounded-[2rem] border border-white/20 bg-white/95 p-8 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10">
            <div className="mb-8 flex items-center justify-center text-xl font-bold text-[#1cb85a] lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              SS TRAVEL
            </div>

            <div className="mb-8 flex flex-col space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#050e6e]">
                Selamat Datang
              </h2>
              <p className="text-sm text-gray-500">
                Silakan masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            <UserAuthForm />

            <p className="mt-8 px-4 text-center text-xs leading-relaxed text-gray-500">
              Dengan masuk, Anda menyetujui{' '}
              <Link
                to="/terms"
                className="font-medium underline underline-offset-4 hover:text-[#1cb85a]"
              >
                Syarat & Ketentuan
              </Link>{' '}
              serta{' '}
              <Link
                to="/privacy"
                className="font-medium underline underline-offset-4 hover:text-[#1cb85a]"
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
