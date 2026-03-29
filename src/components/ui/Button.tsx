import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  asChild?: boolean;
};

const buttonVariants = {
  primary: "bg-brand-dark text-background hover:bg-brand-primary hover:scale-105",
  secondary: "bg-brand-primary text-background hover:scale-105",
  outline: "border-2 border-brand-dark bg-background text-brand-dark hover:bg-brand-dark hover:text-background hover:scale-105",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full px-12 py-5 text-sm font-medium uppercase tracking-[0.15em] shadow-lg transition-all duration-300",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
