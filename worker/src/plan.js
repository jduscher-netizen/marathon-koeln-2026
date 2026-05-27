// Trainingsplan v2 (Marathon Köln 04.10.2026) — synchronisiert mit App
// Bei Plan-Änderungen hier UND in index.html aktualisieren
export const PLAN_START = Date.UTC(2026, 4, 11); // Mo 11.05.2026 UTC

export const PLAN = [
  { w:1,  ph:"Regeneration",        di:"Ruhe oder 5 km Z1 (6:45)",                      do:"5 km Z1 (6:30)",       fr:"–",                    so:"8 km Z2 (6:10)" },
  { w:2,  ph:"Base I",               di:"6×400m Z5 (4:35) Tp 90s + Ein/Aus",             do:"8 km Z2 (6:05)",       fr:"5 km Z1 (6:40)",       so:"17 km Z2 (6:00)" },
  { w:3,  ph:"Base I",               di:"4×1000m Z4 (4:55) Tp 2min + Ein/Aus",           do:"9 km Z2 (6:00)",       fr:"6 km Z1 (6:40)",       so:"20 km Z2 (5:55)" },
  { w:4,  ph:"Base I",               di:"3×2000m Z4 (5:05) Tp 3min + Ein/Aus",           do:"10 km Z2 (5:55)",      fr:"6 km Z1 (6:40)",       so:"22 km Z2 (5:55)" },
  { w:5,  ph:"Base I · Entlastung",  di:"5×600m Z5 (4:40) Tp 90s + Ein/Aus",             do:"7 km Z2 (6:05)",       fr:"5 km Z1 (6:40)",       so:"14 km Z2 (6:00)" },
  { w:6,  ph:"Base II",              di:"5 km Tempo-DL Z4 (5:15) + Ein/Aus",             do:"10 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"23 km Z2 (5:55)" },
  { w:7,  ph:"Base II",              di:"7 km Tempo-DL Z4 (5:15) + Ein/Aus",             do:"11 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"25 km Z2 (5:55)" },
  { w:8,  ph:"Base II",              di:"5×1500m Z4 (5:00) Tp 2min + Ein/Aus",           do:"11 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"26 km · 6 km MP (5:40) am Ende" },
  { w:9,  ph:"Base II · Entlastung", di:"4×1000m Z4 (4:55) Tp 2min + Ein/Aus",           do:"8 km Z2 (6:00)",       fr:"5 km Z1 (6:40)",       so:"16 km Z2 (5:55)" },
  { w:10, ph:"Build",                di:"10 km Tempo-DL Z4 (5:15) + Ein/Aus",            do:"12 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"24 km · 8 km MP (5:40) am Ende" },
  { w:11, ph:"Build",                di:"4×2000m Z4 (5:00) Tp 2:30 + Ein/Aus",           do:"13 km Z2 (5:55)",      fr:"7 km Z1 (6:35)",       so:"27 km · 10 km MP am Ende" },
  { w:12, ph:"Build",                di:"12 km Tempo-DL Z4 (5:15) + Ein/Aus",            do:"13 km Z2 (5:55)",      fr:"7 km Z1 (6:30)",       so:"30 km reines Z2 (6:00)" },
  { w:13, ph:"Build · Entlastung",   di:"5×1000m Z4 (4:55) Tp 2min + Ein/Aus",           do:"9 km Z2 (6:00)",       fr:"6 km Z1 (6:40)",       so:"18 km Z2 (5:55)" },
  { w:14, ph:"Build",                di:"3×3000m Z4 (5:05) Tp 3min + Ein/Aus",           do:"14 km Z2 (5:55)",      fr:"7 km Z1 (6:30)",       so:"28 km · 12 km MP Mitte" },
  { w:15, ph:"Peak",                 di:"14 km Tempo-DL Z4 (5:15) + Ein/Aus",            do:"14 km Z2 (5:55)",      fr:"7 km Z1 (6:30)",       so:"30 km · 15 km MP am Ende" },
  { w:16, ph:"Peak · Königswoche",   di:"5×2000m Z4 (4:55) Tp 2min + Ein/Aus",           do:"15 km Z2 (5:55)",      fr:"8 km Z1 (6:30)",       so:"32 km Z2 · 8 km MP Mitte" },
  { w:17, ph:"Peak",                 di:"16 km Tempo-DL Z4 (5:15) + Ein/Aus",            do:"14 km Z2 (5:55)",      fr:"7 km Z1 (6:30)",       so:"28 km · 18 km MP am Ende" },
  { w:18, ph:"Peak · Entlastung",    di:"4×1000m Z4 (4:50) Tp 2min + Ein/Aus",           do:"10 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"20 km Z2 (5:55)" },
  { w:19, ph:"Taper",                di:"6 km MP (5:40) + Ein/Aus",                       do:"12 km Z2 (5:55)",      fr:"6 km Z1 (6:35)",       so:"22 km · 8 km MP am Ende" },
  { w:20, ph:"Taper",                di:"4×1000m Z4 (4:55) Tp 2min + Ein/Aus",           do:"10 km Z2 (6:00)",      fr:"5 km Z1 (6:35)",       so:"16 km · 4 km MP" },
  { w:21, ph:"Wettkampf",            di:"5 km Z2 + 4×100m Steigerungen",                  do:"6 km Z1 (6:30)",       fr:"–",                    so:"🏁 04.10. MARATHON KÖLN" },
];
