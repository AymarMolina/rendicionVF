export const NUT_CATALOG = [
  { energia: 120, grasa: 4, proteina: 6, hierro: 2.1 },
  { energia: 180, grasa: 6, proteina: 10, hierro: 3.0 },
  { energia: 240, grasa: 8, proteina: 14, hierro: 3.8 },
  { energia: 300, grasa: 10, proteina: 18, hierro: 4.6 },
  { energia: 360, grasa: 12, proteina: 22, hierro: 5.4 },
];

export function hashToIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return mod ? h % mod : 0;
}

export function simulatedNutritionForCombo(key: string) {
  const base = NUT_CATALOG[hashToIndex(key, NUT_CATALOG.length)];
  const factor = 0.85 + (hashToIndex(key + "x", 100) / 100) * 0.35;

  return {
    energia: Number((base.energia * factor).toFixed(1)), // kcal
    grasa: Number((base.grasa * factor).toFixed(1)), // g
    proteina: Number((base.proteina * factor).toFixed(1)), // g
    hierro: Number((base.hierro * factor).toFixed(2)), // mg
  };
}
