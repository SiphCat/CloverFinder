"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialAvatarUrl: string | null;
  /** Smaller avatar for the profile dashboard header. */
  compact?: boolean;
};

const MAX_EDGE = 512;
const JPEG_QUALITY = 0.86;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

async function fileToJpegBlob(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, cw, ch);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress image"));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export function ProfileAvatarPanel({ userId, initialAvatarUrl, compact = false }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);

    try {
      const blob = await fileToJpegBlob(file);
      const supabase = createSupabaseBrowserClient();
      const path = `${userId}/${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg"
      });

      if (upErr) {
        setError(
          upErr.message.includes("Bucket not found") || upErr.message.includes("not found")
            ? "Photo upload needs the avatars bucket. Run supabase/sql/storage_avatars.sql in Supabase."
            : upErr.message
        );
        setBusy(false);
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not signed in");
        setBusy(false);
        return;
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: publicUrl
        }
      });

      if (metaErr) {
        setError(metaErr.message);
        setBusy(false);
        return;
      }

      setUrl(`${publicUrl}?t=${Date.now()}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }

    setBusy(false);
  }

  return (
    <div className={`profile-avatar-panel${compact ? " profile-avatar-panel--compact" : ""}`}>
      <button
        type="button"
        className="profile-avatar-ring"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Upload profile picture"
      >
        {url ? (
          <img src={url} alt="" className="profile-avatar-img" />
        ) : (
          <span className="profile-avatar-placeholder" aria-hidden>
            👤
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="profile-avatar-input"
        onChange={onPick}
      />
      <p className="profile-avatar-hint">{busy ? "Saving…" : "Tap the picture to upload"}</p>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
