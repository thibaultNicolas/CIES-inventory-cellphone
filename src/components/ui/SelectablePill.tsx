import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectablePillProps = {
  isSelected: boolean;
  onClick: () => void;
  label: string;
  className?: string;
};

export function SelectablePill({
  isSelected,
  onClick,
  label,
  className,
}: SelectablePillProps) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        checked={isSelected}
        onChange={onClick}
        className="sr-only"
      />
      <span
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-medium transition-all",
          isSelected
            ? "border-brand-primary bg-brand-primary/5 text-brand-dark shadow-glow scale-[1.02]"
            : "border-black/5 bg-background text-foreground hover:border-black/15",
          className
        )}
      >
        {label}
        {isSelected && <Check className="h-4 w-4 text-brand-primary" />}
      </span>
    </label>
  );
}
