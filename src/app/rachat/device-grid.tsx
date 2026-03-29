"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Device = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  price_perfect: number;
  price_good: number;
  price_broken: number;
};

type DeviceGridProps = {
  devices: Device[];
};

export function DeviceGrid({ devices }: DeviceGridProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {devices.map((device) => (
          <motion.button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className="flex flex-col items-start border border-foreground/20 bg-background p-6 text-left hover:border-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mb-1 text-xs uppercase tracking-premium text-foreground/60">
              {device.brand}
            </span>
            <span className="text-lg font-medium text-foreground">
              {device.name}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelectedDevice(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="mx-4 w-full max-w-lg border border-foreground/20 bg-background p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8">
                <span className="text-xs uppercase tracking-premium text-foreground/60">
                  {selectedDevice.brand}
                </span>
                <h2 className="text-3xl font-bold text-foreground">
                  {selectedDevice.name}
                </h2>
              </div>

              <p className="mb-6 text-sm text-foreground/60">
                Sélectionnez l&apos;état de votre appareil
              </p>

              <div className="flex flex-col gap-3">
                <PriceOption
                  label="Parfait"
                  description="Aucune rayure, fonctionne parfaitement"
                  price={selectedDevice.price_perfect}
                  delay={0}
                />
                <PriceOption
                  label="Bon"
                  description="Légères traces d'usure, fonctionne bien"
                  price={selectedDevice.price_good}
                  delay={0.05}
                />
                <PriceOption
                  label="Brisé"
                  description="Écran fissuré ou défaut majeur"
                  price={selectedDevice.price_broken}
                  delay={0.1}
                />
              </div>

              <button
                onClick={() => setSelectedDevice(null)}
                className="mt-8 w-full border border-foreground/20 py-3 text-sm text-foreground/60 hover:border-foreground hover:text-foreground"
              >
                Retour
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type PriceOptionProps = {
  label: string;
  description: string;
  price: number;
  delay: number;
};

function PriceOption({ label, description, price, delay }: PriceOptionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", damping: 20, stiffness: 300 }}
      className="group flex items-center justify-between border border-foreground/20 p-4 text-left hover:border-foreground hover:bg-foreground hover:text-background"
    >
      <div>
        <span className="block text-lg font-medium">{label}</span>
        <span className="block text-xs opacity-60 group-hover:opacity-80">
          {description}
        </span>
      </div>
      <span className="text-2xl font-bold">{price}$</span>
    </motion.button>
  );
}
