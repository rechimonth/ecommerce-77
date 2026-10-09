import type { ReactNode } from "react";
type ButtonSize = "sm" | "md" | "lg";
type SolidButtonProps = { variant: "solid"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; loading?: boolean };
type LinkButtonProps = { variant: "link"; href: string; target?: string };
type SharedProps = { size?: ButtonSize; fullWidth?: boolean; children?: ReactNode };
type ButtonProps = (SolidButtonProps | LinkButtonProps) & SharedProps;

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base",
};

// Botón reusable con variantes tipadas; type="submit" conecta con formularios nativos.
export function Button(props: ButtonProps) {
  const size = props.size ?? "md";
  const width = props.fullWidth ? "w-full" : "";
  const base = `inline-flex items-center justify-center rounded-sm font-bold transition-colors ${sizes[size]} ${width}`;
  if (props.variant === "link") {
    return <a href={props.href} target={props.target} className={`${base} text-black underline-offset-4 hover:underline`}>{props.children}</a>;
  }
  const isDisabled = props.disabled || props.loading;
  return <button type={props.type ?? "button"} className={`${base} bg-black text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300`} disabled={isDisabled} onClick={props.onClick}>
    {props.loading ? "Guardando…" : props.children}
  </button>;
}
