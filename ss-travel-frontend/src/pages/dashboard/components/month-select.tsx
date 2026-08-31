import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonthOptions } from "../lib/dashboard.utils";

interface MonthSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MonthSelect({ value, onChange }: MonthSelectProps) {
  const options = getMonthOptions();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Pilih bulan" />
      </SelectTrigger>
      <SelectContent>
        {options.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}