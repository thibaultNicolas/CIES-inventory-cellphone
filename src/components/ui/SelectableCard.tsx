import { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectableCardProps = {
  isSelected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function SelectableCard({
  isSelected,
  onClick,
  children,
  icon,
  className,
}: SelectableCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-center gap-4 rounded-[24px] border-2 p-6 shadow-soft transition-all",
        isSelected
          ? "border-brand-primary bg-brand-primary/5 shadow-glow scale-[1.02]"
          : "border-black/5 bg-background hover:border-black/15 hover:-translate-y-1",
        className
      )}
    >
      <input
        type="radio"
        checked={isSelected}
        onChange={onClick}
        className="sr-only"
      />
      {icon && (
        <div
          className={cn(
            "transition-colors",
            isSelected ? "text-brand-primary" : "text-foreground/50"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1">{children}</div>
      {isSelected && (
        <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
      )}
    </label>
  );
}
