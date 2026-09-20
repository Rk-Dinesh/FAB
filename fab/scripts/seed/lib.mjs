/** Deterministic helpers shared by every seed module. */

/** Everything is generated relative to this date; the app shifts it forward at load. */
export const REFERENCE_DATE = new Date('2026-09-20T00:00:00.000Z')
export const DAY = 24 * 60 * 60 * 1000

/**
 * mulberry32 — small, fast, deterministic PRNG so regenerating the seed is stable.
 * @param {number} seed
 */
export function rng(seed) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    /** @returns {number} integer in [min, max] */
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    /** @returns {number} rounded to `decimals` */
    float: (min, max, decimals = 2) => Number((next() * (max - min) + min).toFixed(decimals)),
    /** @template T @param {T[]} items @returns {T} */
    pick: (items) => items[Math.floor(next() * items.length)],
    /** @template T @param {T[]} items @param {number} count @returns {T[]} */
    sample: (items, count) => {
      const pool = [...items]
      const out = []
      while (out.length < count && pool.length > 0) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
      }
      return out
    },
    /** @returns {boolean} */
    chance: (probability) => next() < probability,
  }
}

/**
 * @param {number} offsetDays days from the reference date (negative = past)
 * @param {number} [hour]
 * @returns {string} ISO timestamp
 */
export function at(offsetDays, hour = 9) {
  const date = new Date(REFERENCE_DATE.getTime() + offsetDays * DAY)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString()
}

/**
 * @param {number} offsetDays
 * @returns {string} YYYY-MM-DD
 */
export function day(offsetDays) {
  return at(offsetDays).slice(0, 10)
}

/** @param {string} prefix @param {number} index @param {number} [width] */
export function id(prefix, index, width = 3) {
  return `${prefix}-${String(index).padStart(width, '0')}`
}

/** @param {number} value @param {number} [decimals] */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** @param {string} value */
export function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
