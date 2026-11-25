"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Search, X } from "lucide-react";

type ModelSearchOption = {
  value: string;
  label: string;
};

type ModelSearchSelectProps = {
  options: ModelSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  clearLabel: string;
  allOption?: ModelSearchOption;
  name?: string;
  required?: boolean;
  invalidMessage?: string;
  className?: string;
  inputClassName?: string;
};

const AMBIGUOUS_MODEL_MESSAGE = "Plusieurs modèles correspondent. Choisissez-le dans la liste.";

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ModelSearchSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
  clearLabel,
  allOption,
  name,
  required = false,
  invalidMessage = "Sélectionnez un modèle",
  className = "",
  inputClassName = "py-2",
}: ModelSearchSelectProps) {
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const valueInputRef = useRef<HTMLInputElement | null>(null);
  const submittedValueRef = useRef(value);
  const commitLock = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; value: string } | null>(null);
  const removeTouchListenersRef = useRef<(() => void) | null>(null);
  const clearFromPointerRef = useRef(false);
  const queryRef = useRef("");
  const validityMessageRef = useRef("");
  const userEditedQueryRef = useRef(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((option) => option.value === value) ?? null;
  const showAllOption = Boolean(allOption) && value !== allOption?.value;

  const labelForValue = (id: string) =>
    options.find((option) => option.value === id)?.label ?? "";

  const textMatchesValue = (text: string, id: string) => {
    const label = normalizeForSearch(labelForValue(id));
    const typed = normalizeForSearch(text);
    if (!label || !typed) return false;
    return typed === label;
  };

  const setValidity = (message: string) => {
    validityMessageRef.current = message;
    inputRef.current?.setCustomValidity(message);
  };

  const publishValue = (next: string) => {
    submittedValueRef.current = next;
    if (valueInputRef.current) valueInputRef.current.value = next;
    if (next) setValidity("");
    if (next !== value) onChange(next);
  };

  const clearCommittedValue = () => {
    if (submittedValueRef.current) publishValue("");
  };

  useEffect(() => {
    submittedValueRef.current = value;
    if (valueInputRef.current && valueInputRef.current.value !== value) {
      valueInputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    return () => removeTouchListenersRef.current?.();
  }, []);

  useEffect(() => {
    if (!name || isOpen || userEditedQueryRef.current) return;
    const committedId = submittedValueRef.current;
    if (!committedId || options.some((option) => option.value === committedId)) return;
    clearCommittedValue();
    if (required) setValidity(invalidMessage);
  }, [invalidMessage, isOpen, name, options, required, value]);

  const matchingOptions = (text: string) => {
    const normalized = normalizeForSearch(text);
    if (!normalized) return [];
    return options.filter((option) => normalizeForSearch(option.label) === normalized);
  };

  const isAmbiguousPrefix = (text: string) => {
    const normalized = normalizeForSearch(text);
    if (!normalized) return false;
    let hits = 0;
    for (const option of options) {
      if (!normalizeForSearch(option.label).startsWith(normalized)) continue;
      hits += 1;
      if (hits > 1) return true;
    }
    return false;
  };

  const reportAmbiguous = () => {
    clearCommittedValue();
    setValidity(AMBIGUOUS_MODEL_MESSAGE);
    inputRef.current?.reportValidity();
  };

  const reconcileTypedValue = (text: string, report = false) => {
    if (!name) return;
    const matches = matchingOptions(text);
    if (matches.length === 1) {
      publishValue(matches[0].value);
      setValidity("");
      return;
    }
    if (textMatchesValue(text, submittedValueRef.current)) {
      setValidity("");
      return;
    }
    if (!normalizeForSearch(text) && submittedValueRef.current && !userEditedQueryRef.current) {
      if (labelForValue(submittedValueRef.current)) {
        setValidity("");
        return;
      }
      clearCommittedValue();
      if (required) setValidity(invalidMessage);
      return;
    }
    if (matches.length > 1) {
      clearCommittedValue();
      setValidity(AMBIGUOUS_MODEL_MESSAGE);
      if (report) inputRef.current?.reportValidity();
      return;
    }
    if (report && isAmbiguousPrefix(text)) {
      reportAmbiguous();
      return;
    }
    setValidity("");
    clearCommittedValue();
  };

  const results = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query);
    const queryMatchesSelection =
      Boolean(selected) && normalizedQuery === normalizeForSearch(selected?.label ?? "");
    const tokens =
      queryMatchesSelection ? [] : normalizedQuery.split(" ").filter(Boolean);
    const ranked = options.flatMap((option) => {
      const label = normalizeForSearch(option.label);
      if (tokens.length > 0 && !tokens.every((token) => label.includes(token))) return [];
      const rank = tokens.length > 0 && label.startsWith(normalizedQuery) ? 0 : 1;
      return [{ option, rank }];
    });

    ranked.sort(
      (a, b) => a.rank - b.rank || a.option.label.localeCompare(b.option.label, "fr"),
    );
    return ranked.map((row) => row.option);
  }, [options, query, selected]);

  const rows = useMemo(() => {
    const next: ModelSearchOption[] = [];
    if (showAllOption && allOption) next.push(allOption);
    next.push(...results);
    return next;
  }, [allOption, results, showAllOption]);

  useLayoutEffect(() => {
    const message =
      validityMessageRef.current || (required && !value ? invalidMessage : "");
    inputRef.current?.setCustomValidity(message);
  }, [invalidMessage, required, value]);

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

  const commit = (option: ModelSearchOption) => {
    pointerStartRef.current = null;
    commitLock.current = true;
    publishValue(option.value);
    queryRef.current = "";
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    commitLock.current = false;
  };

  const clear = () => {
    pointerStartRef.current = null;
    queryRef.current = "";
    setValidity("");
    publishValue(allOption?.value ?? "");
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const selectFromPointer = (event: ReactPointerEvent<HTMLButtonElement>, option: ModelSearchOption) => {
    if (event.pointerType === "mouse") {
      event.preventDefault();
      commit(option);
      return;
    }

    const start = { x: event.clientX, y: event.clientY, value: option.value };
    pointerStartRef.current = start;
    const list = rootRef.current?.querySelector<HTMLElement>("[role='listbox']");
    const scrollTop = list?.scrollTop ?? 0;
    removeTouchListenersRef.current?.();
    const dismissOrphanedList = (force = false) => {
      requestAnimationFrame(() => {
        if (pointerStartRef.current) return;
        if (!force && list?.isConnected && list.scrollTop !== scrollTop) return;
        const active = document.activeElement;
        if (active instanceof Node && rootRef.current?.contains(active)) return;
        reconcileTypedValue(queryRef.current, true);
        queryRef.current = "";
        setQuery("");
        setIsOpen(false);
        setActiveIndex(-1);
      });
    };
    let watchdog = 0;
    const finish = (end: PointerEvent) => {
      remove();
      if (pointerStartRef.current !== start) return;
      pointerStartRef.current = null;
      if (end.type === "pointercancel") {
        dismissOrphanedList();
        return;
      }
      const moved =
        Math.abs(end.clientX - start.x) > 10 || Math.abs(end.clientY - start.y) > 10;
      if (moved) {
        dismissOrphanedList();
        return;
      }
      commit(option);
    };
    const finishTouch = (end: TouchEvent) => {
      const touch = end.changedTouches.item(0);
      finish({
        type: end.type === "touchcancel" ? "pointercancel" : "pointerup",
        clientX: touch?.clientX ?? start.x,
        clientY: touch?.clientY ?? start.y,
      } as PointerEvent);
    };
    const remove = () => {
      window.clearTimeout(watchdog);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("touchend", finishTouch);
      window.removeEventListener("touchcancel", finishTouch);
      if (removeTouchListenersRef.current === remove) removeTouchListenersRef.current = null;
    };
    removeTouchListenersRef.current = remove;
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("touchend", finishTouch);
    window.addEventListener("touchcancel", finishTouch);
    watchdog = window.setTimeout(() => {
      if (pointerStartRef.current !== start) return;
      remove();
      pointerStartRef.current = null;
      dismissOrphanedList(true);
    }, 1500);
  };

  const inputValue = isOpen ? query : (selected?.label ?? "");
  const resolvedPlaceholder =
    allOption && (!value || value === allOption.value) ? allOption.label : placeholder;
  const canClear = Boolean(selected) || (allOption ? value !== allOption.value && Boolean(value) : Boolean(value));

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? (
        <input
          ref={valueInputRef}
          name={name}
          defaultValue={value}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className="sr-only"
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault();
            const message = validityMessageRef.current || invalidMessage;
            setValidity(message);
            inputRef.current?.focus();
            inputRef.current?.reportValidity();
          }}
        />
      ) : null}
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <input
        id={inputId}
        ref={inputRef}
        value={inputValue}
        onChange={(event) => {
          const nextQuery = event.target.value;
          userEditedQueryRef.current = true;
          queryRef.current = nextQuery;
          setQuery(nextQuery);
          setIsOpen(true);
          setActiveIndex(-1);
          reconcileTypedValue(nextQuery);
        }}
        onFocus={() => {
          userEditedQueryRef.current = false;
          const committed = submittedValueRef.current;
          const label =
            allOption && committed === allOption.value ? "" : labelForValue(committed);
          queryRef.current = label;
          setQuery(label);
          setIsOpen(true);
          setActiveIndex(-1);
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        onBlur={(event) => {
          if (commitLock.current || pointerStartRef.current) return;
          const next = event.relatedTarget;
          const staysInside = next instanceof Node && Boolean(rootRef.current?.contains(next));
          if (!staysInside) reconcileTypedValue(queryRef.current, true);
          if (!staysInside) {
            queryRef.current = "";
            setQuery("");
          }
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
          }

          if (event.key === "Enter") {
            if (!isOpen) return;
            const typed = queryRef.current;
            const highlighted = activeIndex >= 0 ? rows[activeIndex] : null;
            if (highlighted && highlighted.value !== submittedValueRef.current) {
              event.preventDefault();
              commit(highlighted);
              return;
            }
            const matches = matchingOptions(typed);
            if (matches.length === 1 && matches[0].value !== submittedValueRef.current) {
              event.preventDefault();
              commit(matches[0]);
              return;
            }
            if (
              (matches.length > 1 || isAmbiguousPrefix(typed)) &&
              !textMatchesValue(typed, submittedValueRef.current)
            ) {
              event.preventDefault();
              if (name) reportAmbiguous();
              return;
            }
            const selectionIsReady =
              Boolean(submittedValueRef.current) &&
              (!userEditedQueryRef.current ||
                textMatchesValue(typed, submittedValueRef.current) ||
                matches.length === 1);
            if (!selectionIsReady && required) {
              event.preventDefault();
              setValidity(invalidMessage);
              inputRef.current?.reportValidity();
              return;
            }
            if (!selectionIsReady) {
              event.preventDefault();
              setIsOpen(false);
              setActiveIndex(-1);
              return;
            }
            setIsOpen(false);
            setActiveIndex(-1);
            return;
          }

          if (!rows.length) return;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((prev) => Math.min(prev + 1, rows.length - 1));
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          }
        }}
        placeholder={resolvedPlaceholder}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-required={required || undefined}
        aria-activedescendant={
          activeIndex >= 0 && rows[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        className={`w-full rounded-card border-2 border-transparent bg-[#F5F5F4] pl-9 pr-9 text-sm text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none ${inputClassName}`}
      />
      {canClear ? (
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            clearFromPointerRef.current = true;
            clear();
            window.setTimeout(() => {
              clearFromPointerRef.current = false;
            }, 0);
          }}
          onClick={() => {
            if (clearFromPointerRef.current) {
              clearFromPointerRef.current = false;
              return;
            }
            clear();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label={clearLabel}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {isOpen && (rows.length > 0 || normalizeForSearch(query)) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-card border border-foreground/10 bg-background shadow-soft">
          {rows.length === 0 ? (
            <div className="px-4 py-3 text-sm text-foreground/60">
              {normalizeForSearch(query) ? emptyLabel : placeholder}
            </div>
          ) : (
            <ul id={listboxId} role="listbox" className="max-h-72 overflow-auto">
              {rows.map((option, index) => {
                const isActive = index === activeIndex;
                const isAll = option.value === allOption?.value;
                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    <button
                      type="button"
                      className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isActive ? "bg-brand-primary/10 text-foreground" : "text-foreground hover:bg-foreground/5"
                      } ${isAll ? "text-foreground/70" : ""}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onPointerDown={(event) => selectFromPointer(event, option)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
