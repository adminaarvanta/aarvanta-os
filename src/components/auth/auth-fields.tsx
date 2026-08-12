"use client";

import {
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  Phone,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const FIELD_ICONS = {
  name: UserRound,
  email: Mail,
  password: Lock,
  phone: Phone,
  country: Globe2,
  company: Building2,
  referral: Tag,
} as const;

export type AuthFieldIcon = keyof typeof FIELD_ICONS;

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id?: string;
  label: string;
  hint?: string;
  icon?: AuthFieldIcon;
};

export function AuthField({
  id,
  label,
  hint,
  icon,
  className,
  type = "text",
  ...props
}: AuthFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const Icon = icon ? FIELD_ICONS[icon] : null;

  return (
    <div className="group/field space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors group-focus-within/field:text-gold"
      >
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim transition-colors group-focus-within/field:text-gold"
            aria-hidden
          />
        ) : null}
        <input
          id={fieldId}
          type={type}
          className={cn(
            "h-12 w-full rounded-2xl border border-border/80 bg-surface-muted/80 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-dim/80",
            "hover:border-border hover:bg-surface",
            "focus:border-gold/70 focus:bg-surface focus:shadow-[0_0_0_4px_rgba(168,137,79,0.14)]",
            Icon ? "pl-11 pr-3.5" : "px-3.5",
            className
          )}
          {...props}
        />
      </div>
      {hint ? <p className="text-[11px] text-dim">{hint}</p> : null}
    </div>
  );
}

type AuthPasswordFieldProps = Omit<AuthFieldProps, "type" | "icon"> & {
  icon?: AuthFieldIcon;
};

export function AuthPasswordField({
  id,
  label,
  hint,
  icon = "password",
  className,
  ...props
}: AuthPasswordFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const Icon = FIELD_ICONS[icon];

  return (
    <div className="group/field space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors group-focus-within/field:text-gold"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim transition-colors group-focus-within/field:text-gold"
          aria-hidden
        />
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className={cn(
            "h-12 w-full rounded-2xl border border-border/80 bg-surface-muted/80 pl-11 pr-12 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-dim/80",
            "hover:border-border hover:bg-surface",
            "focus:border-gold/70 focus:bg-surface focus:shadow-[0_0_0_4px_rgba(168,137,79,0.14)]",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-dim transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint ? <p className="text-[11px] text-dim">{hint}</p> : null}
    </div>
  );
}

type AuthSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id?: string;
  label: string;
  icon?: AuthFieldIcon;
  options: readonly string[];
};

export function AuthSelect({
  id,
  label,
  icon = "country",
  options,
  className,
  ...props
}: AuthSelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const Icon = FIELD_ICONS[icon] as LucideIcon;

  return (
    <div className="group/field space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors group-focus-within/field:text-gold"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim transition-colors group-focus-within/field:text-gold"
          aria-hidden
        />
        <select
          id={fieldId}
          className={cn(
            "h-12 w-full appearance-none rounded-2xl border border-border/80 bg-surface-muted/80 pl-11 pr-10 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,box-shadow,background-color]",
            "hover:border-border hover:bg-surface",
            "focus:border-gold/70 focus:bg-surface focus:shadow-[0_0_0_4px_rgba(168,137,79,0.14)]",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function AuthSubmitButton({
  children,
  busy,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || props.disabled}
      className={cn(
        "relative mt-1 inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#c4a46a] to-[#a8894f] px-4 text-sm font-semibold text-[#0e1522] shadow-[0_10px_24px_-12px_rgba(168,137,79,0.75)] transition-[transform,filter,box-shadow] hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/35" />
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function AuthAlert({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-sm text-red-500"
      role="alert"
    >
      {children}
    </p>
  );
}
