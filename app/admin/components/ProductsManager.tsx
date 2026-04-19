"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sortMemoryCapacities } from "@/lib/memory-sort";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createBrand,
  updateBrand,
  deleteBrand,
  createModel,
  updateModel,
  deleteModel,
  createPrice,
  updatePrice,
  updatePricesBulk,
  deletePrice,
} from "../../actions/products";
import { Plus, Edit2, Trash2, X, Save, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ImageUploader } from "./ImageUploader";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

type Model = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
  brands: { name: string } | { name: string }[];
};

type Price = {
  id: string;
  model_id: string;
  condition: string;
  memory: string;
  price: number;
  created_at: string;
  models: {
    name: string;
    brands: { name: string } | { name: string }[];
  };
};

type ProductsManagerProps = {
  initialBrands: Brand[];
  initialModels: Model[];
  initialPrices: Price[];
  initialTab?: "brands" | "models" | "prices";
  initialPricesFilters?: Partial<ProductsPricesFiltersInit>;
};

const CONDITIONS = ["Comme neuf", "Bon", "Acceptable", "Rayé"];
const MEMORIES = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];

export type ProductsPricesFiltersInit = {
  brand: string;
  model: string;
  condition: string;
  memory: string;
  min: string;
  max: string;
  pageIndex: number;
  pageSize: number;
};

const DEFAULT_PRICES_FILTERS: ProductsPricesFiltersInit = {
  brand: "all",
  model: "all",
  condition: "all",
  memory: "all",
  min: "",
  max: "",
  pageIndex: 0,
  pageSize: 50,
};

function mergePricesFilters(
  initial?: Partial<ProductsPricesFiltersInit>,
): ProductsPricesFiltersInit {
  return { ...DEFAULT_PRICES_FILTERS, ...initial };
}

type BulkPriceAdjustmentKind = "percent" | "amount";
type BulkPriceAdjustmentDirection = "increase" | "decrease";

type BulkPricePreview = {
  total: number;
  affected: number;
  unchanged: number;
  updates: Array<{ id: string; model_id: string; condition: string; memory: string; price: number }>;
  sample: Array<{ id: string; label: string; from: number; to: number }>;
};

