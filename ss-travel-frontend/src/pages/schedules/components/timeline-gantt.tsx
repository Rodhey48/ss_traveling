import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Bus,
  Calendar,
  Clock,
  FileCheck,
  CheckCircle2,
  ChevronRight as ArrowRight,
  ChevronLeft as ArrowLeft,
  Sparkles,
} from 'lucide-react';
import type { TripSchedule, Vehicle } from '@/types';

export type GanttViewMode = '7days' | '14days' | 'month';

interface TimelineGanttProps {
  vehicles: Vehicle[];
  schedules: TripSchedule[];
  startDate: Date;
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
  onNavigate: (newStartDate: Date) => void;
  onSelectSchedule: (schedule: TripSchedule) => void;
  onConfirmSchedule?: (scheduleId: string, scheduleNo: string) => void;
  onGenerateSpj: (schedule: TripSchedule) => void;
  vehicleFilter?: string;
  onVehicleFilterChange?: (vId: string) => void;
}

interface ScheduledBar {
  schedule: TripSchedule;
  leftPercent: number;
  widthPercent: number;
  startsBeforeView: boolean;
  endsAfterView: boolean;
  depTimeStr: string;
  retTimeStr: string;
  durationLabel: string;
  lane: number;
}

export default function TimelineGantt({
  vehicles,
  schedules,
  startDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onSelectSchedule,
  onConfirmSchedule,
  onGenerateSpj,
  vehicleFilter = 'ALL',
  onVehicleFilterChange,
}: TimelineGanttProps) {
  // Hitung jumlah hari berdasarkan viewMode
  let daysCount = 7;
  if (viewMode === '14days') daysCount = 14;
  else if (viewMode === 'month') {
    // Jumlah hari penuh dalam bulan dari startDate
    const y = startDate.getFullYear();
    const m = startDate.getMonth();
    daysCount = new Date(y, m + 1, 0).getDate();
  }

  // Buat array Date untuk seluruh hari dalam rentang tampilan
  const days: Date[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const viewStart = new Date(startDate);
  viewStart.setHours(0, 0, 0, 0);

  const viewEnd = new Date(days[daysCount - 1]);
  viewEnd.setHours(23, 59, 59, 999);

  const totalViewMs = viewEnd.getTime() - viewStart.getTime();

  // Navigasi Prev/Next/Today
  const handlePrev = () => {
    if (viewMode === 'month') {
      const prevMonth = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      onNavigate(prevMonth);
    } else {
      const prev = new Date(startDate);
      prev.setDate(prev.getDate() - daysCount);
      onNavigate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      onNavigate(nextMonth);
    } else {
      const next = new Date(startDate);
      next.setDate(next.getDate() + daysCount);
      onNavigate(next);
    }
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (viewMode === 'month') {
      onNavigate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      onNavigate(today);
    }
  };

  const handleMonthSelect = (monthIdxStr: string) => {
    const monthIdx = parseInt(monthIdxStr, 10);
    const newDate = new Date(startDate.getFullYear(), monthIdx, 1);
    onNavigate(newDate);
  };

  const handleYearSelect = (yearStr: string) => {
    const y = parseInt(yearStr, 10);
    const newDate = new Date(y, startDate.getMonth(), 1);
    onNavigate(newDate);
  };

  const formatDateLabel = (d: Date) => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    return {
      dayName: dayNames[d.getDay()],
      dateNum: d.getDate(),
      month: monthNames[d.getMonth()],
      isToday: new Date().toDateString() === d.toDateString(),
    };
  };

  // Filter kendaraan jika ada filter spesifik
  const filteredVehicles = vehicleFilter === 'ALL'
    ? vehicles
    : vehicles.filter((v) => v.id === vehicleFilter);

  // Algoritma Penataan Bar Timeline Presisi Jam (Sub-day Continuous Offset) & Packing Jalur
  const packScheduleBars = (vehicleId: string): { bars: ScheduledBar[]; totalLanes: number } => {
    const busSchedules = schedules.filter((s) => {
      if (s.vehicleId !== vehicleId) return false;
      const dep = new Date(s.plannedDepartureAt).getTime();
      const ret = new Date(s.plannedReturnAt).getTime();
      return dep <= viewEnd.getTime() && ret >= viewStart.getTime();
    });

    if (busSchedules.length === 0) {
      return { bars: [], totalLanes: 1 };
    }

    // Urutkan jadwal berdasarkan jam keberangkatan
    const sorted = [...busSchedules].sort(
      (a, b) => new Date(a.plannedDepartureAt).getTime() - new Date(b.plannedDepartureAt).getTime(),
    );

    const laneEnds: number[] = [];
    const bars: ScheduledBar[] = [];

    for (const s of sorted) {
      const dep = new Date(s.plannedDepartureAt);
      const ret = new Date(s.plannedReturnAt);
      const depTime = dep.getTime();
      const retTime = ret.getTime();

      const clampedStart = Math.max(viewStart.getTime(), depTime);
      const clampedEnd = Math.min(viewEnd.getTime(), retTime);

      // Hitung persentase offset horizontal kontinu (presisi jam)
      const leftPercent = ((clampedStart - viewStart.getTime()) / totalViewMs) * 100;
      const rawWidthPercent = ((clampedEnd - clampedStart) / totalViewMs) * 100;
      // Beri batas minimal persentase agar bar tetap bisa di-klik dan terbaca
      const widthPercent = Math.max(viewMode === 'month' ? 2.5 : 4, rawWidthPercent);

      const startsBeforeView = depTime < viewStart.getTime();
      const endsAfterView = retTime > viewEnd.getTime();

      // Cari lane (jalur vertikal) yang tidak tumpang tindih
      let assignedLane = -1;
      for (let l = 0; l < laneEnds.length; l++) {
        if (laneEnds[l] <= depTime) {
          assignedLane = l;
          laneEnds[l] = retTime;
          break;
        }
      }

      if (assignedLane === -1) {
        assignedLane = laneEnds.length;
        laneEnds.push(retTime);
      }

      // Hitung durasi hari kalender
      const depDay = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
      const retDay = new Date(ret.getFullYear(), ret.getMonth(), ret.getDate());
      const totalDays = Math.max(
        1,
        Math.round((retDay.getTime() - depDay.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      );
      const totalNights = Math.max(0, totalDays - 1);
      const durationLabel =
        totalDays === 1 ? '1D PP' : `${totalDays}D${totalNights > 0 ? `${totalNights}N` : ''}`;

      const pad = (n: number) => String(n).padStart(2, '0');
      const depTimeStr = `${pad(dep.getHours())}:${pad(dep.getMinutes())}`;
      const retTimeStr = `${pad(ret.getHours())}:${pad(ret.getMinutes())}`;

      bars.push({
        schedule: s,
        leftPercent,
        widthPercent,
        startsBeforeView,
        endsAfterView,
        depTimeStr,
        retTimeStr,
        durationLabel,
        lane: assignedLane,
      });
    }

    return {
      bars,
      totalLanes: Math.max(1, laneEnds.length),
    };
  };

  // Warna bar yang sangat lembut, elegan, dan tidak kontras tajam
  const getServiceBadgeStyle = (type: string) => {
    switch (type) {
      case 'AKAP':
        return 'bg-indigo-50/75 border-indigo-200/60 text-indigo-950 hover:bg-indigo-100/70 border-l-[3.5px] border-l-indigo-500/80 dark:bg-indigo-950/30 dark:border-indigo-800/40 dark:text-indigo-200 dark:border-l-indigo-400';
      case 'WISATA':
        return 'bg-amber-50/75 border-amber-200/60 text-amber-950 hover:bg-amber-100/70 border-l-[3.5px] border-l-amber-500/80 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-200 dark:border-l-amber-400';
      default:
        return 'bg-emerald-50/75 border-emerald-200/60 text-emerald-950 hover:bg-emerald-100/70 border-l-[3.5px] border-l-emerald-500/80 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-200 dark:border-l-emerald-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shrink-0">Siap Jalan</span>;
      case 'IN_PROGRESS':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold animate-pulse shrink-0">Jalan</span>;
      case 'COMPLETED':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-medium shrink-0">Selesai</span>;
      case 'DRAFT':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-background/80 text-foreground/70 font-medium shrink-0 border border-border/40">Draft</span>;
      default:
        return <span className="text-[9px] px-1 py-0.2 rounded bg-red-100/80 text-red-800 dark:bg-red-950/60 dark:text-red-300 shrink-0">Batal</span>;
    }
  };

  const monthNamesFull = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const currentYear = startDate.getFullYear();
  const currentMonthIdx = startDate.getMonth();

  // Tentukan lebar minimum grid agar nyaman dilihat
  const minGridWidthClass = viewMode === 'month'
    ? 'min-w-[1750px]'
    : viewMode === '14days'
    ? 'min-w-[1250px]'
    : 'min-w-[950px]';

  return (
    <Card className="border shadow-xs overflow-hidden">
      {/* Header Toolbar Timeline */}
      <CardHeader className="p-4 sm:p-5 border-b bg-muted/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Gantt Chart Timeline Plotting Armada
            </CardTitle>
            <CardDescription className="text-xs">
              Visualisasi waktu operasional armada bus secara kontinu dengan presisi jam keberangkatan & kepulangan.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-between lg:justify-end">
            {/* Filter Armada Bus Spesifik */}
            {onVehicleFilterChange && (
              <Select value={vehicleFilter} onValueChange={onVehicleFilterChange}>
                <SelectTrigger className="h-8 text-xs w-[135px] bg-background">
                  <SelectValue placeholder="Semua Bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Bus ({vehicles.length})</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.code} ({v.nickname || 'Bus'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Selector Mode Rentang Tampilan: 7 Hari, 14 Hari, 1 Bulan Penuh */}
            <div className="flex items-center gap-1 border rounded-lg bg-background p-0.5">
              <Button
                variant={viewMode === '7days' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('7days')}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                7 Hari
              </Button>
              <Button
                variant={viewMode === '14days' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('14days')}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                14 Hari
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('month')}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                1 Bulan Penuh
              </Button>
            </div>

            {/* Quick Month & Year Dropdown Picker saat mode 1 Bulan Penuh */}
            {viewMode === 'month' && (
              <div className="flex items-center gap-1">
                <Select value={String(currentMonthIdx)} onValueChange={handleMonthSelect}>
                  <SelectTrigger className="h-8 text-xs w-[110px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNamesFull.map((mName, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {mName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(currentYear)} onValueChange={handleYearSelect}>
                  <SelectTrigger className="h-8 text-xs w-[80px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8 font-medium">
              Hari Ini
            </Button>

            {/* Tombol Panah Navigasi Periode */}
            <div className="flex items-center gap-1 border rounded-lg bg-background p-0.5">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold px-2 min-w-[130px] text-center">
                {days[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                {days[daysCount - 1].toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <div className={minGridWidthClass}>
          {/* Header Baris Hari (Sticky Kolom Bus di Kiri) */}
          <div className="flex border-b bg-muted/50 text-xs font-semibold">
            {/* Kolom Info Armada Bus (Sticky di Kiri) */}
            <div className="w-[200px] sm:w-[220px] p-3 border-r flex items-center justify-between text-foreground sticky left-0 z-30 bg-muted/95 backdrop-blur-sm shrink-0 shadow-2xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Bus className="w-4 h-4 text-indigo-600" /> Armada ({filteredVehicles.length})
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Kapasitas</span>
            </div>

            {/* Kolom Tanggal Kalender */}
            <div
              className="flex-1 grid"
              style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}
            >
              {days.map((d, i) => {
                const { dayName, dateNum, month, isToday } = formatDateLabel(d);
                return (
                  <div
                    key={i}
                    className={`p-1.5 text-center border-r last:border-r-0 ${
                      isToday
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground/80'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider">{dayName}</div>
                    <div className="text-sm font-extrabold">{dateNum}</div>
                    <div className="text-[9px] text-muted-foreground">{month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Baris per Armada Bus */}
          <div className="divide-y">
            {filteredVehicles.map((v) => {
              const { bars, totalLanes } = packScheduleBars(v.id);
              // Tinggi baris dinamis menyesuaikan jumlah lane (minimal 70px)
              const rowHeight = Math.max(72, totalLanes * 50 + 16);

              return (
                <div key={v.id} className="flex hover:bg-muted/10 transition-colors">
                  {/* Kolom Info Armada Bus (Sticky di Kiri) */}
                  <div className="w-[200px] sm:w-[220px] p-3 border-r flex items-center justify-between bg-card sticky left-0 z-20 shrink-0 shadow-2xs">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span>{v.code}</span>
                        <span className="text-xs font-normal text-muted-foreground">({v.plateNumber})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                        {v.nickname || v.vehicleType}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                      {v.capacity} Seat
                    </Badge>
                  </div>

                  {/* Kolom Grid Timeline Hari (Continuous Precise Time Positioning) */}
                  <div
                    className="flex-1 relative"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {/* Layer 1: Background Columns Grid */}
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{ gridTemplateColumns: `repeat(${daysCount}, minmax(0, 1fr))` }}
                    >
                      {days.map((dayDate, dayIdx) => {
                        const { isToday } = formatDateLabel(dayDate);
                        return (
                          <div
                            key={dayIdx}
                            className={`border-r last:border-r-0 h-full ${
                              isToday ? 'bg-primary/5' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Layer 2: Continuous Precise Floating Schedule Bars */}
                    {bars.length === 0 ? (
                      <div className="relative z-0 h-full flex items-center justify-center text-[11px] text-muted-foreground/35 font-medium italic select-none">
                        Armada Standby
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-10 p-1 pointer-events-none">
                        {bars.map((bar) => {
                          const s = bar.schedule;
                          const topOffset = bar.lane * 48 + 4;

                          const isAkap = s.serviceType === 'AKAP';
                          const isWisata = s.serviceType === 'WISATA';
                          const crewColorClass = isAkap
                            ? 'text-indigo-800 dark:text-indigo-300'
                            : isWisata
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-emerald-800 dark:text-emerald-300';

                          return (
                            <div
                              key={s.id}
                              style={{
                                left: `${bar.leftPercent}%`,
                                width: `${bar.widthPercent}%`,
                                top: `${topOffset}px`,
                                height: '44px',
                              }}
                              className="absolute pointer-events-auto px-0.5"
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={() => onSelectSchedule(s)}
                                      className={`h-full px-2 py-1 border text-left cursor-pointer transition-all hover:brightness-105 hover:shadow-sm shadow-2xs flex flex-col justify-between overflow-hidden ${getServiceBadgeStyle(
                                        s.serviceType,
                                      )} ${
                                        bar.startsBeforeView ? 'rounded-l-none' : 'rounded-l-md'
                                      } ${
                                        bar.endsAfterView ? 'rounded-r-none' : 'rounded-r-md'
                                      }`}
                                    >
                                      {/* Baris Atas Bar: No Jadwal, Waktu Keberangkatan, Durasi & Status */}
                                      <div className="flex items-center justify-between gap-1 leading-tight">
                                        <div className="flex items-center gap-1 truncate">
                                          {bar.startsBeforeView && (
                                            <ArrowLeft className="w-2.5 h-2.5 text-primary shrink-0" />
                                          )}
                                          <span className="font-extrabold text-[11px] tracking-tight truncate text-foreground">
                                            {s.scheduleNo}
                                          </span>
                                          <span className="text-[9px] font-semibold text-muted-foreground/90 shrink-0">
                                            ({bar.depTimeStr} WIB • {bar.durationLabel})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-0.5 shrink-0">
                                          {getStatusBadge(s.status)}
                                          {bar.endsAfterView && (
                                            <ArrowRight className="w-2.5 h-2.5 text-primary shrink-0" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Baris Bawah Bar: Rute & Kru Supir */}
                                      <div className="flex items-center justify-between gap-2 text-[10px] leading-tight">
                                        <div className="font-medium text-foreground truncate flex items-center gap-1">
                                          <span className="text-muted-foreground truncate">{s.origin.split('/')[0].trim()}</span>
                                          <span className="text-muted-foreground text-[8px]">➔</span>
                                          <span className="font-semibold truncate">{s.destination}</span>
                                        </div>

                                        {s.plannedDriver1 && (
                                          <div className={`shrink-0 font-medium truncate ${crewColorClass}`}>
                                            👤 {s.plannedDriver1.name.split(' ')[0]}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>

                                  <TooltipContent
                                    side="top"
                                    className="bg-popover text-popover-foreground border shadow-xl max-w-[340px] p-3.5 space-y-2 z-50"
                                  >
                                    <div className="flex items-center justify-between border-b pb-1.5">
                                      <div>
                                        <span className="font-bold text-xs">{s.scheduleNo}</span>
                                        <span className="text-[10px] text-muted-foreground block font-medium">
                                          Durasi: {bar.durationLabel}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="text-[10px] font-semibold">
                                        {s.serviceType}
                                      </Badge>
                                    </div>

                                    <div className="text-xs space-y-1.5 text-foreground">
                                      <p>
                                        <strong>Rute:</strong> {s.origin} ➔ {s.destination}
                                      </p>
                                      <div className="p-2 rounded-lg bg-muted/60 text-[11px] space-y-1">
                                        <p className="flex items-center gap-1.5 text-muted-foreground">
                                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                          <strong>Keberangkatan:</strong>{' '}
                                          {new Date(s.plannedDepartureAt).toLocaleString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}{' '}
                                          WIB
                                        </p>
                                        <p className="flex items-center gap-1.5 text-muted-foreground">
                                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          <strong>Kepulangan:</strong>{' '}
                                          {new Date(s.plannedReturnAt).toLocaleString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}{' '}
                                          WIB
                                        </p>
                                      </div>

                                      {s.plannedDriver1 && (
                                        <p>
                                          <strong>Supir:</strong> {s.plannedDriver1.name}
                                          {s.plannedDriver2 ? ` & ${s.plannedDriver2.name}` : ''}
                                          {s.plannedConductor ? ` (Kondektur: ${s.plannedConductor.name})` : ''}
                                        </p>
                                      )}

                                      {s.customer && (
                                        <p className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                          <Sparkles className="w-3.5 h-3.5" />
                                          Klien: {s.customer.institutionName || s.customer.picName}
                                          {Number(s.totalPackagePrice) > 0 && (
                                            <span className="text-foreground ml-1">
                                              (Rp {Number(s.totalPackagePrice).toLocaleString('id-ID')})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    <div className="pt-2 space-y-1.5 border-t">
                                      {s.status === 'DRAFT' && onConfirmSchedule && (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onConfirmSchedule(s.id, s.scheduleNo);
                                          }}
                                          className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Kunci Jadwal (Konfirmasi)
                                        </Button>
                                      )}

                                      {s.status === 'CONFIRMED' && !s.spjId && (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onGenerateSpj(s);
                                          }}
                                          className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold"
                                        >
                                          <FileCheck className="w-3.5 h-3.5 mr-1.5" /> Terbitkan SPJ Resmi
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectSchedule(s);
                                        }}
                                        className="w-full h-7 text-xs font-medium"
                                      >
                                        Buka Detail / Edit Jadwal
                                      </Button>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
