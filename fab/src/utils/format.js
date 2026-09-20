import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

/**
 * Parse a value that may already be a Date or an ISO string.
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : parseISO(String(value))
  return isValid(date) ? date : null
}

/**
 * @param {string|Date|null|undefined} value
 * @param {string} [pattern] date-fns pattern
 * @returns {string} formatted date, or an em dash when absent
 */
export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = toDate(value)
  return date ? format(date, pattern) : '—'
}

/**
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "3 days ago"
 */
export function formatRelative(value) {
  const date = toDate(value)
  if (!date) return '—'
  return `${formatDistanceToNowStrict(date)} ${date > new Date() ? 'from now' : 'ago'}`
}

/**
 * @param {number|null|undefined} value
 * @param {'USD'|'INR'} [currency]
 * @param {{ compact?: boolean, decimals?: number }} [options]
 * @returns {string}
 */
export function formatCurrency(value, currency = 'USD', options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const { compact = false, decimals = compact ? 1 : 0 } = options
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value))
}

/**
 * @param {number|null|undefined} value
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value))
}

/**
 * @param {number|null|undefined} value already a percentage (0–100)
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Initials for an avatar fallback.
 * @param {string} [name]
 * @returns {string}
 */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Turn SCREAMING_SNAKE_CASE or kebab-case into Title Case.
 * @param {string} [value]
 * @returns {string}
 */
export function titleCase(value = '') {
  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
