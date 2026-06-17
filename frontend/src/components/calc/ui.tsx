import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { CalcInputs } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SectionCardTitle({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      {icon}
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export function NumberField({
  label,
  name,
  step = "any",
  min,
  placeholder,
  hint,
  className,
}: {
  label: string;
  name: string;
  step?: string;
  min?: number;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  const { register } = useFormContext<CalcInputs>();
  const id = `f-${name.replace(/\./g, "-")}`;
  return (
    <Field label={label} htmlFor={id} hint={hint} className={className}>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        placeholder={placeholder}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...register(name as any, { valueAsNumber: true })}
      />
    </Field>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}
