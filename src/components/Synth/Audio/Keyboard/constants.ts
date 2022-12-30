export const keymap = {
  a: -9,
  w: -8,
  s: -7,
  e: -6,
  d: -5,
  f: -4,
  t: -3,
  g: -2,
  y: -1,
  h: 0,
  u: 1,
  j: 2,
  k: 3,
  o: 4,
  l: 5,
  p: 6,
  ';': 7,
  "'": 8,
}

export function isMappedKey(key: string): key is keyof typeof keymap {
  return Object.keys(keymap).includes(key)
}

export const types = ['mono', 'chord', 'poly']
