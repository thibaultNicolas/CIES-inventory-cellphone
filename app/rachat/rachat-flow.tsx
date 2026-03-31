"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { sortModelsByRecent } from "@/lib/model-sort";
import { submitRachat } from "../actions/submit-rachat";
import { Check, Sparkles, ThumbsUp, AlertTriangle } from "lucide-react";

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

type Condition = "Comme neuf" | "Bon" | "Acceptable" | "Rayé";

function looksLikeCanadianAddress(address: string): boolean {
  const value = (address || "").toUpperCase();
  const hasPostal = /[A-Z]\d[A-Z]\s?\d[A-Z]\d/.test(value);
  const hasProvince = /\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/.test(value);
  return hasPostal && hasProvince;
}

/** Trie les capacités stockage du plus petit au plus grand (ex: 64GB, 256GB, 1TB). */
function sortMemoryCapacities(memories: string[]): string[] {
  const toSortKey = (s: string): number => {
    const m = s
      .trim()
      .toUpperCase()
      .match(/^(\d+(?:\.\d+)?)\s*(GB|TB)?$/i);
    if (!m) return 0;
    const value = parseFloat(m[1]);
    const unit = (m[2] || "GB").toUpperCase();
    return unit === "TB" ? value * 1024 : value;
  };
  return [...memories].sort((a, b) => toSortKey(a) - toSortKey(b));
}

