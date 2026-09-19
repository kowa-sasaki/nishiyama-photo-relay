export function computeResizedDimensions(
  width: number,
  height: number,
  maxSide = 1600,
): { width: number; height: number } {
  if (width <= maxSide && height <= maxSide) {
    return { width, height }
  }
  const scale = maxSide / Math.max(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

export function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export async function resizeAndAnalyzeImage(
  file: File,
  maxSide = 1600,
): Promise<{ blob: Blob; avgColor: string }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = computeResizedDimensions(bitmap.width, bitmap.height, maxSide)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D コンテキストを取得できません')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
  if (!blob) {
    throw new Error('画像の圧縮に失敗しました')
  }

  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = 1
  sampleCanvas.height = 1
  const sampleCtx = sampleCanvas.getContext('2d')
  if (!sampleCtx) {
    throw new Error('Canvas 2D コンテキストを取得できません')
  }
  sampleCtx.drawImage(bitmap, 0, 0, 1, 1)
  const [r, g, b] = sampleCtx.getImageData(0, 0, 1, 1).data
  const avgColor = rgbaToHex(r, g, b)

  return { blob, avgColor }
}
