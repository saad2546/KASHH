// Simple, deterministic mock forecast generator
// Supports timeframes: "24h" (hourly), "72h" (hourly), "7d" (daily)

function randNoise(scale = 5, seed = 1) {
  // small deterministic pseudo noise
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * scale - scale / 2;
}

export default function getForecast(timeframe = "24h") {
  const now = new Date();
  const data = [];
  if (timeframe === "7d") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i + 1);
      // base patterns: admissions a bit higher in day 2-4
      const baseAdmissions = 50 + 8 * Math.sin((i / 7) * Math.PI * 2) + randNoise(6, i + 1);
      const baseDischarges = 40 + 6 * Math.cos((i / 7) * Math.PI * 2) + randNoise(6, i + 11);
      data.push({ time: d.toISOString(), admissions: Math.max(0, baseAdmissions), discharges: Math.max(0, baseDischarges) });
    }
  } else if (timeframe === "72h") {
    for (let i = 0; i < 72; i++) {
      const d = new Date(now);
      d.setHours(now.getHours() + i + 1);
      // simulate diurnal pattern: more admissions during daytime
      const hour = d.getHours();
      const dayFactor = 10 * Math.max(0, Math.sin(((hour - 6) / 24) * Math.PI * 2));
      const baseAdmissions = 5 + dayFactor + 2 * Math.sin((i / 24) * Math.PI) + randNoise(2, i + 31);
      const baseDischarges = 4 + dayFactor * 0.9 + 1.5 * Math.cos((i / 18) * Math.PI) + randNoise(2, i + 61);
      data.push({ time: d.toISOString(), admissions: Math.max(0, baseAdmissions * 5), discharges: Math.max(0, baseDischarges * 5) });
    }
  } else {
    // default 24h
    for (let i = 0; i < 24; i++) {
      const d = new Date(now);
      d.setHours(now.getHours() + i + 1);
      const hour = d.getHours();
      const dayFactor = 8 * Math.max(0, Math.sin(((hour - 6) / 24) * Math.PI * 2));
      const baseAdmissions = 6 + dayFactor + randNoise(1.5, i + 101);
      const baseDischarges = 5 + dayFactor * 0.9 + randNoise(1.5, i + 201);
      data.push({ time: d.toISOString(), admissions: Math.max(0, baseAdmissions * 6), discharges: Math.max(0, baseDischarges * 6) });
    }
  }
  return data;
}
