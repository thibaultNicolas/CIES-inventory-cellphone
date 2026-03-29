/**
 * Réimporte les images marques / modèles depuis des URLs encore pointées vers un autre projet Supabase (ou toute URL publique).
 *
 * Prérequis : `.env.local` du **projet cible** (celui qui reçoit les fichiers) avec :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optionnel :
 *   IMAGE_MIGRATE_ONLY_HOST=abcdefgh.supabase.co
 *     → ne migrer que les images dont l’URL a ce hostname (utile si tu as aussi des URLs externes à ne pas toucher).
 *     → si absent : toute URL dont le hostname ≠ celui de NEXT_PUBLIC_SUPABASE_URL est migrée.
 *
 * Usage :
 *   npm run migrate-images
 *   npm run migrate-images -- --dry-run
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const BUCKET = "device-images";
const MARKER = `/storage/v1/object/public/${BUCKET}/`;

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function slugSafe(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function targetHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function onlyMigrateHost(): string | null {
  const h = process.env.IMAGE_MIGRATE_ONLY_HOST?.trim();
  return h || null;
}

function shouldMigrateUrl(imageUrl: string, currentHost: string): boolean {
  if (!imageUrl.startsWith("http")) return false;
  try {
    const host = new URL(imageUrl).hostname;
    const filter = onlyMigrateHost();
    if (filter) return host === filter;
    return host !== currentHost;
  } catch {
    return false;
  }
}

function objectPathFromPublicUrl(imageUrl: string): string | null {
  try {
    const u = new URL(imageUrl);
    const idx = u.pathname.indexOf(MARKER);
    if (idx >= 0) {
      const path = u.pathname.slice(idx + MARKER.length);
      return path ? decodeURIComponent(path) : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function extFromPath(path: string): string | null {
  const m = path.match(/\.([a-z0-9]+)$/i);
  if (!m) return null;
  const e = m[1].toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(e)) {
    return e === "jpeg" ? "jpg" : e;
  }
  return null;
}

async function fetchAsBuffer(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.error(`   HTTP ${res.status} pour ${url.slice(0, 80)}…`);
    return null;
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  return { buffer, contentType };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const currentHost = targetHostname();

  if (!supabaseUrl || !serviceKey || !currentHost) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const filterNote = onlyMigrateHost()
    ? ` (hostname source uniquement : ${onlyMigrateHost()})`
    : ` (toute URL dont le host ≠ ${currentHost})`;

  console.log(
    dryRun
      ? "🔍 Mode --dry-run : aucun upload ni mise à jour.\n"
      : "📤 Migration des images vers ce projet Supabase.\n"
  );
  console.log(`   Cible : ${currentHost}${filterNote}\n`);

  let migrated = 0;
  let skippedLocal = 0;
  let skippedEmpty = 0;
  let failed = 0;

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // --- Brands ---
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("id, slug, logo_url");

  if (brandsError) {
    console.error("❌ brands:", brandsError.message);
    process.exit(1);
  }

  for (const row of brands || []) {
    const url = row.logo_url;
    if (!url) {
      skippedEmpty++;
      continue;
    }
    if (!shouldMigrateUrl(url, currentHost)) {
      skippedLocal++;
      continue;
    }

    let objectPath =
      objectPathFromPublicUrl(url) || `brands/migrated-${slugSafe(row.slug)}.${extFromPath(url) || "png"}`;

    if (!extFromPath(objectPath)) {
      const ext = extFromPath(url);
      if (ext) objectPath = `${objectPath.replace(/\.[^.]+$/, "")}.${ext}`;
    }

    console.log(`📷 Brand ${row.slug}: ${url.slice(0, 72)}…`);

    if (dryRun) {
      migrated++;
      continue;
    }

    const fetched = await fetchAsBuffer(url);
    if (!fetched) {
      failed++;
      continue;
    }

    const ext =
      extFromPath(objectPath) ||
      MIME_EXT[fetched.contentType] ||
      (fetched.contentType.startsWith("image/") ? "jpg" : null);
    if (!ext) {
      console.error(`   Type non image : ${fetched.contentType}`);
      failed++;
      continue;
    }

    if (!extFromPath(objectPath)) {
      objectPath = objectPath.replace(/\.[^.]+$/, "") + `.${ext}`;
    }

    const contentType =
      fetched.contentType.startsWith("image/") ? fetched.contentType : `image/${ext === "jpg" ? "jpeg" : ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, fetched.buffer, { contentType, upsert: true });

    if (upErr) {
      console.error(`   Upload : ${upErr.message}`);
      failed++;
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    const { error: updErr } = await supabase
      .from("brands")
      .update({ logo_url: publicUrl })
      .eq("id", row.id);

    if (updErr) {
      console.error(`   DB : ${updErr.message}`);
      failed++;
      continue;
    }

    console.log(`   ✅ → ${publicUrl}`);
    migrated++;
    await delay(120);
  }

  const brandSlugById = new Map((brands || []).map((b) => [b.id, b.slug]));

  // --- Models ---
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, slug, image_url, brand_id");

  if (modelsError) {
    console.error("❌ models:", modelsError.message);
    process.exit(1);
  }

  for (const raw of models || []) {
    const brandSlug = brandSlugById.get(raw.brand_id) || "brand";
    const url = raw.image_url;
    if (!url) {
      skippedEmpty++;
      continue;
    }
    if (!shouldMigrateUrl(url, currentHost)) {
      skippedLocal++;
      continue;
    }

    let objectPath = objectPathFromPublicUrl(url);
    if (!objectPath) {
      const b = slugSafe(brandSlug || "brand");
      const m = slugSafe(raw.slug);
      objectPath = `models/migrated-${b}-${m}.png`;
    }

    console.log(`📷 Model ${brandSlug}/${raw.slug}: ${url.slice(0, 64)}…`);

    if (dryRun) {
      migrated++;
      continue;
    }

    const fetched = await fetchAsBuffer(url);
    if (!fetched) {
      failed++;
      continue;
    }

    let ext = extFromPath(objectPath) || MIME_EXT[fetched.contentType];
    if (!ext) {
      if (fetched.contentType.startsWith("image/")) ext = "jpg";
    }
    if (!ext) {
      console.error(`   Type non image : ${fetched.contentType}`);
      failed++;
      continue;
    }

    if (!extFromPath(objectPath)) {
      objectPath = objectPath.replace(/\.[^.]+$/, "") + `.${ext}`;
    }

    const contentType =
      fetched.contentType.startsWith("image/") ? fetched.contentType : `image/${ext === "jpg" ? "jpeg" : ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, fetched.buffer, { contentType, upsert: true });

    if (upErr) {
      console.error(`   Upload : ${upErr.message}`);
      failed++;
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    const { error: updErr } = await supabase
      .from("models")
      .update({ image_url: publicUrl })
      .eq("id", raw.id);

    if (updErr) {
      console.error(`   DB : ${updErr.message}`);
      failed++;
      continue;
    }

    console.log(`   ✅ → ${publicUrl}`);
    migrated++;
    await delay(120);
  }

  console.log("\n──────────────");
  console.log(
    dryRun
      ? `Résumé (dry-run) : ${migrated} à migrer, ${skippedLocal} déjà sur ce projet, ${skippedEmpty} sans URL.`
      : `Résumé : ${migrated} migrés, ${skippedLocal} déjà sur ce projet, ${skippedEmpty} sans URL, ${failed} erreurs.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
