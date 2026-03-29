"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

type PriceHeroProps = {
  price: number | null;
  isLoading?: boolean;
  currency?: string;
};

export function PriceHero({
  price,
  isLoading = false,
  currency = "CAD",
}: PriceHeroProps) {
  const spring = useSpring(0, {
    damping: 25,
    stiffness: 150,
  });

  const display = useTransform(spring, (current) => Math.round(current));

  const previousPrice = useRef<number | null>(null);

  useEffect(() => {
    if (price !== null && price !== previousPrice.current) {
      spring.set(price);
      previousPrice.current = price;
    } else if (price === null) {
      spring.set(0);
    }
  }, [price, spring]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-20 w-48 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-6 w-32 animate-pulse rounded bg-foreground/10" />
      </div>
    );
  }

  if (price === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="relative w-full min-h-20 flex flex-col items-center justify-center py-2 sm:min-h-0 sm:py-0">
        <motion.div
          key={price}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <motion.span
              className="font-(family-name:--font-playfair) text-5xl font-light text-brand-primary tabular-nums sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {display}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-foreground/50 sm:text-2xl md:text-3xl"
            >
              $
            </motion.span>
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1.5 text-xs uppercase tracking-widest text-foreground/50 sm:mt-2 sm:text-sm"
          >
            {currency}
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}
