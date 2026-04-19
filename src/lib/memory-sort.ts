/** Trie les capacités du plus petit au plus grand (ex. 32GB, 64GB, 1TB). */
export function sortMemoryCapacities(memories: string[]): string[] {
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
