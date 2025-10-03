"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "px-4 py-2 rounded-lg text-sm transition";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:opacity-90"
      : "bg-transparent text-slate-700 border hover:bg-slate-50";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
