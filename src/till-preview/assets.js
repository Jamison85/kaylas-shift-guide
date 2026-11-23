const base = `${import.meta.env.BASE_URL}till-preview/art/`;
export const office = base + "office_overhead.webp";
export const art = Object.fromEntries(Object.entries({
  working: "01_working", notices: "02_notices_viewer", shock: "03_booming_voice",
  badge: "04_introducing", explain: "05_explaining", dodge: "06_boxes_falling", recovery: "07_recovery",
  uneasy: "08_uneasy", anticipation: "09_anticipation", wave: "10_wave", cleanWave: "11_wave_clean",
  closed: "box_closed", open: "box_open_peanuts", peanut: "peanut", clipboard: "clipboard",
}).map(([key, file]) => [key, base + file + ".webp"]));

let loading;
export function loadArt() {
  loading ??= Promise.all(Object.entries({ office, ...art }).map(async ([key, src]) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return [key, image];
  })).then(Object.fromEntries).catch(error => { loading = undefined; throw error; });
  return loading;
}
