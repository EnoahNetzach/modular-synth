const inRange = (num: number, start: number, end: number) => num >= start && num < end

export default function catenary(x1: number, y1: number, x2: number, y2: number, l: number, n: number) {
  const [r, s, u, v] = x1 < x2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1]

  if (inRange(u, r - 5, r + 5) && inRange(v, s - 5, s + 5)) {
    return [
      [r, s],
      [r, s + l / 2],
      [u, v],
    ]
  }

  if (inRange(u, r - 1, r + 1)) {
    return [
      [r, s],
      [r, Math.max(l, v + (l - (v - s)) / 2)],
      [u, v],
    ]
  }

  // solve for z numerically
  const rhs = Math.sqrt(l ** 2 - (v - s) ** 2) / (u - r)
  let z = 0
  do {
    z += 1e-3
  } while (Math.sinh(z) / z <= rhs)

  // calculate the curve parameters
  const a = (u - r) / 2 / z
  const p = (r + u - a * Math.log((l + v - s) / (l - v + s))) / 2
  const q = (v + s - l / Math.tanh(z)) / 2

  // draw curve from beginning to end
  const d = (u - r) / n

  const mirrored = [
    [r, s],
    ...Array.from({ length: n - 1 }).map((_, i) => {
      const x = r + (i + 1) * d

      return [x, a * Math.cosh((x - p) / a) + q]
    }),
    [u, v],
  ]

  const m = 2 * y1 + (y2 - y1)

  return mirrored.map(([x, y], i) => [mirrored[mirrored.length - 1 - i][0], m - y])
}
