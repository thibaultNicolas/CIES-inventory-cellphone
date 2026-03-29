"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type BrandCardProps = {
  name: string;
  logoUrl: string;
  onClick?: () => void;
};

type BrandCardPropsWithSelected = BrandCardProps & {
  isSelected?: boolean;
};

export function BrandCard({
  name,
  logoUrl,
  onClick,
  isSelected,
}: BrandCardPropsWithSelected) {
  return (
    <motion.button
      onClick={onClick}
      className={`group aspect-square w-full rounded-card border-2 bg-secondary p-6 shadow-soft transition-all ${
        isSelected
          ? "border-brand-primary shadow-glow"
          : "border-foreground/10 hover:border-foreground/30"
      }`}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <Image
          src={logoUrl}
          alt={name}
          width={200}
          height={120}
          // mix-blend-multiply helps hide a residual white background
          // when an image does not have perfect transparency.
          className="h-[40%] w-[40%] object-contain bg-transparent mix-blend-multiply grayscale group-hover:grayscale-0"
        />
      </div>
    </motion.button>
  );
}
