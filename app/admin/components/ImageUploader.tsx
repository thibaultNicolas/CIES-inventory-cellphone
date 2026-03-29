"use client";

import { useState } from "react";
import { compressImage } from "@/lib/image-compression";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

type ImageUploaderProps = {
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  bucket: "device-images";
  folder?: string;
  accept?: string;
};

export function ImageUploader({
  currentImageUrl,
  onImageChange,
  bucket,
  folder = "",
  accept = "image/*",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress the image before upload
      setUploadProgress(5);
      const compressedFile = await compressImage(file);
      setUploadProgress(10);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          // Progress from 10% to 90% during upload
          return Math.min(prev + 8, 90);
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", bucket);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }

      setUploadProgress(100);
      const payload = (await res.json()) as { publicUrl: string };
      onImageChange(payload.publicUrl);
      // Keep preview stable even if parent doesn't rerender immediately.
      setPreviewUrl(payload.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erreur lors de l'upload de l'image. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleFileUpload(file);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-2">
      {displayUrl ? (
        <div className="relative group">
          <div className="relative h-32 w-32 overflow-hidden rounded-card border border-foreground/10 bg-background">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Allow replacing without removing first */}
            <input
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isUploading}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground">
                Changer
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative h-32 w-32 rounded-card border-2 border-dashed border-brand-primary/30 bg-background p-4 text-center transition-all hover:border-brand-primary hover:bg-brand-primary/5"
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Upload className="h-6 w-6 text-brand-primary" />
              </motion.div>
              <span className="mt-2 text-xs text-foreground/60">{uploadProgress}%</span>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <ImageIcon className="h-6 w-6 text-foreground/40" />
              <span className="mt-2 text-xs text-foreground/50">Cliquez ou glissez</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Ou entrez une URL"
          defaultValue={currentImageUrl || ""}
          onChange={(e) => {
            const url = e.target.value.trim();
            setPreviewUrl(url || null);
            onImageChange(url || null);
          }}
          className="flex-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-3 py-2 text-xs text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
        />
      </div>
    </div>
  );
}
