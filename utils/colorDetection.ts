// utils/colorDetection.ts
export type VulnerabilityLevel = 1 | 2 | 3 | 4 | 5

// Warna referensi dari skala Anda
const VULNERABILITY_COLOR_SCALE: Record<VulnerabilityLevel, {
  min: [number, number, number], // RGB min
  max: [number, number, number]  // RGB max
}> = {
  1: { min: [200, 230, 200], max: [180, 220, 180] }, // Hijau muda
  2: { min: [220, 230, 160], max: [200, 210, 140] }, // Kuning kehijauan
  3: { min: [255, 230, 100], max: [240, 210, 80] },  // Kuning
  4: { min: [255, 180, 80], max: [240, 160, 60] },   // Oranye
  5: { min: [255, 100, 80], max: [230, 80, 60] }     // Merah
}

export function detectVulnerabilityLevelFromColor(
  pixelColor: [number, number, number]
): VulnerabilityLevel | null {
  const [r, g, b] = pixelColor
  
  // Cek setiap level
  for (const [level, range] of Object.entries(VULNERABILITY_COLOR_SCALE)) {
    const levelNum = parseInt(level) as VulnerabilityLevel
    const { min, max } = range
    
    if (
      r >= min[0] && r <= max[0] &&
      g >= min[1] && g <= max[1] &&
      b >= min[2] && b <= max[2]
    ) {
      return levelNum
    }
  }
  
  return null // Tidak terdeteksi
}