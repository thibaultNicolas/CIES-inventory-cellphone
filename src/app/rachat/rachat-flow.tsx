"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandCard } from "@/components/rachat/BrandCard";
import { ModelCard } from "@/components/rachat/ModelCard";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Model = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  min_price: number;
  max_price: number;
};

type RachatFlowProps = {
  brands: Brand[];
  models: Model[];
};

export function RachatFlow({ brands, models }: RachatFlowProps) {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const filteredModels = selectedBrand
    ? models.filter((m) => m.brand_id === selectedBrand.id)
    : [];

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
  };

  const handleBack = () => {
    if (selectedModel) {
      setSelectedModel(null);
    } else {
      setSelectedBrand(null);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!selectedBrand ? (
          <motion.div
            key="brands"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="mb-12 text-4xl font-bold text-foreground md:text-6xl">
              Choisissez votre marque
            </h1>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {brands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  name={brand.name}
                  logoUrl={brand.logo_url || `https://cdn.simpleicons.org/${brand.slug}/000000`}
                  onClick={() => handleBrandSelect(brand)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="models"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground"
            >
              <span>←</span>
              <span>Retour aux marques</span>
            </button>
            <h1 className="mb-12 text-4xl font-bold text-foreground md:text-6xl">
              {selectedBrand.name}
            </h1>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  name={model.name}
                  imageUrl={model.image_url || "/placeholder.png"}
                  minPrice={model.min_price}
                  maxPrice={model.max_price}
                  onClick={() => setSelectedModel(model)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedModel && (
          <ModelDetailModal
            model={selectedModel}
            brandName={selectedBrand?.name || ""}
            onClose={() => setSelectedModel(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

type ModelDetailModalProps = {
  model: Model;
  brandName: string;
  onClose: () => void;
};

function ModelDetailModal({ model, brandName, onClose }: ModelDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
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
            {brandName}
          </span>
          <h2 className="text-3xl font-bold text-foreground">{model.name}</h2>
        </div>

        <p className="mb-6 text-sm text-foreground/60">
          Sélectionnez la mémoire et l&apos;état de votre appareil
        </p>

        <a
          href={`/rachat/${model.slug}`}
          className="block w-full border border-foreground bg-foreground py-4 text-center text-background hover:bg-transparent hover:text-foreground"
        >
          Continuer
        </a>

        <button
          onClick={onClose}
          className="mt-4 w-full border border-foreground/20 py-3 text-sm text-foreground/60 hover:border-foreground hover:text-foreground"
        >
          Retour
        </button>
      </motion.div>
    </motion.div>
  );
}
