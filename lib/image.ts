/**
 * Client-side image downscaling: keep uploads small for the Gemini call.
 * Turns a picked photo into a base64 data URI (max ~1024px, JPEG q0.8).
 */
export async function fileToDownscaledDataUri(
  file: File,
  maxDim = 1024,
  quality = 0.8
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const isPng = file.type === "image/png";
    return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : quality);
  } finally {
    bitmap.close();
  }
}
