import { createServiceRoleClient } from "@/lib/supabase";
import type { PhotoType } from "@/lib/types";

type UploadInput = {
  buffer: Buffer;
  spotId: string;
  type: PhotoType;
  contentType?: string;
};

export function isPhotoType(value: unknown): value is PhotoType {
  return value === "before" || value === "after";
}

export async function uploadSpotPhoto({
  buffer,
  spotId,
  type,
  contentType = "image/jpeg"
}: UploadInput) {
  if (!spotId || !isPhotoType(type) || buffer.byteLength === 0) {
    throw new Error("Invalid upload payload");
  }

  const supabase = createServiceRoleClient();
  const storagePath = `${spotId}/${type}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("spot-photos")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from("spot-photos").getPublicUrl(storagePath);

  const { error: photoError } = await supabase.from("photos").insert({
    spot_id: spotId,
    type,
    storage_path: storagePath,
    public_url: publicUrl
  });

  if (photoError) {
    throw photoError;
  }

  return {
    public_url: publicUrl,
    storage_path: storagePath
  };
}
