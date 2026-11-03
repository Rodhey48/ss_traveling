import { useApiLoading } from "@/hooks/use-api-loading";

export default function ApiLoadingBar() {
  const isLoading = useApiLoading();

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-emerald-500/15 overflow-hidden pointer-events-none transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full w-full bg-linear-to-r from-emerald-500 via-teal-300 to-emerald-600 origin-left"
        style={{
          animation: isLoading
            ? "indeterminate-progress 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite"
            : "none",
        }}
      />
      <style>{`
        @keyframes indeterminate-progress {
          0% {
            transform: translateX(-100%) scaleX(0.2);
          }
          50% {
            transform: translateX(20%) scaleX(0.6);
          }
          100% {
            transform: translateX(100%) scaleX(0.2);
          }
        }
      `}</style>
    </div>
  );
}
