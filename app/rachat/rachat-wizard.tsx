"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { sortModelsByRecent } from "@/lib/model-sort";
import { createClient } from "@/lib/supabase-client";
import { submitRachat } from "../actions/submit-rachat";
import { submissionLineTotal } from "@/lib/submissions";
import { Check, Sparkles, ThumbsUp, AlertTriangle, Trash2 } from "lucide-react";
import { PriceHero } from "@/components/rachat/PriceHero";
import { useI18n } from "@/contexts/I18nContext";
import { ModelSearchBar } from "./components/ModelSearchBar";

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

type ConditionKey = "perfect" | "good" | "acceptable" | "scratched";

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

type RachatWizardProps = {
  brands: Brand[];
  models: Model[];
};

type SelectedDevice = {
  modelId: string;
  brandId: string;
  modelName: string;
  brandName: string;
  condition: string;
  memory: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

const CONDITION_DB_VALUE: Record<ConditionKey, string> = {
  perfect: "Comme neuf",
  good: "Bon",
  acceptable: "Acceptable",
  scratched: "Rayé",
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

export function RachatWizard({ brands, models }: RachatWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedCondition, setSelectedCondition] =
    useState<ConditionKey | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [savedDevices, setSavedDevices] = useState<SelectedDevice[]>([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeFullName: "",
    clientFullName: "",
    clientPhone: "",
    clientCity: "",
    deviceImei: "",
  });
  const { t, locale } = useI18n();
  const router = useRouter();
  const hasStepMounted = useRef(false);
  const memoriesRequestRef = useRef(0);
  const priceRequestRef = useRef(0);
  const conditionSectionRef = useRef<HTMLDivElement | null>(null);

  const filteredModels = useMemo(() => {
    if (!selectedBrand) return [];
    const filtered = models.filter((m) => m.brand_id === selectedBrand.id);
    return sortModelsByRecent(filtered, selectedBrand.name);
  }, [selectedBrand, models]);

  const totalSavedPrice = useMemo(
    () =>
      savedDevices.reduce(
        (total, device) =>
          total + submissionLineTotal(device.price, device.quantity),
        0,
      ),
    [savedDevices],
  );
  const totalSavedUnits = useMemo(
    () =>
      savedDevices.reduce((sum, device) => {
        const q =
          typeof device.quantity === "number" &&
          Number.isFinite(device.quantity)
            ? Math.floor(device.quantity)
            : 1;
        return sum + (q >= 1 ? Math.min(999, q) : 1);
      }, 0),
    [savedDevices],
  );
  useEffect(() => {
    if (!selectedModel) {
      return;
    }

    const controller = new AbortController();
    const requestId = ++memoriesRequestRef.current;

    const fetchMemories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("prices")
        .select("memory")
        .eq("model_id", selectedModel.id);

      if (
        controller.signal.aborted ||
        requestId !== memoriesRequestRef.current
      ) {
        return;
      }

      if (error || !data) {
        setMemories([]);
        setSelectedMemory(null);
        return;
      }

      const uniqueMemories = [...new Set(data.map((d) => d.memory))];
      const sortedMemories = sortMemoryCapacities(uniqueMemories);
      setMemories(sortedMemories);
      setSelectedMemory((previous) => {
        if (previous && sortedMemories.includes(previous)) {
          return previous;
        }
        return sortedMemories.length === 1 ? sortedMemories[0] : null;
      });
    };

    void fetchMemories();

    return () => {
      controller.abort();
    };
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedModel || !selectedCondition || !selectedMemory) {
      return;
    }

    const controller = new AbortController();
    const requestId = ++priceRequestRef.current;

    const fetchPrice = async () => {
      setIsLoadingPrice(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("prices")
        .select("price")
        .eq("model_id", selectedModel.id)
        .eq("condition", CONDITION_DB_VALUE[selectedCondition])
        .eq("memory", selectedMemory)
        .single();

      if (controller.signal.aborted || requestId !== priceRequestRef.current) {
        return;
      }

      if (error || !data) {
        setPrice(null);
      } else {
        setPrice(data.price);
      }
      setIsLoadingPrice(false);
    };

    void fetchPrice();

    return () => {
      controller.abort();
    };
  }, [selectedModel, selectedCondition, selectedMemory]);

  useEffect(() => {
    if (!hasStepMounted.current) {
      hasStepMounted.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setDirection(1);
    setStep(2);
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setSelectedCondition(null);
    setSelectedMemory(null);
    setMemories([]);
    setPrice(null);
    setIsLoadingPrice(false);
    setDirection(1);
    setStep(3);
  };

  const handleModelSearchSelect = (selection: {
    brand: Brand;
    model: Model;
  }) => {
    setSelectedBrand(selection.brand);
    setSelectedModel(selection.model);
    setSelectedCondition(null);
    setSelectedMemory(null);
    setMemories([]);
    setPrice(null);
    setCurrentQuantity(1);
    setIsLoadingPrice(false);
    setDirection(1);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetCurrentSelection = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedCondition(null);
    setSelectedMemory(null);
    setMemories([]);
    setPrice(null);
    setCurrentQuantity(1);
    setIsLoadingPrice(false);
  };

  const buildCurrentDevice = (): SelectedDevice | null => {
    if (
      !selectedModel ||
      !selectedBrand ||
      !selectedCondition ||
      !selectedMemory ||
      !price
    ) {
      return null;
    }

    const q =
      typeof currentQuantity === "number" && Number.isFinite(currentQuantity)
        ? Math.floor(currentQuantity)
        : 1;
    const quantity = q >= 1 ? Math.min(999, q) : 1;

    return {
      modelId: selectedModel.id,
      brandId: selectedBrand.id,
      modelName: selectedModel.name,
      brandName: selectedBrand.name,
      condition: CONDITION_DB_VALUE[selectedCondition],
      memory: selectedMemory,
      price,
      quantity,
      imageUrl: selectedModel.image_url,
    };
  };

  const addCurrentDeviceToSaved = (): boolean => {
    const device = buildCurrentDevice();
    if (!device) {
      return false;
    }

    setSavedDevices((previous) => [...previous, device]);
    return true;
  };

  const handleAcceptAndAddAnotherDevice = () => {
    const wasAdded = addCurrentDeviceToSaved();
    if (!wasAdded) {
      return;
    }
    resetCurrentSelection();
    setDirection(-1);
    setStep(1);
  };

  const handleProceedToContact = () => {
    const wasAdded = addCurrentDeviceToSaved();
    if (!wasAdded) {
      return;
    }
    resetCurrentSelection();
    setDirection(1);
    setStep(4);
  };

  const handleRemoveSavedDevice = (indexToRemove: number) => {
    const willBeEmpty = savedDevices.length === 1;
    setSavedDevices((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
    if (willBeEmpty) {
      resetCurrentSelection();
      setDirection(-1);
      setStep(1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (step === 4) {
      setStep(1);
    } else if (step === 3) {
      setSelectedModel(null);
      setSelectedCondition(null);
      setSelectedMemory(null);
      setPrice(null);
      setCurrentQuantity(1);
      setStep(2);
    } else if (step === 2) {
      setSelectedBrand(null);
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (savedDevices.length === 0) {
      alert(t.wizard.addOneDevice);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentPath = window.location.pathname;
      const submitLocale = currentPath.startsWith("/en") ? "en" : "fr";
      const result = await submitRachat({
        contactMode: "store",
        totalPayout: totalSavedPrice,
        devices: savedDevices.map((device) => ({
          modelId: device.modelId,
          brandId: device.brandId,
          modelName: device.modelName,
          brandName: device.brandName,
          condition: device.condition,
          memory: device.memory,
          price: device.price,
          quantity: device.quantity,
          devicePhotos: [],
        })),
        employeeFullName: formData.employeeFullName,
        clientFullName: formData.clientFullName,
        clientPhone: formData.clientPhone,
        clientCity: formData.clientCity,
        deviceImei: formData.deviceImei,
        locale: submitLocale,
      });

      if (!result.success || !result.id) {
        setSubmitError(result.error || t.wizard.form.submitError);
        return;
      }

      const locale = submitLocale;
      const params = new URLSearchParams({
        id: result.id,
        total: totalSavedPrice.toFixed(2),
      });
      const viewToken = (result as { viewToken?: string }).viewToken;
      if (viewToken) {
        params.set("token", viewToken);
      }
      if (
        Array.isArray((result as { ids?: string[] }).ids) &&
        (result as { ids?: string[] }).ids?.length
      ) {
        params.set("ids", (result as { ids: string[] }).ids.join(","));
      }
      if (result.requestGroupId) {
        params.set("order", result.requestGroupId);
      }
      const successPath =
        locale === "fr"
          ? `/rachat/succes?${params.toString()}`
          : `/en/rachat/succes?${params.toString()}`;
      router.push(successPath, { scroll: true });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t.wizard.form.submitError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditions: {
    value: ConditionKey;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "perfect",
      label: t.wizard.conditions.perfect.label,
      description: t.wizard.conditions.perfect.description,
      icon: <Sparkles className="h-6 w-6" strokeWidth={1.5} />,
    },
    {
      value: "good",
      label: t.wizard.conditions.good.label,
      description: t.wizard.conditions.good.description,
      icon: <ThumbsUp className="h-6 w-6" strokeWidth={1.5} />,
    },
    {
      value: "acceptable",
      label: t.wizard.conditions.acceptable.label,
      description: t.wizard.conditions.acceptable.description,
      icon: <ThumbsUp className="h-6 w-6" strokeWidth={1.5} />,
    },
    {
      value: "scratched",
      label: t.wizard.conditions.scratched.label,
      description: t.wizard.conditions.scratched.description,
      icon: <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />,
    },
  ];

  const conditionLabelByDbValue = useMemo(
    () => ({
      [CONDITION_DB_VALUE.perfect]: t.wizard.conditions.perfect.label,
      [CONDITION_DB_VALUE.good]: t.wizard.conditions.good.label,
      [CONDITION_DB_VALUE.acceptable]: t.wizard.conditions.acceptable.label,
      [CONDITION_DB_VALUE.scratched]: t.wizard.conditions.scratched.label,
    }),
    [t],
  );

  return (
    <div className="relative min-h-[60vh] bg-secondary p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:mb-12 sm:gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all sm:h-8 sm:w-8 sm:text-sm ${
                  step >= s
                    ? "border-brand-primary bg-brand-primary text-background shadow-glow"
                    : "border-foreground/20 text-foreground/40"
                }`}
              >
                {step > s ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-px w-6 transition-colors sm:w-12 ${
                    step > s ? "bg-brand-primary" : "bg-foreground/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="mb-10 sm:mb-14">
            <ModelSearchBar
              brands={brands}
              models={models}
              placeholder={t.wizard.searchModelPlaceholder}
              ariaLabel={t.wizard.searchModelAriaLabel}
              clearLabel={t.wizard.searchModelClear}
              noResultsLabel={t.wizard.searchModelNoResults}
              onSelect={handleModelSearchSelect}
            />
          </div>
        )}

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
              <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-foreground/50 sm:mb-4">
                {t.wizard.step1}
              </span>
              <h1 className="mb-8 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark sm:mb-12 sm:text-4xl md:text-5xl">
                {t.wizard.chooseBrand}
              </h1>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-background p-4 shadow-soft transition-all hover:-translate-y-1 sm:gap-4 sm:rounded-[24px] sm:p-6 md:p-8 ${
                      selectedBrand?.id === brand.id
                        ? "border-brand-primary shadow-glow"
                        : "border-black/5 hover:border-black/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="brand"
                      value={brand.id}
                      checked={selectedBrand?.id === brand.id}
                      onChange={() => handleBrandSelect(brand)}
                      className="sr-only"
                    />
                    <Image
                      src={
                        brand.logo_url ||
                        `https://cdn.simpleicons.org/${brand.slug}/000000`
                      }
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="h-16 w-16 object-contain bg-transparent mix-blend-multiply grayscale transition-all group-hover:grayscale-0"
                      unoptimized
                    />
                    <span className="text-sm font-medium uppercase tracking-[0.1em] text-foreground/70 transition-colors group-hover:text-foreground">
                      {brand.name}
                    </span>
                    {selectedBrand?.id === brand.id && (
                      <div className="absolute right-4 top-4">
                        <Check className="h-5 w-5 text-brand-primary" />
                      </div>
                    )}
                  </label>
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
                className="mb-4 flex min-h-[44px] items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground sm:mb-6"
              >
                <span>←</span>
                <span>{t.wizard.back}</span>
              </button>
              <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-foreground/50 sm:mb-4">
                {t.wizard.step2}
              </span>
              <h1 className="mb-8 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark sm:mb-12 sm:text-4xl md:text-5xl">
                {t.wizard.selectModel} {selectedBrand?.name}
              </h1>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {filteredModels.map((model) => (
                  <label
                    key={model.id}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-background shadow-soft transition-all hover:-translate-y-1 sm:rounded-[24px] ${
                      selectedModel?.id === model.id
                        ? "border-brand-primary shadow-glow"
                        : "border-black/5 hover:border-black/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel?.id === model.id}
                      onChange={() => handleModelSelect(model)}
                      className="sr-only"
                    />
                    <div className="flex aspect-square items-center justify-center bg-secondary/50 p-4 sm:p-6">
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
                    <div className="p-3 text-left sm:p-4">
                      <span className="block text-sm font-medium text-foreground">
                        {model.name}
                      </span>
                      <span className="mt-1 block text-xs text-foreground/50">
                        {t.wizard.estimatedValueLabel}{" "}
                        {model.min_price === model.max_price
                          ? `${model.min_price}$`
                          : `${model.min_price}$-${model.max_price}$`}
                      </span>
                    </div>
                    {selectedModel?.id === model.id && (
                      <div className="absolute right-4 top-4">
                        <Check className="h-5 w-5 text-brand-primary" />
                      </div>
                    )}
                  </label>
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
                className="mb-4 flex min-h-[44px] items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground sm:mb-6"
              >
                <span>←</span>
                <span>{t.wizard.back}</span>
              </button>
              <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-foreground/50 sm:mb-4">
                {t.wizard.step3}
              </span>
              <h1 className="mb-8 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark sm:mb-12 sm:text-4xl md:text-5xl">
                {t.wizard.deviceCondition} {selectedModel.name}
              </h1>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                  {memories.length > 1 && (
                    <div>
                      <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-foreground/70">
                        {t.wizard.capacity}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {memories.map((memory) => (
                          <label
                            key={memory}
                            className="group relative cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="memory"
                              value={memory}
                              checked={selectedMemory === memory}
                              onChange={() => {
                                setSelectedMemory(memory);
                                setPrice(null);
                                setIsLoadingPrice(false);
                                if (
                                  typeof window !== "undefined" &&
                                  window.matchMedia("(max-width: 767px)")
                                    .matches
                                ) {
                                  window.setTimeout(() => {
                                    conditionSectionRef.current?.scrollIntoView(
                                      {
                                        behavior: "smooth",
                                        block: "start",
                                      },
                                    );
                                  }, 50);
                                }
                              }}
                              className="sr-only"
                            />
                            <span
                              className={`relative inline-flex items-center justify-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-medium transition-all ${
                                selectedMemory === memory
                                  ? "border-brand-primary bg-brand-primary/5 text-brand-dark shadow-glow scale-[1.02]"
                                  : "border-black/5 bg-background text-foreground hover:border-black/15"
                              }`}
                            >
                              {memory}
                              {selectedMemory === memory && (
                                <Check className="h-4 w-4 text-brand-primary" />
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={conditionSectionRef}>
                    <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-foreground/70">
                      {t.wizard.deviceConditionLabel}
                    </h3>
                    <div className="space-y-4">
                      {conditions.map((condition) => (
                        <label
                          key={condition.value}
                          className={`group relative flex cursor-pointer items-center gap-4 rounded-[24px] border-2 p-6 shadow-soft transition-all ${
                            selectedCondition === condition.value
                              ? "border-brand-primary bg-brand-primary/5 shadow-glow scale-[1.02]"
                              : "border-black/5 bg-background hover:border-black/15 hover:-translate-y-1"
                          }`}
                        >
                          <input
                            type="radio"
                            name="condition"
                            value={condition.value}
                            checked={selectedCondition === condition.value}
                            onChange={() => {
                              setSelectedCondition(condition.value);
                              setPrice(null);
                              setIsLoadingPrice(false);
                            }}
                            className="sr-only"
                          />
                          <div
                            className={`transition-colors ${
                              selectedCondition === condition.value
                                ? "text-brand-primary"
                                : "text-foreground/50"
                            }`}
                          >
                            {condition.icon}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`block font-medium transition-colors ${
                                selectedCondition === condition.value
                                  ? "text-brand-dark"
                                  : "text-foreground"
                              }`}
                            >
                              {condition.label}
                            </span>
                            <span
                              className={`block text-sm transition-colors ${
                                selectedCondition === condition.value
                                  ? "text-foreground/70"
                                  : "text-foreground/60"
                              }`}
                            >
                              {condition.description}
                            </span>
                          </div>
                          {selectedCondition === condition.value && (
                            <Check className="h-5 w-5 text-brand-primary" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:pl-8">
                  <div className="sticky top-24 rounded-2xl border border-black/5 bg-background p-5 pb-8 shadow-soft sm:top-32 sm:rounded-[24px] sm:p-8 sm:pb-10">
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
                          {t.wizard.conditionLabel} :{" "}
                          {
                            conditions.find(
                              (c) => c.value === selectedCondition,
                            )?.label
                          }
                        </span>
                      </div>
                    )}

                    {selectedCondition && selectedMemory && (
                      <div className="mb-6 border-t border-foreground/10 pt-6">
                        <label
                          htmlFor="rachat-quantity"
                          className="mb-2 block text-sm font-medium text-foreground/80"
                        >
                          {t.wizard.quantityLabel}
                        </label>
                        <input
                          id="rachat-quantity"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={999}
                          value={currentQuantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isFinite(v)) {
                              setCurrentQuantity(1);
                              return;
                            }
                            setCurrentQuantity(Math.min(999, Math.max(1, v)));
                          }}
                          className="w-full max-w-[120px] rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-base text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="border-t border-foreground/10 pt-6">
                      <PriceHero
                        price={
                          price != null
                            ? submissionLineTotal(price, currentQuantity)
                            : null
                        }
                        isLoading={isLoadingPrice}
                        currency="CAD"
                      />
                    </div>

                    {price && selectedCondition && selectedMemory && (
                      <div className="mt-8 space-y-3">
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={handleAcceptAndAddAnotherDevice}
                          className="w-full rounded-full border border-foreground/20 bg-background px-8 py-4 text-center text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:border-brand-primary hover:text-brand-primary"
                        >
                          {t.wizard.cta.acceptAndAddAnotherDevice}
                        </motion.button>

                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => {
                            handleProceedToContact();
                          }}
                          className="w-full rounded-full bg-brand-dark px-12 py-5 text-center text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105"
                        >
                          {t.wizard.cta.getPaid}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && savedDevices.length > 0 && (
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
                className="mb-4 flex min-h-[44px] items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground sm:mb-6"
              >
                <span>←</span>
                <span>{t.wizard.back}</span>
              </button>
              <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-foreground/50 sm:mb-4">
                {t.wizard.step4}
              </span>
              <h1 className="mb-8 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark sm:mb-12 sm:text-4xl md:text-5xl">
                {t.wizard.step4TradeInTitle}
              </h1>

              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 sm:space-y-6"
                >
                  <div>
                    <label
                      htmlFor="employee-full-name"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.wizard.form.employeeFullName} *
                    </label>
                    <input
                      type="text"
                      id="employee-full-name"
                      required
                      autoComplete="name"
                      value={formData.employeeFullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employeeFullName: e.target.value,
                        })
                      }
                      className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3.5 text-base text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none sm:px-6 sm:py-4"
                      placeholder={t.wizard.form.employeeFullNamePlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-full-name"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.wizard.form.clientFullName} *
                    </label>
                    <input
                      type="text"
                      id="client-full-name"
                      required
                      value={formData.clientFullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clientFullName: e.target.value,
                        })
                      }
                      className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3.5 text-base text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none sm:px-6 sm:py-4"
                      placeholder={t.wizard.form.clientFullNamePlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-phone"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.wizard.form.clientPhone} *
                    </label>
                    <input
                      type="tel"
                      id="client-phone"
                      required
                      autoComplete="tel"
                      value={formData.clientPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clientPhone: e.target.value,
                        })
                      }
                      className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3.5 text-base text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none sm:px-6 sm:py-4"
                      placeholder={t.wizard.form.clientPhonePlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-city"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.wizard.form.clientCity} *
                    </label>
                    <input
                      type="text"
                      id="client-city"
                      required
                      value={formData.clientCity}
                      onChange={(e) =>
                        setFormData({ ...formData, clientCity: e.target.value })
                      }
                      className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3.5 text-base text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none sm:px-6 sm:py-4"
                      placeholder={t.wizard.form.clientCityPlaceholder}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="device-imei"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.wizard.form.deviceImei} *
                    </label>
                    <input
                      type="text"
                      id="device-imei"
                      required
                      inputMode="numeric"
                      pattern="[0-9A-Za-z\-]{8,20}"
                      title={t.wizard.form.deviceImeiHint}
                      value={formData.deviceImei}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deviceImei: e.target.value.trim(),
                        })
                      }
                      className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3.5 text-base text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none sm:px-6 sm:py-4"
                      placeholder={t.wizard.form.deviceImeiPlaceholder}
                    />
                    <p className="mt-1.5 text-xs text-foreground/55">
                      {t.wizard.form.deviceImeiHint}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] rounded-full bg-brand-dark px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 sm:px-12 sm:py-5"
                  >
                    {isSubmitting
                      ? t.wizard.form.submitting
                      : t.wizard.form.submit}
                  </button>
                  {submitError ? (
                    <p className="mt-3 text-sm text-red-600">{submitError}</p>
                  ) : null}
                </form>

                <div className="lg:pl-8">
                  <div className="sticky top-24 rounded-2xl border border-black/5 bg-background p-5 pb-8 shadow-soft sm:top-32 sm:rounded-[24px] sm:p-8 sm:pb-10">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/70">
                        {t.wizard.yourRequest}
                      </h2>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/70">
                        {totalSavedUnits} {t.wizard.devicesCount}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {savedDevices.map((device, index) => (
                        <div
                          key={`${device.modelId}-${device.memory}-${device.condition}-${device.quantity}-${index}`}
                          className="rounded-2xl border border-foreground/10 bg-secondary/40 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {device.imageUrl ? (
                                <Image
                                  src={device.imageUrl}
                                  alt={device.modelName}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 shrink-0 object-contain bg-transparent mix-blend-multiply"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center text-xl">
                                  📱
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {device.brandName} {device.modelName}
                                </p>
                                <p className="text-xs text-foreground/60">
                                  {device.memory} • {t.wizard.conditionLabel}:{" "}
                                  {conditionLabelByDbValue[device.condition] ||
                                    device.condition}{" "}
                                  • {t.wizard.quantityLabel}: {device.quantity}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSavedDevice(index)}
                              className="rounded-full p-2 text-foreground/55 hover:bg-background hover:text-red-600"
                              aria-label={t.wizard.removeDevice}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-2 text-right text-sm text-foreground/60">
                            {device.quantity > 1 ? (
                              <>
                                {device.quantity} × {device.price.toFixed(2)}$
                              </>
                            ) : null}
                          </p>
                          <p className="text-right text-sm font-semibold text-brand-primary">
                            {submissionLineTotal(
                              device.price,
                              device.quantity,
                            ).toFixed(2)}
                            $
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-foreground/10 pt-6">
                      <PriceHero
                        price={totalSavedPrice}
                        isLoading={false}
                        currency="CAD"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
