import { Printer, X, Bus } from 'lucide-react';
import type { Spj } from '@/types';

interface SpjPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spj: Spj | null;
}

export default function SpjPrintModal({
  open,
  onOpenChange,
  spj,
}: SpjPrintModalProps) {
  if (!open || !spj) return null;

  const handlePrint = () => {
    window.print();
  };

  const driver1 = spj.crewAssignments?.find((c) => c.role === 'DRIVER');
  const driver2 = spj.crewAssignments?.find((c) => c.role === 'CO_DRIVER');
  const conductor = spj.crewAssignments?.find((c) => c.role === 'CONDUCTOR');
  const stewardess = spj.crewAssignments?.find((c) => c.role === 'STEWARDESS');

  const departureDate = spj.tripSchedule?.plannedDepartureAt
    ? new Date(spj.tripSchedule.plannedDepartureAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : spj.issuedAt
    ? new Date(spj.issuedAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        {/* Modal Actions Bar (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
              <Bus className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pratinjau Cetak Surat Perintah Jalan (SPJ)
              </h3>
              <p className="text-xs text-slate-500">
                Format dokumen fisik resmi supir PT SS Traveling Official
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              Cetak Dokumen Fisik (A4)
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PHYSICAL DOCUMENT AREA */}
        <div className="mt-4 bg-white p-6 border border-slate-300 rounded-xl font-sans text-slate-900 print:border-none print:p-0 print:m-0 print:w-full">
          {/* KOP SURAT RESMI */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-black text-xl shadow-md border-2 border-amber-400">
                SS
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  PT SS TRAVELINK OFFICIAL INDONESIA
                </h1>
                <p className="text-xs font-bold text-amber-600">
                  Layanan Bus AKAP Eksekutif & Pariwisata Mewah (Luxury Seat 2-1 • Combi • Sleeper)
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Jl. Pahlawan Gerbang No. 08 Rempoa, Ciputat Timur, Tangerang Selatan • Telp: 0822-9994-3700 • www.sstravelink.id
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-slate-900 px-3 py-1 text-xs font-black tracking-wider text-amber-300 uppercase">
                {spj.serviceType}
              </span>
              <div className="mt-1 font-mono text-sm font-extrabold text-slate-900">
                {spj.spjNo}
              </div>
              <div className="text-[10px] text-slate-500">
                Status: {spj.operationalStatus}
              </div>
            </div>
          </div>

          {/* DOKUMEN HEADER TITLE */}
          <div className="my-3 text-center">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-2 underline-offset-4">
              SURAT PERINTAH JALAN (SPJ)
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Dokumen Perjalanan Dinas Resmi Armada & Kru Pengemudi Bus
            </p>
          </div>

          {/* SECTION 1: DATA ARMADA & JADWAL DINAS */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-300 bg-slate-50/70 p-3 text-xs">
            <div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500 font-medium">Nomor Lambung:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {spj.vehicle?.code || 'ARMADA'} ({spj.vehicle?.nickname || 'Unit Reguler'})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <span className="text-slate-500 font-medium">Nomor Polisi:</span>
                <span className="col-span-2 font-mono font-bold text-slate-900">
                  {spj.vehicle?.plateNumber || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <span className="text-slate-500 font-medium">Kapasitas Kursi:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {spj.vehicle?.capacity || 24} Kursi (Sleeper & Luxury Seat)
                </span>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500 font-medium">Tgl Berangkat:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {departureDate}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <span className="text-slate-500 font-medium">Rute Utama:</span>
                <span className="col-span-2 font-bold text-indigo-900">
                  {spj.tripSchedule?.origin || 'Tangerang/Ciputat'} ➔{' '}
                  {spj.tripSchedule?.destination || 'Yogyakarta'} (PP)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <span className="text-slate-500 font-medium">Jadwal Asal:</span>
                <span className="col-span-2 font-mono text-slate-700">
                  {spj.tripSchedule?.scheduleNo || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: SUSUNAN KRU DINAS PERJALANAN */}
          <div className="mt-3">
            <div className="border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wider text-slate-800">
              Personel Kru Pengemudi & Pelayanan Kabin
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-slate-300 p-2 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Driver 1 (Pengemudi Utama)
                </span>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  {driver1?.crew?.name || 'Pak Budi'}
                </div>
                <div className="text-[10px] text-slate-500">
                  NIP/No: {driver1?.crew?.nip || 'DRV-01'} • SIM BII Umum
                </div>
              </div>

              <div className="rounded-lg border border-slate-300 p-2 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Driver 2 (Pengemudi Cadangan)
                </span>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  {driver2?.crew?.name || 'Pak Joko / Pak Hendra'}
                </div>
                <div className="text-[10px] text-slate-500">
                  NIP/No: {driver2?.crew?.nip || 'DRV-02'} • SIM BII Umum
                </div>
              </div>

              <div className="rounded-lg border border-slate-300 p-2 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Kondektur / Pramugari
                </span>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  {conductor?.crew?.name || stewardess?.crew?.name || 'Mas Anto'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Pelayanan & Manifes Bagasi Penumpang
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SEGMEN RUTE & KONTROL RESTORAN SERVIS MAKAN */}
          <div className="mt-3">
            <div className="border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wider text-slate-800">
              Segmen Perjalanan (Legs) & Hak Servis Makan Penumpang
            </div>
            <table className="mt-1.5 w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-1.5 px-2 border-r border-slate-300">Segmen</th>
                  <th className="py-1.5 px-2 border-r border-slate-300">Arah Rute</th>
                  <th className="py-1.5 px-2 border-r border-slate-300">Kota Berangkat ➔ Tujuan</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 text-center">Manifes Pax</th>
                  <th className="py-1.5 px-2">Rumah Makan Servis Makan Rekanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {spj.legs && spj.legs.length > 0 ? (
                  spj.legs.map((leg) => (
                    <tr key={leg.id}>
                      <td className="py-1 px-2 border-r border-slate-300 font-bold">
                        Leg {leg.sequenceNo}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300">
                        {leg.direction === 'DEPARTURE' ? 'Berangkat' : 'Pulang'}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 font-medium">
                        {leg.origin} ➔ {leg.destination}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                        {leg.passengerCount || 24} Orang
                      </td>
                      <td className="py-1 px-2 font-medium text-slate-700">
                        RM Taman Selera Subang (Kupon Rp 25.000 / Penumpang)
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-1 px-2 border-r border-slate-300 font-bold">Leg 1</td>
                    <td className="py-1 px-2 border-r border-slate-300">Berangkat</td>
                    <td className="py-1 px-2 border-r border-slate-300 font-medium">
                      Tangerang/Ciputat ➔ Yogyakarta
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                      24 Orang
                    </td>
                    <td className="py-1 px-2 font-medium">
                      RM Taman Selera Subang (Tol Cipali KM 102)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: TATA TERTIB OPERASIONAL & KESELAMATAN (SOP RESMI) */}
          <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50/50 p-2.5 text-[11px] leading-relaxed text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5">
              Instruksi Keselamatan & Kepatuhan Keuangan (SOP PT SS Traveling):
            </span>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>
                <strong>Prinsip Anti-Netting:</strong> Seluruh uang fisik penerimaan tiket tunai pool dan titipan setoran kargo wajib diserahkan <strong>100% bruto utuh</strong> ke meja kasir pool saat tiba di garasi.
              </li>
              <li>
                <strong>Keselamatan Kru:</strong> Pengemudi wajib bertukar supir di Rest Area Tol Cipali KM 228 / Kota Transit untuk menjaga batas maksimal berkendara 4 jam.
              </li>
              <li>
                <strong>Bukti Pengeluaran Sah:</strong> Nota BBM solar wajib mencantumkan nominal rupiah, volume liter, dan odometer KM bus yang valid.
              </li>
              <li>
                <strong>Batas Waktu Settlement Kasir:</strong> Surat Perintah Jalan fisik beserta sisa UJ tunai wajib direkonsiliasikan ke meja kasir pool maksimal <strong>2 jam</strong> pasca bus tiba di garasi.
              </li>
            </ol>
          </div>

          {/* SECTION 5: KOLOM PARAF & TANDA TANGAN RESMI */}
          <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-28 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Dispatcher / Pengawas
              </span>
              <div className="border-b border-dotted border-slate-400 mx-3 pb-1 font-bold text-slate-800">
                ( Ops Dispatcher )
              </div>
              <span className="text-[9px] text-slate-400">Penerbit SPJ</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-28 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Kasir Pool (UJ & Kas)
              </span>
              <div className="border-b border-dotted border-slate-400 mx-3 pb-1 font-bold text-slate-800">
                ( Kasir Pool Ciputat )
              </div>
              <span className="text-[9px] text-slate-400">Pencairan Plafon UJ</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-28 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Pengemudi 1 (Driver 1)
              </span>
              <div className="border-b border-dotted border-slate-400 mx-3 pb-1 font-bold text-slate-800">
                ( {driver1?.crew?.name || 'Pak Budi'} )
              </div>
              <span className="text-[9px] text-slate-400">Penanggung Jawab Bus</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-28 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Pengemudi 2 (Driver 2)
              </span>
              <div className="border-b border-dotted border-slate-400 mx-3 pb-1 font-bold text-slate-800">
                ( {driver2?.crew?.name || 'Pak Joko'} )
              </div>
              <span className="text-[9px] text-slate-400">Pengemudi Cadangan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
