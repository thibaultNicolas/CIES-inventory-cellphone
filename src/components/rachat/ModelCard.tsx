"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type ModelCardProps = {
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  onClick?: () => void;
  isSelected?: boolean;
};

export function ModelCard({ name, imageUrl, minPrice, maxPrice, onClick, isSelected }: ModelCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`group flex w-full flex-col overflow-hidden rounded-card border-2 bg-secondary shadow-soft transition-all ${
        isSelected
          ? "border-brand-primary shadow-glow"
          : "border-foreground/10 hover:border-foreground/30"
      }`}
      whileHover={{ scale: 1.01, y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex aspect-square w-full items-center justify-center bg-background/50 p-8">
        <Image
          src={imageUrl}
          alt={name}
          width={200}
          height={200}
          className="h-[70%] w-[70%] object-contain bg-transparent mix-blend-multiply"
        />
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-sm font-medium uppercase tracking-widest text-foreground">
          {name}
        </span>
        <span className="text-xs text-foreground/50">
          Valeur estimée : {minPrice === maxPrice ? `${minPrice}$` : `${minPrice}$-${maxPrice}$`}
        </span>
      </div>
    </motion.button>
  );
}
