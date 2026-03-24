import { useMemo, useRef } from "react";
import { Button } from "./button";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function formatDate(value: string): string {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select date",
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = useMemo(() => formatDate(value), [value]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="sr-only"
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full justify-start border-white/10 bg-white/5 text-left text-sm text-white"
        onClick={() => {
          const picker = inputRef.current;
          if (!picker) return;
          if (typeof picker.showPicker === "function") {
            picker.showPicker();
          } else {
            picker.focus();
            picker.click();
          }
        }}
      >
        {label || placeholder}
      </Button>
    </div>
  );
}
