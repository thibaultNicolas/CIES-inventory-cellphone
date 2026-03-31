"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { getRequestIpForRateLimit } from "@/lib/request-ip";

const BUCKET = "device-photos";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload photo de soumission rachat côté serveur (contourne les politiques Storage
 * trop ouvertes côté anon). À appeler depuis le wizard si vous activez les photos.
 */
export async function uploadDevicePhotoForRachat(formData: FormData) {
  const ip = await getRequestIpForRateLimit();
  const rl = checkRateLimit(`rachat-photo:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return { success: false as const, error: "Trop de téléversements. Réessayez plus tard." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false as const, error: "Fichier manquant." };
  }
  if (file.size > MAX_BYTES) {
    return { success: false as const, error: "Fichier trop volumineux (max 5 Mo)." };
  }
  const mime = (file.type || "").toLowerCase();
  if (!mime.startsWith("image/")) {
    return { success: false as const, error: "Type de fichier non autorisé." };
  }

  const extFromType =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/jpeg" || mime === "image/jpg"
          ? "jpg"
          : null;
  if (!extFromType) {
    return { success: false as const, error: "Utilisez JPG, PNG ou WebP." };
  }

  const key = `${crypto.randomUUID()}.${extFromType}`;
  const objectPath = `rachat/${key}`;

  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { success: true as const, publicUrl: data.publicUrl, path: objectPath };
}
