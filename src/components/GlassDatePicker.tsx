import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric"
});

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type GlassDatePickerProps = {
  className?: string;
  label: string;
  minDate?: string;
  name?: string;
  onChange: (value: string) => void;
  value: string;
  variant?: "field" | "hero";
};

export function GlassDatePicker({
  className = "",
  label,
  minDate,
  name,
  onChange,
  value,
  variant = "field"
}: GlassDatePickerProps) {
  const [open, setOpen] = useState(false);
  const fallbackDate = minDate ? fromDateInputValue(minDate) : new Date();
  const selectedDate = value ? fromDateInputValue(value) : undefined;
  const [viewMonth, setViewMonth] = useState(() => selectedDate || fallbackDate);
  const pickerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const minimumDate = minDate ? fromDateInputValue(minDate) : undefined;
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const calendarCells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1))
  ];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div
      className={[
        "minimal-date-field",
        variant === "hero" ? "hero-date-picker" : "glass-date-picker",
        open ? "open" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      ref={pickerRef}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        className="minimal-date-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setViewMonth(selectedDate || fallbackDate);
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <CalendarDays size={20} />
        <span>
          <small>{label}</small>
          <strong>{selectedDate ? dateFormatter.format(selectedDate) : "Select date"}</strong>
        </span>
      </button>

      {open ? (
        <div className="minimal-calendar-popover" role="dialog" aria-label={`${label} calendar`}>
          <div className="minimal-calendar-head">
            <button type="button" aria-label="Previous month" onClick={() => setViewMonth((current) => addMonths(current, -1))}>
              <ChevronLeft size={16} />
            </button>
            <strong>{monthFormatter.format(viewMonth)}</strong>
            <button type="button" aria-label="Next month" onClick={() => setViewMonth((current) => addMonths(current, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="minimal-calendar-grid minimal-calendar-weekdays" aria-hidden="true">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="minimal-calendar-grid">
            {calendarCells.map((date, index) => {
              if (!date) return <span className="minimal-calendar-empty" key={`empty-${index}`} />;

              const disabled = minimumDate ? date < minimumDate : false;
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);
              return (
                <button
                  type="button"
                  className={["minimal-calendar-day", selected ? "selected" : "", isToday ? "today" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  key={toDateInputValue(date)}
                  onClick={() => {
                    onChange(toDateInputValue(date));
                    setOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
