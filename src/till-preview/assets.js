const base = `${import.meta.env.BASE_URL}till-preview/art/`;
export const office = base + "office_empty_approved.webp";
export const art = Object.fromEntries(Object.entries({
  working: "01_working", notices: "02_notices_viewer", shock: "03_booming_voice",
  badge: "04_introducing", explain: "05_explaining", dodge: "06_boxes_falling", recovery: "07_recovery",
  left: "box_left", center: "box_center", right: "box_right", upright: "box_right_rest", open: "box_open_peanuts", peanut: "peanut",
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
