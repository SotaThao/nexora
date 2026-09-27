import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "../../../components";

export function Section({ title, hint, children }: PropsWithChildren<{ title: string; hint?: ReactNode }>) {
  return (
    <Card className="p-5">
      <h2 className="font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-nexoraMuted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

export function Field({ label, error, hint, children, htmlFor }: PropsWithChildren<{
  label: string; error?: string | null; hint?: ReactNode; htmlFor?: string;
}>) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-nexoraText">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-nexoraMuted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-sm font-semibold text-nexoraDanger">{error}</p>}
    </div>
  );
}

export function Pills<T extends string | number | null>({ options, value, onChange, disabled = false }: {
  options: [T, string][]; value: T; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(v)}
          className={`min-h-11 rounded-lg border px-3.5 text-sm font-semibold disabled:opacity-45 ${
            v === value
              ? "border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand"
              : "border-nexoraBorder bg-white text-nexoraMuted"
          }`}
      >
          {label}
        </button>
      ))}
    </div>
  );
}