type RachatFlowProps = {
  brands: Brand[];
  models: Model[];
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function RachatFlow({ brands, models }: RachatFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(
    null,
  );
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const router = useRouter();

  const filteredModels = useMemo(() => {
    if (!selectedBrand) return [];
    const filtered = models.filter((m) => m.brand_id === selectedBrand.id);
    return sortModelsByRecent(filtered, selectedBrand.name);
  }, [selectedBrand, models]);

  useEffect(() => {
    const fetchMemories = async (modelId: string) => {
      const supabase = createClient();
      const { data } = await supabase
        .from("prices")
        .select("memory")
        .eq("model_id", modelId);

      if (data) {
        const uniqueMemories = [...new Set(data.map((d) => d.memory))];
        const sortedMemories = sortMemoryCapacities(uniqueMemories);
        setMemories(sortedMemories);
        if (sortedMemories.length === 1) {
          setSelectedMemory(sortedMemories[0]);
        }
      }
    };

    if (selectedModel) {
      fetchMemories(selectedModel.id);
    }
  }, [selectedModel]);

  useEffect(() => {
    const fetchPrice = async (
      modelId: string,
      condition: Condition,
      memory: string,
    ) => {
      setIsLoadingPrice(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("prices")
        .select("price")
        .eq("model_id", modelId)
        .eq("condition", condition)
        .eq("memory", memory)
        .single();

      if (data) {
        setPrice(data.price);
      }
      setIsLoadingPrice(false);
    };

    if (selectedModel && selectedCondition && selectedMemory) {
      fetchPrice(selectedModel.id, selectedCondition, selectedMemory);
    }
  }, [selectedModel, selectedCondition, selectedMemory]);

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setDirection(1);
    setStep(2);
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setSelectedCondition(null);
    setSelectedMemory(null);
    setPrice(null);
    setDirection(1);
    setStep(3);
  };

  const handleBack = () => {
    setDirection(-1);
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setSelectedCondition(null);
      setStep(2);
    } else if (step === 2) {
      setSelectedBrand(null);
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedModel ||
      !selectedBrand ||
      !selectedCondition ||
      !selectedMemory ||
      !price
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!looksLikeCanadianAddress(formData.address)) {
        alert("Adresse invalide: nous acceptons seulement des adresses au Canada.");
        return;
      }
      const result = await submitRachat({
        contactMode: "legacy",
        modelId: selectedModel.id,
        brandId: selectedBrand.id,
        modelName: selectedModel.name,
        brandName: selectedBrand.name,
        condition: selectedCondition,
        devicePhotos: [],
        memory: selectedMemory,
        price: price,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
      });

      if (!result.success || !result.id) {
        alert(result.error || "Erreur lors de l'envoi de votre demande.");
        return;
      }

      const params = new URLSearchParams({ id: result.id });
      const viewToken = (result as { viewToken?: string }).viewToken;
      if (viewToken) {
        params.set("token", viewToken);
      }
      if (Array.isArray((result as { ids?: string[] }).ids) && (result as { ids?: string[] }).ids?.length) {
        params.set("ids", (result as { ids: string[] }).ids.join(","));
      }
      if (result.requestGroupId) {
        params.set("order", result.requestGroupId);
      }
      router.push(`/rachat/succes?${params.toString()}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'envoi de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditions: {
    value: Condition;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "Comme neuf",
      label: "Parfait",
      description: "Aucune rayure, fonctionne parfaitement",
      icon: <Sparkles className="h-6 w-6" strokeWidth={1.5} />,
    },
    {
      value: "Bon",
      label: "Bon état",
      description: "Légères traces d'usure, fonctionne bien",
      icon: <ThumbsUp className="h-6 w-6" strokeWidth={1.5} />,
    },
    {
      value: "Rayé",
      label: "Écran brisé",
      description: "Écran fissuré ou défaut majeur",
      icon: <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />,
    },
  ];

  return (
    <div className="relative min-h-[60vh]" style={{ overflow: "visible" }}>
      <div className="mb-12 flex items-center gap-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center border text-sm ${
                step >= s
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/20 text-foreground/40"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`h-px w-12 ${
                  step > s ? "bg-foreground" : "bg-foreground/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-foreground/50">
              Étape 1 sur 3
            </span>
            <h1 className="mb-12 font-(family-name:--font-playfair) text-4xl font-light text-foreground md:text-5xl">
              Choisissez votre marque
            </h1>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand)}
                  className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-card border border-foreground/10 bg-secondary p-8 shadow-soft hover:border-foreground"
                >
                  <Image
                    src={
                      brand.logo_url ||
                      `https://cdn.simpleicons.org/${brand.slug}/000000`
                    }
                    alt={brand.name}
                    width={80}
                    height={80}
                    className="h-16 w-16 object-contain bg-transparent mix-blend-multiply grayscale group-hover:grayscale-0"
                    unoptimized
                  />
                  <span className="text-sm font-medium uppercase tracking-widest text-foreground/70 group-hover:text-foreground">
                    {brand.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground"
            >
              <span>←</span>
              <span>Retour</span>
            </button>
            <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-foreground/50">
              Étape 2 sur 3
            </span>
            <h1 className="mb-12 font-(family-name:--font-playfair) text-4xl font-light text-foreground md:text-5xl">
              Sélectionnez votre {selectedBrand?.name}
            </h1>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="group flex flex-col overflow-hidden rounded-card border border-foreground/10 bg-secondary shadow-soft hover:border-foreground"
                >
                  <div className="flex aspect-square items-center justify-center bg-secondary/50 p-6">
                    {model.image_url ? (
                      <Image
                        src={model.image_url}
                        alt={model.name}
                        width={150}
                        height={150}
                        className="h-[70%] w-[70%] object-contain bg-transparent mix-blend-multiply"
                        unoptimized
                      />
                    ) : (
                      <div className="text-4xl">📱</div>
                    )}
                  </div>
                  <div className="p-4 text-left">
                    <span className="block text-sm font-medium text-foreground">
                      {model.name}
                    </span>
                    <span className="mt-1 block text-xs text-foreground/50">
                      Valeur estimée :{" "}
                      {model.min_price === model.max_price
                        ? `${model.min_price}$`
                        : `${model.min_price}$-${model.max_price}$`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && selectedModel && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground"
            >
              <span>←</span>
              <span>Retour</span>
            </button>
            <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-foreground/50">
              Étape 3 sur 3
            </span>
            <h1 className="mb-12 font-(family-name:--font-playfair) text-4xl font-light text-foreground md:text-5xl">
              État de votre {selectedModel.name}
            </h1>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                {memories.length > 1 && (
                  <div>
                    <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-foreground/70">
                      Capacité
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {memories.map((memory) => (
                        <button
                          key={memory}
                          onClick={() => setSelectedMemory(memory)}
                          className={`rounded-full border px-8 py-4 text-sm ${
                            selectedMemory === memory
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/20 text-foreground hover:border-foreground"
                          }`}
                        >
                          {memory}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-foreground/70">
                    État de l&apos;appareil
                  </h3>
                  <div className="space-y-3">
                    {conditions.map((condition) => (
                      <button
                        key={condition.value}
                        onClick={() => setSelectedCondition(condition.value)}
                        className={`flex w-full items-center gap-4 rounded-[24px] border-2 bg-background p-6 text-left shadow-soft transition-all ${
                          selectedCondition === condition.value
                            ? "border-brand-primary bg-background shadow-glow"
                            : "border-foreground/10 bg-background hover:border-foreground/30"
                        }`}
                      >
                        <div
                          className={`${
                            selectedCondition === condition.value
                              ? "text-foreground"
                              : "text-foreground/50"
                          }`}
                        >
                          {condition.icon}
                        </div>
                        <div className="flex-1">
                          <span className="block font-(family-name:--font-playfair) text-lg font-light text-foreground">
                            {condition.label}
                          </span>
                          <span className="block text-sm text-foreground/60">
                            {condition.description}
                          </span>
                        </div>
                        {selectedCondition === condition.value && (
                          <Check className="h-5 w-5 text-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:pl-8">
                <div className="sticky top-32 rounded-card border border-foreground/10 bg-secondary p-8 shadow-soft">
                  <div className="mb-6 flex items-center gap-4">
                    {selectedModel.image_url ? (
                      <Image
                        src={selectedModel.image_url}
                        alt={selectedModel.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-contain bg-transparent mix-blend-multiply"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center text-3xl">
                        📱
                      </div>
                    )}
                    <div>
                      <span className="block text-xs text-foreground/50">
                        {selectedBrand?.name}
                      </span>
                      <span className="block text-lg font-medium text-foreground">
                        {selectedModel.name}
                      </span>
                      {selectedMemory && (
                        <span className="block text-sm text-foreground/60">
                          {selectedMemory}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedCondition && (
                    <div className="mb-6 border-t border-foreground/10 pt-6">
                      <span className="block text-sm text-foreground/60">
                        État :{" "}
                        {
                          conditions.find((c) => c.value === selectedCondition)
                            ?.label
                        }
                      </span>
                    </div>
                  )}

                  <div className="border-t border-foreground/10 pt-6">
                    <span className="block text-xs uppercase tracking-widest text-foreground/50">
                      Votre estimation
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      {isLoadingPrice ? (
                        <span className="text-2xl text-foreground/40">
                          Calcul...
                        </span>
                      ) : price ? (
                        <>
                          <span className="font-(family-name:--font-playfair) text-5xl font-light text-foreground">
                            {price}$
                          </span>
                          <span className="text-sm text-foreground/50">
                            CAD
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl text-foreground/40">--$</span>
                      )}
                    </div>
                  </div>

                  {price && selectedCondition && selectedMemory && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setDirection(1);
                        setStep(4);
                      }}
                      className="mt-8 w-full rounded-full border border-foreground bg-foreground px-12 py-5 text-center text-sm uppercase tracking-[0.15em] text-background hover:bg-transparent hover:text-foreground"
                    >
                      Continuer
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {step === 4 && selectedModel && selectedBrand && price && (
          <motion.div
            key="step4"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground"
            >
              <span>←</span>
              <span>Retour</span>
            </button>
            <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-foreground/50">
              Étape 4 sur 4
            </span>
            <h1 className="mb-12 font-(family-name:--font-playfair) text-4xl font-light text-foreground md:text-5xl">
              Vos coordonnées
            </h1>

            <div
              className="grid gap-8 lg:grid-cols-2"
              style={{ overflow: "visible" }}
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                style={{
                  minHeight: "auto",
                  overflow: "visible",
                  height: "auto",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-sm border border-foreground/20 bg-background px-6 py-4 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Courriel *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-sm border border-foreground/20 bg-background px-6 py-4 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-sm border border-foreground/20 bg-background px-6 py-4 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Adresse complète *
                  </label>
                  <textarea
                    id="address"
                    required
                    rows={4}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full rounded-sm border border-foreground/20 bg-background px-6 py-4 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-foreground bg-foreground px-12 py-5 text-center text-sm uppercase tracking-[0.15em] text-background hover:bg-transparent hover:text-foreground disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi en cours..." : "Finaliser ma demande"}
                </button>
              </form>

              <div className="lg:pl-8">
                <div className="sticky top-32 rounded-card border border-foreground/10 bg-secondary p-8 shadow-soft">
                  <div className="mb-6 flex items-center gap-4">
                    {selectedModel.image_url ? (
                      <Image
                        src={selectedModel.image_url}
                        alt={selectedModel.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-contain bg-transparent mix-blend-multiply"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center text-3xl">
                        📱
                      </div>
                    )}
                    <div>
                      <span className="block text-xs text-foreground/50">
                        {selectedBrand.name}
                      </span>
                      <span className="block text-lg font-medium text-foreground">
                        {selectedModel.name}
                      </span>
                      {selectedMemory && (
                        <span className="block text-sm text-foreground/60">
                          {selectedMemory}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 border-t border-foreground/10 pt-6">
                    <span className="block text-sm text-foreground/60">
                      État :{" "}
                      {
                        conditions.find((c) => c.value === selectedCondition)
                          ?.label
                      }
                    </span>
                  </div>

                  <div className="border-t border-foreground/10 pt-6">
                    <span className="block text-xs uppercase tracking-widest text-foreground/50">
                      Prix final
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-(family-name:--font-playfair) text-5xl font-light text-foreground">
                        {price}$
                      </span>
                      <span className="text-sm text-foreground/50">CAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
