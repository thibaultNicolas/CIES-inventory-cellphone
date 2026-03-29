import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const ALLOWED_BUCKETS = new Set(["device-images"]);

function sanitizeFolder(input: string): string {
  // keep only safe path chars, no traversal
  const cleaned = input
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.\.+/g, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return cleaned.replace(/[^a-zA-Z0-9/_-]/g, "");
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") || "");
    const folderRaw = String(formData.get("folder") || "");
    const folder = folderRaw ? sanitizeFolder(folderRaw) : "";

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // browser-image-compression often returns a File named "blob" without an extension.
    // Prefer deriving the extension from the mime-type.
    const mime = (file.type || "").toLowerCase();
    const extFromType =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/jpeg" || mime === "image/jpg"
            ? "jpg"
            : null;

    const extFromNameRaw = file.name.split(".").pop()?.toLowerCase() || "";
    const extFromName = extFromNameRaw.replace(/[^a-z0-9]/g, "");
    const extFromNameSafe =
      extFromName === "jpeg" ? "jpg" : ["jpg", "png", "webp"].includes(extFromName) ? extFromName : null;

    const ext = extFromType || extFromNameSafe || "jpg";
    const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const objectPath = folder ? `${folder}/${key}` : key;

    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return NextResponse.json({ publicUrl: data.publicUrl, path: objectPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
