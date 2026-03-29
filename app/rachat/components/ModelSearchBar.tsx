"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

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

type ModelSearchBarProps = {
  brands: Brand[];
  models: Model[];
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  noResultsLabel: string;
  onSelect: (selection: { brand: Brand; model: Model }) => void;
  maxResults?: number;
};

function normalizeForSearch(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ModelSearchBar({
  brands,
  models,
  placeholder,
  ariaLabel,
  clearLabel,
  noResultsLabel,
  onSelect,
  maxResults = 8,
}: ModelSearchBarProps) {
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const brandsById = useMemo(() => {
    const map = new Map<string, Brand>();
    for (const brand of brands) map.set(brand.id, brand);
    return map;
  }, [brands]);

  const searchIndex = useMemo(() => {
    return models
      .map((model) => {
        const brand = brandsById.get(model.brand_id) ?? null;
        return {
          model,
          brand,
          normalizedBrandAndModelName: normalizeForSearch(
            `${brand?.name ?? ""} ${model.name}`,
          ),
        };
      })
      .filter((row) => row.brand !== null) as Array<{
      model: Model;
      brand: Brand;
      normalizedBrandAndModelName: string;
    }>;
  }, [models, brandsById]);

  const results = useMemo(() => {
    const q = normalizeForSearch(query);
    const tokens = q.split(" ").filter(Boolean);
    if (!tokens.length) return [];

    const matches: typeof searchIndex = [];
    for (const row of searchIndex) {
      const ok = tokens.every((t) =>
        row.normalizedBrandAndModelName.includes(t),
      );
      if (!ok) continue;
      matches.push(row);
      if (matches.length >= maxResults) break;
    }

    return matches;
  }, [query, searchIndex, maxResults]);

  const handleSelect = (row: (typeof results)[number]) => {
    onSelect({ brand: row.brand, model: row.model });
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-xl">
      <label htmlFor={inputId} className="sr-only">
        {ariaLabel}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <input
          id={inputId}
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setIsOpen(true);
              return;
            }

            if (e.key === "Escape") {
              setIsOpen(false);
              setActiveIndex(-1);
              return;
            }

            if (!results.length) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((prev) => Math.max(prev - 1, 0));
              return;
            }

            if (e.key === "Enter") {
              if (activeIndex < 0) return;
              e.preventDefault();
              handleSelect(results[activeIndex]);
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-expanded={isOpen && results.length > 0}
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `${listboxId}-opt-${results[activeIndex].model.id}`
              : undefined
          }
          className="h-12 w-full rounded-full border border-black/10 bg-background pl-11 pr-11 text-sm text-foreground shadow-soft outline-none transition-colors placeholder:text-foreground/40 focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/15"
        />

        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label={clearLabel}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {isOpen && query.trim() && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-black/10 bg-background shadow-soft">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-foreground/60">
                {noResultsLabel}
              </div>
            ) : (
              <ul id={listboxId} role="listbox" className="max-h-80 overflow-auto">
                {results.map((row, index) => {
                  const isActive = index === activeIndex;
                  const optionId = `${listboxId}-opt-${row.model.id}`;
                  const priceLabel =
                    row.model.min_price === row.model.max_price
                      ? `${row.model.min_price}$`
                      : `${row.model.min_price}$-${row.model.max_price}$`;
                  return (
                    <li
                      key={row.model.id}
                      id={optionId}
                      role="option"
                      aria-selected={isActive}
                    >
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                          isActive ? "bg-brand-primary/10" : "hover:bg-foreground/5"
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(row);
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">
                            {row.model.name}
                          </span>
                          <span className="block truncate text-xs text-foreground/60">
                            {row.brand.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-foreground/60">
                          {priceLabel}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
