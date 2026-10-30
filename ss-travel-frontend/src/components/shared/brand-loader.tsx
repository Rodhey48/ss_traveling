import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import pendopoLogo from '@/assets/ss_travel/ss-transport-pendopo.webp';

interface BrandLoaderProps {
  /**
   * Pesan status memuat
   * @default 'Memuat…'
   */
  message?: string;
  /**
   * Sub-pesan / keterangan tambahan
   * @default 'PT SS Traveling Official'
   */
  subMessage?: string;
  /**
   * Durasi minimal loader ditampilkan dalam milidetik sebelum transisi ke aplikasi
   * @default 2000
   */
  minDuration?: number;
  /**
   * Callback yang dipanggil setelah durasi minimal selesai dan animasi fade-out tuntas
   */
  onFinished?: () => void;
  /**
   * Apakah ditampilkan full-screen fixed overlay
   * @default true
   */
  fullScreen?: boolean;
  /**
   * Varian tampilan ring:
   * - 'orbit': Ring luar berputar mengitari logo (logo tetap tegak & stabil di tengah) - Rekomendasi
   * - 'spin-all': Seluruh ring dan logo ikut berputar sesuai snippet referensi awal
   * @default 'orbit'
   */
  variant?: 'orbit' | 'spin-all';
  /**
   * Custom className
   */
  className?: string;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  message = 'Memuat…',
  subMessage = 'Menyiapkan sistem operasional SS Traveling ERP',
  minDuration = 2000,
  onFinished,
  fullScreen = true,
  variant = 'orbit',
  className,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // 1. Progress percentage bar berjalan mulus dari 0% hingga 100% tepat selama minDuration
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / minDuration) * 100), 99);
      setProgress(pct);
    }, 25);

    // 2. Timer penahan durasi minimal (default 2000ms / 2 detik)
    const timer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);

      // 3. Jeda animasi fade-out sebelum memanggil onFinished
      const exitTimer = setTimeout(() => {
        if (onFinished) {
          onFinished();
        }
      }, 500);

      return () => clearTimeout(exitTimer);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDuration, onFinished]);

  const content = (
    <div
      role="status"
      aria-label={message}
      className={cn(
        'select-none transition-all duration-500 ease-out',
        fullScreen
          ? 'fixed inset-0 z-[99999999] h-screen w-screen flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl'
          : 'min-h-[400px] w-full flex flex-col items-center justify-center p-8',
        isFadingOut && 'opacity-0 scale-[0.98] pointer-events-none',
        className
      )}
    >
      {/* Ambient Glow */}
      <div className="absolute -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/10 via-emerald-500/10 to-indigo-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container sesuai gap 28px referensi */}
      <div className="flex flex-col items-center justify-center text-center gap-7 px-4">
        {/* Ring & Logo Section (Dimensi 280px sesuai spesifikasi referensi) */}
        {variant === 'orbit' ? (
          <div className="relative w-[280px] h-[280px] flex items-center justify-center">
            {/* Outer Spinning Ring (border-top-color: #2878f0, border: #dce3f1, 5px) */}
            <div
              className="absolute inset-0 rounded-full border-[5px] border-[#dce3f1] dark:border-zinc-800 border-t-[#2878f0] animate-spin shadow-sm"
              style={{ animationDuration: '1.2s' }}
            />

            {/* Inner Decorative Accent Ring */}
            <div
              className="absolute inset-3 rounded-full border border-dashed border-[#2878f0]/30 animate-spin"
              style={{ animationDuration: '8s', animationDirection: 'reverse' }}
            />

            {/* Logo Pendopo (72% x 72% object-contain di tengah tetap tegak) */}
            <div className="relative z-10 w-[72%] h-[72%] flex items-center justify-center p-2">
              <img
                src={pendopoLogo}
                alt="SS Transport Logo"
                className="w-full h-full object-contain filter drop-shadow-md"
                loading="eager"
              />
            </div>
          </div>
        ) : (
          /* Varian Spin-All: Seluruh ring dan logo ikut berputar sesuai snippet referensi */
          <div
            className="w-[280px] h-[280px] rounded-full border-[5px] border-[#dce3f1] dark:border-zinc-800 border-t-[#2878f0] grid place-items-center animate-spin p-5"
            style={{ animationDuration: '1.2s' }}
          >
            <img
              src={pendopoLogo}
              alt="SS Transport Logo"
              className="w-[72%] h-[72%] object-contain"
              loading="eager"
            />
          </div>
        )}

        {/* Text Section sesuai styling referensi (color: #243a78, font 20px) */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[20px] font-sans font-semibold tracking-wide text-[#243a78] dark:text-blue-300">
            {message}
          </span>
          {subMessage && (
            <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium tracking-normal">
              {subMessage}
            </span>
          )}
        </div>

        {/* Progress Bar Halus & Persentase 0-100% */}
        <div className="flex flex-col items-center gap-1.5 w-64">
          <div className="w-full h-1.5 bg-[#dce3f1] dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#2878f0] to-[#1cb85a] rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-zinc-500">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );

  // Render via React Portal ke document.body agar bebas dari stacking context / backdrop-blur parent
  if (fullScreen && mounted && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

export default BrandLoader;