export function ProductsManager({
  initialBrands,
  initialModels,
  initialPrices,
  initialTab = "brands",
  initialPricesFilters,
}: ProductsManagerProps) {
  const router = useRouter();
  const initialPf = mergePricesFilters(initialPricesFilters);
  const [brands] = useState(initialBrands);
  const [models] = useState(initialModels);
  const [prices, setPrices] = useState(initialPrices);
  const [activeTab, setActiveTab] = useState<"brands" | "models" | "prices">(initialTab);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingPriceInline, setEditingPriceInline] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showModelForm, setShowModelForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  // Keep image URLs in React state so preview doesn't disappear
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState<string | null>(null);
  const [brandLogoDrafts, setBrandLogoDrafts] = useState<Record<string, string | null>>({});
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(initialPf.brand);
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>(initialPf.model);
  const [selectedConditionFilter, setSelectedConditionFilter] =
    useState<string>(initialPf.condition);
  const [selectedMemoryFilter, setSelectedMemoryFilter] = useState<string>(initialPf.memory);
  const [minPrice, setMinPrice] = useState<string>(initialPf.min);
  const [maxPrice, setMaxPrice] = useState<string>(initialPf.max);
  const [pricesPageSize, setPricesPageSize] = useState<number>(initialPf.pageSize);
  const [pricesPageIndex, setPricesPageIndex] = useState<number>(initialPf.pageIndex);
  const [bulkAdjustKind, setBulkAdjustKind] = useState<BulkPriceAdjustmentKind>("percent");
  const [bulkAdjustDirection, setBulkAdjustDirection] =
    useState<BulkPriceAdjustmentDirection>("increase");
  const [bulkAdjustValue, setBulkAdjustValue] = useState<string>("");
  const [isApplyingBulkPrices, setIsApplyingBulkPrices] = useState(false);
  const [bulkPreviewSnapshot, setBulkPreviewSnapshot] = useState<BulkPricePreview | null>(null);
  const [bulkPreviewKey, setBulkPreviewKey] = useState<string | null>(null);
  const [bulkConfirmChecked, setBulkConfirmChecked] = useState(false);
  const [selectedPriceIds, setSelectedPriceIds] = useState<Set<string>>(() => new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const pageSelectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrices(initialPrices);
  }, [initialPrices]);

  useEffect(() => {
    if (typeof window === "undefined" || activeTab !== "prices") return;

    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string, omitWhen: string) => {
      if (!value || value === omitWhen) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    setOrDelete("priceBrand", selectedBrandFilter, "all");
    setOrDelete("priceModel", selectedModelFilter, "all");
    setOrDelete("priceCondition", selectedConditionFilter, "all");
    setOrDelete("priceMemory", selectedMemoryFilter, "all");
    setOrDelete("priceMin", minPrice.trim(), "");
    setOrDelete("priceMax", maxPrice.trim(), "");

    const page = pricesPageIndex + 1;
    if (page <= 1) url.searchParams.delete("pricePage");
    else url.searchParams.set("pricePage", String(page));

    if (pricesPageSize === DEFAULT_PRICES_FILTERS.pageSize) {
      url.searchParams.delete("pricePageSize");
    } else {
      url.searchParams.set("pricePageSize", String(pricesPageSize));
    }

    const nextSearch = url.searchParams.toString();
    const next = url.pathname + (nextSearch ? `?${nextSearch}` : "");
    const current = window.location.pathname + window.location.search;
    if (next !== current) {
      router.replace(next, { scroll: false });
    }
  }, [
    activeTab,
    selectedBrandFilter,
    selectedModelFilter,
    selectedConditionFilter,
    selectedMemoryFilter,
    minPrice,
    maxPrice,
    pricesPageIndex,
    pricesPageSize,
    router,
  ]);

  const handleCreateBrand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const logoUrl = (newBrandLogoUrl || "").trim();

    const result = await createBrand(name, logoUrl || undefined);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleUpdateBrand = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const baseLogoUrl = brands.find((b) => b.id === id)?.logo_url || "";
    const draftLogoUrl = brandLogoDrafts[id];
    // null => explicit remove, string => explicit set
    const finalLogoUrl =
      draftLogoUrl === null ? "" : (((draftLogoUrl ?? baseLogoUrl) || "") as string).trim();

    const result = await updateBrand(id, name, finalLogoUrl || undefined);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette marque ?")) return;
    const result = await deleteBrand(id);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleCreateModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const brandId = formData.get("brandId") as string;
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;

    const result = await createModel(brandId, name, imageUrl || undefined);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleUpdateModel = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const imageUrlInput = formData.get(`imageUrl-${id}`) as string;
    const finalImageUrl = imageUrlInput || imageUrl || "";

    const result = await updateModel(id, name, finalImageUrl || undefined);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;
    const result = await deleteModel(id);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleCreatePrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const modelId = formData.get("modelId") as string;
    const condition = formData.get("condition") as string;
    const memory = formData.get("memory") as string;
    const price = parseFloat(formData.get("price") as string);

    const result = await createPrice(modelId, condition, memory, price);
    if (result.success) {
      setShowPriceForm(false);
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleUpdatePrice = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const condition = formData.get("condition") as string;
    const memory = formData.get("memory") as string;
    const price = parseFloat(formData.get("price") as string);

    const result = await updatePrice(id, condition, memory, price);
    if (result.success) {
      setEditingPrice(null);
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce prix ?")) return;
    const result = await deletePrice(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handlePriceClick = (priceId: string, currentPrice: number) => {
    setEditingPriceInline(priceId);
    setEditingPriceValue(currentPrice.toString());
  };

  const handlePriceBlur = async (priceId: string) => {
    if (!editingPriceInline || editingPriceInline !== priceId) return;

    const price = prices.find((p) => p.id === priceId);
    if (!price) return;

    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setEditingPriceInline(null);
      return;
    }

    if (newPrice === price.price) {
      setEditingPriceInline(null);
      return;
    }

    const result = await updatePrice(priceId, price.condition, price.memory, newPrice);
    if (result.success) {
      setEditingPriceInline(null);
      router.refresh();
    } else {
      alert(result.error);
      setEditingPriceInline(null);
    }
  };

  const handlePriceKeyDown = async (e: React.KeyboardEvent, priceId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handlePriceBlur(priceId);
    } else if (e.key === "Escape") {
      setEditingPriceInline(null);
      setEditingPriceValue("");
    }
  };

  const getBrandName = (brand: { name: string } | { name: string }[]) => {
    return Array.isArray(brand) ? brand[0]?.name || "" : brand.name;
  };

  const uniqueBrandsForPrices = useMemo(() => {
    const brandSet = new Set<string>();
    prices.forEach((price) => {
      const brandName = getBrandName(price.models.brands);
      if (brandName) brandSet.add(brandName);
    });
    return Array.from(brandSet).sort();
  }, [prices]);

  const uniqueModelsForPrices = useMemo(() => {
    const modelSet = new Set<string>();
    prices.forEach((price) => {
      const brandName = getBrandName(price.models.brands);
      if (selectedBrandFilter !== "all" && brandName !== selectedBrandFilter) {
        return;
      }
      const modelName = price.models.name;
      modelSet.add(`${brandName} ${modelName}`);
    });
    return Array.from(modelSet).sort();
  }, [prices, selectedBrandFilter]);

  useEffect(() => {
    // If the selected brand changes, ensure the selected model still belongs to that brand.
    if (selectedBrandFilter === "all") {
      return;
    }
    if (selectedModelFilter === "all") {
      return;
    }
    if (!uniqueModelsForPrices.includes(selectedModelFilter)) {
      setSelectedModelFilter("all");
    }
  }, [selectedBrandFilter, selectedModelFilter, uniqueModelsForPrices]);

  const uniqueConditionsForPrices = useMemo(() => {
    const conditionSet = new Set(prices.map((p) => p.condition));
    const ordered = CONDITIONS.filter((c) => conditionSet.has(c));
    const extras = Array.from(conditionSet)
      .filter((c) => !CONDITIONS.includes(c))
      .sort();
    return [...ordered, ...extras];
  }, [prices]);

  const uniqueMemoriesForPrices = useMemo(() => {
    const memorySet = new Set(prices.map((p) => p.memory));
    return sortMemoryCapacities(Array.from(memorySet));
  }, [prices]);

  const filteredPrices = useMemo(() => {
    return prices.filter((price) => {
      const brandName = getBrandName(price.models.brands);
      const modelName = `${brandName} ${price.models.name}`;

      const brandMatch =
        selectedBrandFilter === "all" || brandName === selectedBrandFilter;
      const modelMatch =
        selectedModelFilter === "all" || modelName === selectedModelFilter;
      const conditionMatch =
        selectedConditionFilter === "all" || price.condition === selectedConditionFilter;
      const memoryMatch =
        selectedMemoryFilter === "all" || price.memory === selectedMemoryFilter;
      const minPriceMatch = !minPrice || price.price >= parseFloat(minPrice);
      const maxPriceMatch = !maxPrice || price.price <= parseFloat(maxPrice);

      return (
        brandMatch &&
        modelMatch &&
        conditionMatch &&
        memoryMatch &&
        minPriceMatch &&
        maxPriceMatch
      );
    });
  }, [
    prices,
    selectedBrandFilter,
    selectedModelFilter,
    selectedConditionFilter,
    selectedMemoryFilter,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    const allowed = new Set(filteredPrices.map((p) => p.id));
    setSelectedPriceIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      if (next.size === prev.size) {
        for (const id of prev) {
          if (!next.has(id)) return next;
        }
        return prev;
      }
      return next;
    });
  }, [filteredPrices]);

  const bulkScopePrices = useMemo(() => {
    return filteredPrices.filter((p) => selectedPriceIds.has(p.id));
  }, [filteredPrices, selectedPriceIds]);

  const selectedPriceIdsKey = useMemo(() => {
    return [...selectedPriceIds].sort().join(",");
  }, [selectedPriceIds]);

  useEffect(() => {
    // Reset to first page whenever filters change.
    setPricesPageIndex(0);
  }, [
    selectedBrandFilter,
    selectedModelFilter,
    selectedConditionFilter,
    selectedMemoryFilter,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    setPricesPageIndex(0);
  }, [pricesPageSize]);

  const pricesTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPrices.length / pricesPageSize));
  }, [filteredPrices.length, pricesPageSize]);

  useEffect(() => {
    // Clamp page index when filtered list shrinks.
    setPricesPageIndex((prev) => Math.min(prev, pricesTotalPages - 1));
  }, [pricesTotalPages]);

  const pagedPrices = useMemo(() => {
    const start = pricesPageIndex * pricesPageSize;
    const end = start + pricesPageSize;
    return filteredPrices.slice(start, end);
  }, [filteredPrices, pricesPageIndex, pricesPageSize]);

  const pricesPageRangeLabel = useMemo(() => {
    if (filteredPrices.length === 0) return "0–0";
    const start = pricesPageIndex * pricesPageSize + 1;
    const end = Math.min(filteredPrices.length, (pricesPageIndex + 1) * pricesPageSize);
    return `${start}–${end}`;
  }, [filteredPrices.length, pricesPageIndex, pricesPageSize]);

  const selectedOnPageCount = useMemo(() => {
    return pagedPrices.filter((p) => selectedPriceIds.has(p.id)).length;
  }, [pagedPrices, selectedPriceIds]);

  const allPageSelected =
    pagedPrices.length > 0 && selectedOnPageCount === pagedPrices.length;

  useEffect(() => {
    const el = pageSelectAllRef.current;
    if (!el) return;
    el.indeterminate =
      selectedOnPageCount > 0 && selectedOnPageCount < pagedPrices.length;
  }, [selectedOnPageCount, pagedPrices.length]);

  const bulkPricePreview = useMemo(() => {
    const value = parseFloat(bulkAdjustValue);
    const hasValidValue = Number.isFinite(value) && value > 0;

    const roundToCents = (n: number) => Math.round(n * 100) / 100;

    if (!hasValidValue) {
      return {
        total: bulkScopePrices.length,
        affected: 0,
        unchanged: bulkScopePrices.length,
        updates: [] as Array<{ id: string; model_id: string; condition: string; memory: string; price: number }>,
        sample: [] as Array<{ id: string; label: string; from: number; to: number }>,
      };
    }

    const updates: Array<{ id: string; model_id: string; condition: string; memory: string; price: number }> = [];
    const sample: Array<{ id: string; label: string; from: number; to: number }> = [];

    for (const p of bulkScopePrices) {
      const base = Number(p.price);
      if (!Number.isFinite(base)) continue;

      const delta =
        bulkAdjustKind === "percent" ? (base * value) / 100 : value;
      const nextRaw =
        bulkAdjustDirection === "increase" ? base + delta : base - delta;
      const next = Math.max(0, roundToCents(nextRaw));
      const from = roundToCents(base);

      if (next !== from) {
        updates.push({
          id: p.id,
          model_id: p.model_id,
          condition: p.condition,
          memory: p.memory,
          price: next,
        });
        if (sample.length < 10) {
          const label = `${getBrandName(p.models.brands)} ${p.models.name} • ${p.memory} • ${p.condition}`;
          sample.push({ id: p.id, label, from, to: next });
        }
      }
    }

    return {
      total: bulkScopePrices.length,
      affected: updates.length,
      unchanged: bulkScopePrices.length - updates.length,
      updates,
      sample,
    };
  }, [bulkScopePrices, bulkAdjustKind, bulkAdjustDirection, bulkAdjustValue]);

  const bulkDraftKey = useMemo(() => {
    return [
      bulkAdjustKind,
      bulkAdjustDirection,
      bulkAdjustValue.trim(),
      selectedPriceIdsKey,
    ].join("|");
  }, [bulkAdjustKind, bulkAdjustDirection, bulkAdjustValue, selectedPriceIdsKey]);

  const isBulkPreviewStale = bulkPreviewKey !== null && bulkPreviewKey !== bulkDraftKey;

  useEffect(() => {
    // If inputs/filters change after preview, require re-confirmation.
    if (bulkPreviewKey !== null && bulkPreviewKey !== bulkDraftKey) {
      setBulkConfirmChecked(false);
    }
  }, [bulkDraftKey, bulkPreviewKey]);

  const generateBulkPricePreview = () => {
    if (bulkPricePreview.affected === 0) {
      setBulkPreviewSnapshot(null);
      setBulkPreviewKey(null);
      setBulkConfirmChecked(false);
      return;
    }
    setBulkPreviewSnapshot(bulkPricePreview);
    setBulkPreviewKey(bulkDraftKey);
    setBulkConfirmChecked(false);
  };

  const clearBulkPricePreview = () => {
    setBulkPreviewSnapshot(null);
    setBulkPreviewKey(null);
    setBulkConfirmChecked(false);
  };

  const openBulkDialog = () => {
    clearBulkPricePreview();
    setBulkDialogOpen(true);
  };

  const closeBulkDialog = () => {
    setBulkDialogOpen(false);
    clearBulkPricePreview();
  };

  const applyBulkPriceRule = async () => {
    if (isApplyingBulkPrices) return;
    if (!bulkPreviewSnapshot || !bulkPreviewKey) return;
    if (bulkPreviewKey !== bulkDraftKey) return;
    if (!bulkConfirmChecked) return;

    const value = parseFloat(bulkAdjustValue);
    const unit = bulkAdjustKind === "percent" ? "%" : "$";
    const verb = bulkAdjustDirection === "increase" ? "augmenter" : "diminuer";

    const ok = confirm(
      `Confirmer: ${verb} de ${value}${unit} sur ${bulkPreviewSnapshot.affected} prix sélectionné(s) ?`
    );
    if (!ok) return;

    setIsApplyingBulkPrices(true);
    try {
      const result = await updatePricesBulk(bulkPreviewSnapshot.updates);
      if (result.success) {
        closeBulkDialog();
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsApplyingBulkPrices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto border-b border-foreground/10 pb-px">
        {(["brands", "models", "prices"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("section", "produits");
                url.searchParams.set("tab", tab);
                router.replace(url.pathname + `?${url.searchParams.toString()}`);
              }
            }}
            className={`shrink-0 px-4 py-3 text-xs font-medium uppercase tracking-wider transition-all sm:px-6 sm:text-sm ${
              activeTab === tab
                ? "border-b-2 border-brand-primary text-brand-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab === "brands" && "Marques"}
            {tab === "models" && "Modèles"}
            {tab === "prices" && "Prix"}
          </button>
        ))}
      </div>

      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-(family-name:--font-playfair) text-xl font-light text-brand-dark sm:text-2xl">
              Marques
            </h2>
            <button
              onClick={() => setShowBrandForm(!showBrandForm)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 sm:self-center"
            >
              <Plus className="h-4 w-4" />
              Ajouter une marque
            </button>
          </div>

          <AnimatePresence>
            {showBrandForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-card border border-foreground/10 bg-background p-6 shadow-soft"
              >
                <form onSubmit={handleCreateBrand} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-brand-dark">Nouvelle marque</h3>
                    <button
                      type="button"
                      onClick={() => setShowBrandForm(false)}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                        placeholder="Apple"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Logo
                      </label>
                      <ImageUploader
                        currentImageUrl={newBrandLogoUrl}
                        onImageChange={(url) => setNewBrandLogoUrl(url)}
                        bucket="device-images"
                        folder="brands"
                      />
                      <input type="hidden" name="logoUrl" value={newBrandLogoUrl ?? ""} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105"
                  >
                    Créer
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 sm:px-6">Nom</TableHead>
                  <TableHead className="px-3 sm:px-6">Slug</TableHead>
                  <TableHead className="px-3 sm:px-6">Logo</TableHead>
                  <TableHead className="text-right px-3 sm:px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-foreground/60">
                      Aucune marque
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) =>
                    editingBrand === brand.id ? (
                      <TableRow key={brand.id}>
                        <TableCell colSpan={4}>
                          <form
                            onSubmit={(e) => handleUpdateBrand(brand.id, e)}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="text"
                                name="name"
                                defaultValue={brand.name}
                                required
                                className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="rounded-card p-2 text-brand-primary transition-all hover:bg-brand-primary/10"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBrand(null)}
                                className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Logo
                              </label>
                              <ImageUploader
                                currentImageUrl={
                                  brandLogoDrafts[brand.id] !== undefined
                                    ? brandLogoDrafts[brand.id]
                                    : brand.logo_url
                                }
                                onImageChange={(url) =>
                                  setBrandLogoDrafts((prev) => ({ ...prev, [brand.id]: url }))
                                }
                                bucket="device-images"
                                folder="brands"
                              />
                              <input
                                type="hidden"
                                name={`logoUrl-${brand.id}`}
                                value={brandLogoDrafts[brand.id] ?? ""}
                              />
                            </div>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell className="text-foreground/60">{brand.slug}</TableCell>
                        <TableCell>
                          {brand.logo_url ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded-card border border-foreground/10">
                              <Image
                                src={brand.logo_url}
                                alt={brand.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingBrand(brand.id);
                                setBrandLogoDrafts((prev) => ({
                                  ...prev,
                                  [brand.id]: brand.logo_url ?? null,
                                }));
                              }}
                              className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5 hover:text-brand-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand.id)}
                              className="rounded-card p-2 text-red-500 transition-all hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === "models" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-(family-name:--font-playfair) text-xl font-light text-brand-dark sm:text-2xl">
              Modèles
            </h2>
            <button
              onClick={() => setShowModelForm(!showModelForm)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 sm:self-center"
            >
              <Plus className="h-4 w-4" />
              Ajouter un modèle
            </button>
          </div>

          <AnimatePresence>
            {showModelForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-card border border-foreground/10 bg-background p-6 shadow-soft"
              >
                <form onSubmit={handleCreateModel} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-brand-dark">Nouveau modèle</h3>
                    <button
                      type="button"
                      onClick={() => setShowModelForm(false)}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Marque *
                      </label>
                      <select
                        name="brandId"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                      >
                        <option value="">Sélectionner une marque</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                        placeholder="iPhone 15 Pro"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Image
                      </label>
                      <ImageUploader
                        currentImageUrl={null}
                        onImageChange={(url) => {
                          const input = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
                          if (input) input.value = url || "";
                        }}
                        bucket="device-images"
                        folder="models"
                      />
                      <input type="hidden" name="imageUrl" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105"
                  >
                    Créer
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 sm:px-6">Marque</TableHead>
                  <TableHead className="px-3 sm:px-6">Nom</TableHead>
                  <TableHead className="px-3 sm:px-6">Slug</TableHead>
                  <TableHead className="px-3 sm:px-6">Image</TableHead>
                  <TableHead className="text-right px-3 sm:px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-foreground/60">
                      Aucun modèle
                    </TableCell>
                  </TableRow>
                ) : (
                  models.map((model) =>
                    editingModel === model.id ? (
                      <TableRow key={model.id}>
                        <TableCell colSpan={5}>
                          <form
                            onSubmit={(e) => handleUpdateModel(model.id, e)}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="text"
                                name="name"
                                defaultValue={model.name}
                                required
                                className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="rounded-card p-2 text-brand-primary transition-all hover:bg-brand-primary/10"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingModel(null)}
                                className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Image
                              </label>
                              <ImageUploader
                                currentImageUrl={model.image_url}
                                onImageChange={(url) => {
                                  const hiddenInput = document.querySelector(`input[name="imageUrl-${model.id}"]`) as HTMLInputElement;
                                  if (hiddenInput) hiddenInput.value = url || "";
                                }}
                                bucket="device-images"
                                folder="models"
                              />
                              <input type="hidden" name={`imageUrl-${model.id}`} defaultValue={model.image_url || ""} />
                              <input type="hidden" name="imageUrl" defaultValue={model.image_url || ""} />
                            </div>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={model.id}>
                        <TableCell>{getBrandName(model.brands)}</TableCell>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell className="text-foreground/60">{model.slug}</TableCell>
                        <TableCell>
                          {model.image_url ? (
                            <div className="relative h-16 w-16 overflow-hidden rounded-card border border-foreground/10">
                              <Image
                                src={model.image_url}
                                alt={model.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingModel(model.id)}
                              className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5 hover:text-brand-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="rounded-card p-2 text-red-500 transition-all hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === "prices" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-(family-name:--font-playfair) text-xl font-light text-brand-dark sm:text-2xl">
              Prix
            </h2>
            <button
              onClick={() => setShowPriceForm(!showPriceForm)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 sm:self-center"
            >
              <Plus className="h-4 w-4" />
              Ajouter un prix
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-card border border-foreground/10 bg-background p-3 shadow-soft sm:gap-4 sm:p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground/70">Filtres :</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              >
                <option value="all">Toutes les marques</option>
                {uniqueBrandsForPrices.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              >
                <option value="all">Tous les modèles</option>
                {uniqueModelsForPrices.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <select
                value={selectedConditionFilter}
                onChange={(e) => setSelectedConditionFilter(e.target.value)}
                className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              >
                <option value="all">Toutes les conditions</option>
                {uniqueConditionsForPrices.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>

              <select
                value={selectedMemoryFilter}
                onChange={(e) => setSelectedMemoryFilter(e.target.value)}
                className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              >
                <option value="all">Toutes les mémoires</option>
                {uniqueMemoriesForPrices.map((memory) => (
                  <option key={memory} value={memory}>
                    {memory}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Prix min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-32 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
              />

              <input
                type="number"
                placeholder="Prix max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-32 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
              />
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-3 text-sm text-foreground/60 sm:ml-auto sm:w-auto">
              <span>
                {filteredPrices.length} prix sur {prices.length} (affichage {pricesPageRangeLabel})
              </span>

              <select
                value={pricesPageSize}
                onChange={(e) => setPricesPageSize(Number(e.target.value))}
                className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-3 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                aria-label="Rows per page"
              >
                {[10, 25, 50, 100, 250, 500, 1000].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPricesPageIndex((p) => Math.max(0, p - 1))}
                disabled={pricesPageIndex <= 0}
                className="rounded-card border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-foreground/5 disabled:opacity-50"
              >
                Précédent
              </button>

              <span className="text-sm text-foreground/60">
                Page {pricesPageIndex + 1}/{pricesTotalPages}
              </span>

              <button
                type="button"
                onClick={() => setPricesPageIndex((p) => Math.min(pricesTotalPages - 1, p + 1))}
                disabled={pricesPageIndex >= pricesTotalPages - 1}
                className="rounded-card border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground/70 transition-all hover:bg-foreground/5 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-foreground/10 bg-background p-3 shadow-soft sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
            <p className="text-sm text-foreground/70">
              <span className="font-medium text-foreground">{selectedPriceIds.size}</span>{" "}
              sélectionné{selectedPriceIds.size !== 1 ? "s" : ""}
              {filteredPrices.length > 0 ? (
                <span className="text-foreground/50">
                  {" "}
                  · {filteredPrices.length} après filtres
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPriceIds(new Set(filteredPrices.map((p) => p.id)))}
                disabled={filteredPrices.length === 0}
                className="rounded-full border border-foreground/10 bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground/70 transition-all hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                Tout sélectionner (filtrés)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceIds(new Set())}
                disabled={selectedPriceIds.size === 0}
                className="rounded-full border border-foreground/10 bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground/70 transition-all hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                Tout désélectionner
              </button>
              <button
                type="button"
                onClick={openBulkDialog}
                disabled={selectedPriceIds.size === 0}
                className="rounded-full bg-brand-dark px-5 py-2 text-xs font-medium uppercase tracking-[0.12em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:text-sm"
              >
                Modifier les prix
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPriceForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-card border border-foreground/10 bg-background p-6 shadow-soft"
              >
                <form onSubmit={handleCreatePrice} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-brand-dark">Nouveau prix</h3>
                    <button
                      type="button"
                      onClick={() => setShowPriceForm(false)}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Modèle *
                      </label>
                      <select
                        name="modelId"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                      >
                        <option value="">Sélectionner un modèle</option>
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {getBrandName(model.brands)} {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Condition *
                      </label>
                      <select
                        name="condition"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                      >
                        {CONDITIONS.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Mémoire *
                      </label>
                      <select
                        name="memory"
                        required
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                      >
                        {MEMORIES.map((memory) => (
                          <option key={memory} value={memory}>
                            {memory}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Prix (CAD) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        step="0.01"
                        className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105"
                  >
                    Créer
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>


          <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-2 sm:px-3">
                    <input
                      ref={pageSelectAllRef}
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={() => {
                        setSelectedPriceIds((prev) => {
                          const next = new Set(prev);
                          const every =
                            pagedPrices.length > 0 &&
                            pagedPrices.every((p) => next.has(p.id));
                          if (every) {
                            pagedPrices.forEach((p) => next.delete(p.id));
                          } else {
                            pagedPrices.forEach((p) => next.add(p.id));
                          }
                          return next;
                        });
                      }}
                      disabled={pagedPrices.length === 0}
                      className="h-4 w-4 rounded border-foreground/30"
                      aria-label="Sélectionner tous les prix de cette page"
                    />
                  </TableHead>
                  <TableHead className="px-3 sm:px-6">Modèle</TableHead>
                  <TableHead className="px-3 sm:px-6">Condition</TableHead>
                  <TableHead className="px-3 sm:px-6">Mémoire</TableHead>
                  <TableHead className="px-3 sm:px-6">Prix</TableHead>
                  <TableHead className="text-right px-3 sm:px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-foreground/60">
                      {prices.length === 0 ? "Aucun prix" : "Aucun prix ne correspond aux filtres"}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPrices.map((price) =>
                    editingPrice === price.id ? (
                      <TableRow key={price.id}>
                        <TableCell colSpan={6}>
                          <form
                            onSubmit={(e) => handleUpdatePrice(price.id, e)}
                            className="flex items-center gap-4"
                          >
                            <select
                              name="condition"
                              defaultValue={price.condition}
                              required
                              className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                            >
                              {CONDITIONS.map((condition) => (
                                <option key={condition} value={condition}>
                                  {condition}
                                </option>
                              ))}
                            </select>
                            <select
                              name="memory"
                              defaultValue={price.memory}
                              required
                              className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                            >
                              {MEMORIES.map((memory) => (
                                <option key={memory} value={memory}>
                                  {memory}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              name="price"
                              defaultValue={price.price}
                              required
                              min="0"
                              step="0.01"
                              className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="rounded-card p-2 text-brand-primary transition-all hover:bg-brand-primary/10"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPrice(null)}
                              className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={price.id}>
                        <TableCell className="w-12 px-2 sm:px-3">
                          <input
                            type="checkbox"
                            checked={selectedPriceIds.has(price.id)}
                            onChange={() => {
                              setSelectedPriceIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(price.id)) next.delete(price.id);
                                else next.add(price.id);
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-foreground/30"
                            aria-label={`Sélectionner ${getBrandName(price.models.brands)} ${price.models.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          {getBrandName(price.models.brands)} {price.models.name}
                        </TableCell>
                        <TableCell>{price.condition}</TableCell>
                        <TableCell>{price.memory}</TableCell>
                        <TableCell>
                          {editingPriceInline === price.id ? (
                            <input
                              type="number"
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              onBlur={() => handlePriceBlur(price.id)}
                              onKeyDown={(e) => handlePriceKeyDown(e, price.id)}
                              min="0"
                              step="0.01"
                              autoFocus
                              className="w-24 rounded-card border-2 border-brand-primary bg-background px-3 py-1.5 text-sm font-medium text-brand-primary transition-all focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => handlePriceClick(price.id, price.price)}
                              className="w-24 rounded-card border-2 border-transparent bg-[#F5F5F4] px-3 py-1.5 text-sm font-medium text-brand-primary transition-all hover:border-brand-primary/30 hover:bg-background focus:outline-none"
                            >
                              {price.price.toFixed(2)} $
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingPrice(price.id)}
                              className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5 hover:text-brand-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePrice(price.id)}
                              className="rounded-card p-2 text-red-500 transition-all hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {bulkDialogOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="presentation"
              onClick={closeBulkDialog}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-prices-dialog-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-foreground/10 bg-background p-5 shadow-xl sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3
                      id="bulk-prices-dialog-title"
                      className="font-(family-name:--font-playfair) text-lg font-light text-brand-dark sm:text-xl"
                    >
                      Règle de prix en gros
                    </h3>
                    <p className="mt-1 text-xs text-foreground/50">
                      S&apos;applique uniquement aux{" "}
                      <span className="font-medium text-foreground/70">{bulkScopePrices.length}</span>{" "}
                      prix sélectionné{bulkScopePrices.length !== 1 ? "s" : ""} (liste filtrée).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeBulkDialog}
                    className="rounded-card p-2 text-foreground/60 transition-all hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <select
                    value={bulkAdjustKind}
                    onChange={(e) => setBulkAdjustKind(e.target.value as BulkPriceAdjustmentKind)}
                    className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="amount">Montant ($)</option>
                  </select>

                  <select
                    value={bulkAdjustDirection}
                    onChange={(e) =>
                      setBulkAdjustDirection(e.target.value as BulkPriceAdjustmentDirection)
                    }
                    className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
                  >
                    <option value="increase">Augmenter</option>
                    <option value="decrease">Diminuer</option>
                  </select>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={bulkAdjustKind === "percent" ? "Ex: 5" : "Ex: 25"}
                    value={bulkAdjustValue}
                    onChange={(e) => setBulkAdjustValue(e.target.value)}
                    className="w-32 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-sm text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={generateBulkPricePreview}
                    disabled={
                      isApplyingBulkPrices ||
                      bulkPricePreview.affected === 0 ||
                      !bulkAdjustValue ||
                      parseFloat(bulkAdjustValue) <= 0
                    }
                    className="rounded-full border border-brand-dark bg-background px-6 py-2 text-sm font-medium uppercase tracking-[0.15em] text-brand-dark shadow-soft transition-all duration-300 hover:bg-brand-dark hover:text-background hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Prévisualiser ({bulkPricePreview.affected})
                  </button>

                  <button
                    type="button"
                    onClick={applyBulkPriceRule}
                    disabled={
                      isApplyingBulkPrices ||
                      !bulkPreviewSnapshot ||
                      isBulkPreviewStale ||
                      !bulkConfirmChecked ||
                      bulkPreviewSnapshot.affected === 0
                    }
                    className="rounded-full bg-brand-dark px-6 py-2 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isApplyingBulkPrices
                      ? "Application..."
                      : `Confirmer et appliquer (${bulkPreviewSnapshot?.affected ?? 0})`}
                  </button>

                  {bulkPreviewSnapshot ? (
                    <button
                      type="button"
                      onClick={clearBulkPricePreview}
                      className="rounded-full border border-foreground/10 bg-background px-6 py-2 text-sm font-medium uppercase tracking-[0.15em] text-foreground/70 transition-all hover:bg-foreground/5"
                    >
                      Réinitialiser
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 text-xs text-foreground/60">
                  {bulkPricePreview.total === 0 ? (
                    "Aucun prix sélectionné."
                  ) : (
                    <>
                      Impact estimé (avant prévisualisation): {bulkPricePreview.affected} modifié(s),{" "}
                      {bulkPricePreview.unchanged} inchangé(s)
                    </>
                  )}
                </div>

                {bulkPreviewSnapshot ? (
                  <div className="mt-4 rounded-card border border-foreground/10 bg-secondary/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-foreground/70">
                        Aperçu figé:{" "}
                        <span className="font-medium">{bulkPreviewSnapshot.affected}</span>{" "}
                        modification(s)
                        {isBulkPreviewStale ? (
                          <span className="ml-2 font-medium text-red-600">
                            (aperçu expiré — re-prévisualisez)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {bulkPreviewSnapshot.sample.length > 0 ? (
                      <div className="mt-3 space-y-1 text-xs text-foreground/70">
                        {bulkPreviewSnapshot.sample.map((s) => (
                          <div key={s.id} className="flex flex-wrap items-center gap-2">
                            <span>{s.label}</span>
                            <span className="text-foreground/40">—</span>
                            <span className="font-medium">
                              {s.from.toFixed(2)}$ → {s.to.toFixed(2)}$
                            </span>
                          </div>
                        ))}
                        {bulkPreviewSnapshot.affected > bulkPreviewSnapshot.sample.length ? (
                          <div className="mt-2 text-foreground/50">
                            … et {bulkPreviewSnapshot.affected - bulkPreviewSnapshot.sample.length}{" "}
                            autre(s) modification(s).
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <label className="mt-4 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={bulkConfirmChecked}
                        disabled={isBulkPreviewStale}
                        onChange={(e) => setBulkConfirmChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="text-sm text-foreground/70">
                        Je confirme appliquer ces changements aux prix prévisualisés.
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
