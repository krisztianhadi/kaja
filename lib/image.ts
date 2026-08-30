/**
 * Client-side image downscaling: keep uploads small for the Gemini call.
 * Turns a picked photo into a base64 data URI (max ~1024px, JPEG q0.8).
 *
 * Phone photos are often 8-12MB and HEIC/PNG compress poorly, so if the
 * first encode is still too big it steps down quality and then dimensions
 * until the data URI fits the budget (well under the server's 4MB cap).
 */
const URI_BUDGET = 1.5 * 1024 * 1024; // chars of base64 data URI

function render(
  bitmap: ImageBitmap,
  maxDim: number,
  type: string,
  quality?: number
): string {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL(type, quality);
}

export async function fileToDownscaledDataUri(
  file: File,
  maxDim = 1024,
  quality = 0.8
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    // 1) downscale to maxDim, keep the file's format (photos: jpeg q0.8)
    let uri = render(
      bitmap,
      maxDim,
      file.type === "image/png" ? "image/png" : "image/jpeg",
      file.type === "image/png" ? undefined : quality
    );
    if (uri.length <= URI_BUDGET) return uri;

    // 2) same size, drop the jpeg quality
    for (const q of [0.7, 0.6, 0.5, 0.4]) {
      uri = render(bitmap, maxDim, "image/jpeg", q);
      if (uri.length <= URI_BUDGET) return uri;
    }

    // 3) smaller canvas + lower quality as a last resort
    for (const dim of [768, 640, 512, 384]) {
      for (const q of [0.6, 0.5]) {
        uri = render(bitmap, dim, "image/jpeg", q);
        if (uri.length <= URI_BUDGET) return uri;
      }
    }

    return uri; // best effort
  } finally {
    bitmap.close();
  }
}
