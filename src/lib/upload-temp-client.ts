"use client";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? "通信に失敗しました。");
  return data;
}

/** Upload an image into the temporary storage area (not linked to published job until confirm). */
export async function uploadTempImage(options: {
  file: File;
  uploadType: "top-image" | "store-image" | "recruiter-image" | "shop";
  ownerId: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", options.file);
  formData.append("uploadType", options.uploadType);
  formData.append("jobId", options.ownerId);
  formData.append("temp", "1");

  const data = await readJson<{ imageUrl: string; publicUrl?: string }>(
    await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    }),
  );
  return data.imageUrl || data.publicUrl || "";
}

/** Promote any temp image URLs to permanent storage paths before publish. */
export async function promoteTempImagesInPayload<T extends Record<string, unknown>>(
  payload: T,
): Promise<T> {
  const candidates: string[] = [];
  if (typeof payload.imageUrl === "string" && payload.imageUrl) {
    candidates.push(payload.imageUrl);
  }
  if (typeof payload.recruiterImage === "string" && payload.recruiterImage) {
    candidates.push(payload.recruiterImage);
  }
  if (Array.isArray(payload.storeImages)) {
    for (const url of payload.storeImages) {
      if (typeof url === "string" && url) candidates.push(url);
    }
  }

  if (candidates.length === 0) return payload;

  const { urls } = await readJson<{ urls: Record<string, string> }>(
    await fetch("/api/upload/promote", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: candidates }),
    }),
  );

  const mapUrl = (url: string) => urls[url] ?? url;

  return {
    ...payload,
    ...(typeof payload.imageUrl === "string"
      ? { imageUrl: mapUrl(payload.imageUrl) }
      : {}),
    ...(typeof payload.recruiterImage === "string"
      ? { recruiterImage: mapUrl(payload.recruiterImage) }
      : {}),
    ...(Array.isArray(payload.storeImages)
      ? {
          storeImages: payload.storeImages.map((url) =>
            typeof url === "string" ? mapUrl(url) : url,
          ),
        }
      : {}),
  };
}
