const ordreModelesApple = [
  "17 Pro Max",
  "17 Pro",
  "17",
  "Air",
  "16 Pro Max",
  "16 Pro",
  "16 Plus",
  "16e",
  "16",
  "15 Pro Max",
  "15 Pro",
  "15 Plus",
  "15",
  "14 Pro Max",
  "14 Pro",
  "14 Plus",
  "14",
  "13 Pro Max",
  "13 Pro",
  "13",
  "13 Mini",
  "12 Pro Max",
  "12 pro",
  "12",
  "12 Mini",
  "11 Pro Max",
  "11 Pro",
  "11",
  "Se 3e Gen",
  "Se 2e Gen 2020",
  "Xs max",
  "Xs",
  "Xr",
  "X",
  "8 Plus",
  "8",
  "7 Plus",
  "7",
  "6s Plus",
  "6s",
  "6 Plus",
  "6",
  "SE 1ere Gen",
];

const ordreModelesSamsung = [
  "s25 edge",
  "s25 ultra",
  "s25+",
  "s25",
  "s25 FE",
  "s24 ultra",
  "s24 +",
  "s24",
  "s24 fe",
  "s23 ultra",
  "s23 +",
  "s23",
  "S23 fe",
  "s22 ultra",
  "s22 +",
  "S22",
  "s21 ultra",
  "S21 +",
  "S21",
  "S21 fe",
  "s20 utra",
  "s20 ultra",
  "s20 +",
  "s20",
  "S20 fe",
  "S10 +",
  "S10",
  "S10e",
  "S9+",
  "s9",
  "A71",
  "A70",
  "A54",
  "A53",
  "A52",
  "A51",
  "A50",
  "A36",
  "A35",
  "A32",
  "A21",
  "A20",
  "A16",
  "A15",
  "A14",
  "A13",
  "A12",
  "A11",
  "A10e",
  "A8",
  "z Fold 7",
  "z Fold 6",
  "z Fold 5",
  "z Fold 4",
  "z Fold 3",
  "z Fold 2",
  "Fold",
  "z flip 7",
  "z flip 6",
  "z flip 5",
  "z flip 4",
  "z flip 3",
  "z flip",
  "note 20 ultra",
  "note 20",
  "note 10 +",
  "note 10",
  "note 9",
];

const ordreModelesPixel = [
  "Pixel 10 pro XL",
  "Pixel 10 pro",
  "Pixel 10",
  "Pixel 9 pro fold",
  "Pixel 9 pro XL",
  "Pixel 9 pro",
  "Pixel 9A",
  "Pixel 9",
  "Pixel 8 pro",
  "Pixel 8",
  "Pixel 8A",
  "Pixel 7 pro",
  "Pixel 7",
  "Pixel 7A",
  "Pixel 6 pro",
  "Pixel 6",
  "Pixel 6A",
  "Pixel 5",
  "Pixel 4 XL",
  "Pixel 4",
  "Pixel 4a",
];

const ordreModelesMotorola = [
  "Moto Razr Ultra 2025",
  "Moto Razr 2025",
  "Moto Edge 2025",
  "Moto Razr + 2024",
  "Moto Edge 2024",
  "Moto Razr + 2023",
  "Moto Razr 2023",
  "Moto Edge + 2023",
  "Moto Edge 2023",
  "Moto Edge 2022",
  "Moto Edge 2021",
  "Moto One 5g Ace",
  "Moto G Stylus",
  "Moto G Power",
  "Moto G Pure",
  "Moto G Fast",
  "Moto G Play",
  "Moto E 2020",
];

const ordreModelesLG = [
  "Lg Velvet",
  "Lg V60 ThinQ",
  "Lg G8X ThinQ",
  "Lg G8 ThinQ",
  "Lg Q70",
  "Lg Q60",
  "Lg K61",
  "Lg K41s",
];

const ordreModelesHuawei = [
  "P40 Pro",
  "P40",
  "Mate 30 Pro",
  "P30 Pro",
  "P30",
  "P30 lite",
];

const ordreModelesTCL = ["TCL 30 5G", "TCL 20 Pro", "TCL 20S"];

const ordreModelesOnePlus = [
  "OnePlus 13",
  "OnePlus 12",
  "OnePlus 11",
  "OnePlus 10 Pro",
  "OnePlus 10T",
  "OnePlus 9 Pro",
  "OnePlus 9",
  "OnePlus Nord N200",
];

function normalizeBrandName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ordreParMarque: Record<string, string[]> = {
  apple: ordreModelesApple,
  iphone: ordreModelesApple,
  samsung: ordreModelesSamsung,
  google: ordreModelesPixel,
  pixel: ordreModelesPixel,
  googlepixel: ordreModelesPixel,
  motorola: ordreModelesMotorola,
  lg: ordreModelesLG,
  huawei: ordreModelesHuawei,
  tcl: ordreModelesTCL,
  oneplus: ordreModelesOnePlus,
};

function resolveBrandOrder(brandName: string): string[] | undefined {
  const normalized = normalizeBrandName(brandName);

  if (normalized.includes("iphone") || normalized.includes("apple")) {
    return ordreModelesApple;
  }
  if (normalized.includes("samsung")) {
    return ordreModelesSamsung;
  }
  if (normalized.includes("google") || normalized.includes("pixel")) {
    return ordreModelesPixel;
  }
  if (normalized.includes("motorola")) {
    return ordreModelesMotorola;
  }
  if (normalized === "lg" || normalized.includes("lge")) {
    return ordreModelesLG;
  }
  if (normalized.includes("huawei")) {
    return ordreModelesHuawei;
  }
  if (normalized.includes("tcl")) {
    return ordreModelesTCL;
  }
  if (normalized.includes("oneplus") || normalized === "one") {
    return ordreModelesOnePlus;
  }

  return ordreParMarque[normalized];
}

function normalizeModelName(name: string): string {
  return name.trim();
}

function findModelIndex(modelName: string, ordre: string[]): number {
  const normalized = normalizeModelName(modelName).toLowerCase();

  // 1) Prefer exact match first.
  for (let i = 0; i < ordre.length; i++) {
    const ordreModel = normalizeModelName(ordre[i]).toLowerCase();
    if (normalized === ordreModel) {
      return i;
    }
  }

  // 2) Then match entries where the catalog label contains the ordered model label.
  // This handles variants like "iPhone 17 Pro Max 256GB" while avoiding
  // false positives such as "17" matching "17 Pro Max".
  for (let i = 0; i < ordre.length; i++) {
    const ordreModel = normalizeModelName(ordre[i]).toLowerCase();
    if (normalized.includes(ordreModel)) {
      return i;
    }
  }
  
  return ordre.length;
}

export function sortModelsByRecent<T extends { name: string; brand_id?: string; brand_name?: string }>(
  models: T[],
  brandName?: string
): T[] {
  if (models.length === 0) return models;

  const firstModel = models[0];
  let brand: string | undefined = brandName;

  if (!brand && "brand_name" in firstModel) {
    brand = firstModel.brand_name;
  }

  if (!brand) {
    return [...models].sort((a, b) => a.name.localeCompare(b.name));
  }

  const ordre = resolveBrandOrder(brand);
  if (!ordre) {
    return [...models].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...models].sort((a, b) => {
    const indexA = findModelIndex(a.name, ordre);
    const indexB = findModelIndex(b.name, ordre);

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    return a.name.localeCompare(b.name);
  });
}
