import { commit, table } from '@/mocks/db'

/** Simulated API latency, per CLAUDE.md. */
const MIN_DELAY = 300
const MAX_DELAY = 600

/** @returns {Promise<void>} */
function latency() {
  const wait = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
  return new Promise((resolve) => setTimeout(resolve, wait))
}

/**
 * Read a possibly nested field: `get(row, 'client.name')`.
 * @param {object} row
 * @param {string} path
 */
function get(row, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), row)
}

/**
 * Case-insensitive "contains" across the given fields.
 * @param {object} row
 * @param {string} term
 * @param {string[]} fields
 */
function matchesSearch(row, term, fields) {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  const haystack = fields.length > 0 ? fields.map((field) => get(row, field)) : Object.values(row)
  return haystack.some((value) => {
    if (value == null) return false
    if (Array.isArray(value)) return value.join(' ').toLowerCase().includes(needle)
    if (typeof value === 'object') return false
    return String(value).toLowerCase().includes(needle)
  })
}

/**
 * Apply one filter value to a row. Arrays mean "any of", `{from,to}` means a
 * range, and everything else is an equality check.
 * @param {object} row
 * @param {string} field
 * @param {unknown} criterion
 */
function matchesFilter(row, field, criterion) {
  if (criterion === undefined || criterion === null || criterion === '') return true
  const value = get(row, field)
  if (Array.isArray(criterion)) {
    if (criterion.length === 0) return true
    return criterion.some((entry) => String(entry) === String(value))
  }
  if (typeof criterion === 'object') {
    if (criterion.from !== undefined && criterion.from !== '' && value < criterion.from) return false
    if (criterion.to !== undefined && criterion.to !== '' && value > criterion.to) return false
    return true
  }
  if (typeof criterion === 'function') return criterion(value, row)
  return String(value) === String(criterion)
}

/**
 * @template T
 * @typedef {Object} ListParams
 * @property {string} [search]
 * @property {Record<string, unknown>} [filters]
 * @property {string} [sortBy]
 * @property {'asc'|'desc'} [sortDir]
 * @property {number} [page] 1-based
 * @property {number} [pageSize] 0 or undefined returns everything
 */

/**
 * Build a mock CRUD service over one collection.
 *
 * Every method returns a promise that resolves after 300–600 ms, mirroring a
 * real API. Mutations persist to localStorage for the session, so swapping this
 * for `fetch` later only means replacing the bodies of these methods.
 *
 * @param {string} collection name of the collection in src/mocks/db.js
 * @param {{idPrefix?: string, searchFields?: string[], defaultSort?: {by: string, dir: 'asc'|'desc'},
 *   decorate?: (row: object, context: {all: Array<object>}) => object}} [options]
 */
export function createService(collection, options = {}) {
  const {
    idPrefix = collection.slice(0, 3).toUpperCase(),
    searchFields = [],
    defaultSort,
    decorate,
  } = options

  /** @returns {Array<object>} a decorated snapshot */
  const snapshot = () => {
    const rows = table(collection)
    return decorate ? rows.map((row) => decorate(row, { all: rows })) : rows
  }

  /** Next id in the collection's own sequence. */
  const nextId = () => {
    const rows = table(collection)
    const numbers = rows
      .map((row) => Number(String(row.id).split('-').pop()))
      .filter((value) => Number.isFinite(value))
    const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
    const width = String(rows[0]?.id ?? '').split('-').pop()?.length ?? 3
    return `${idPrefix}-${String(next).padStart(width, '0')}`
  }

  return {
    collection,

    /**
     * Filter, sort and paginate.
     * @param {ListParams} [params]
     * @returns {Promise<{rows: Array<object>, total: number, page: number, pageSize: number, pageCount: number}>}
     */
    async getAll(params = {}) {
      await latency()
      const { search = '', filters = {}, sortBy, sortDir = 'asc', page = 1, pageSize = 0 } = params

      let rows = snapshot()
      if (search) rows = rows.filter((row) => matchesSearch(row, search, searchFields))
      for (const [field, criterion] of Object.entries(filters)) {
        rows = rows.filter((row) => matchesFilter(row, field, criterion))
      }

      const sortField = sortBy ?? defaultSort?.by
      const direction = sortBy ? sortDir : (defaultSort?.dir ?? 'asc')
      if (sortField) {
        const factor = direction === 'desc' ? -1 : 1
        rows = [...rows].sort((left, right) => {
          const a = get(left, sortField)
          const b = get(right, sortField)
          if (a === b) return 0
          if (a === null || a === undefined) return 1
          if (b === null || b === undefined) return -1
          if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor
          return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor
        })
      }

      const total = rows.length
      const size = pageSize > 0 ? pageSize : total
      const pageCount = size > 0 ? Math.ceil(total / size) : 1
      const current = Math.min(Math.max(1, page), Math.max(1, pageCount))
      const paged = pageSize > 0 ? rows.slice((current - 1) * size, current * size) : rows

      return { rows: paged, total, page: current, pageSize: size, pageCount }
    },

    /**
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async getById(id) {
      await latency()
      return snapshot().find((row) => row.id === id) ?? null
    },

    /**
     * Unpaginated read for charts and dashboards.
     * @param {{filters?: Record<string, unknown>}} [params]
     * @returns {Promise<Array<object>>}
     */
    async list(params = {}) {
      const { rows } = await this.getAll({ ...params, pageSize: 0 })
      return rows
    },

    /**
     * @param {object} values
     * @returns {Promise<object>} the created record
     */
    async create(values) {
      await latency()
      const rows = table(collection)
      const record = {
        id: values.id ?? nextId(),
        ...values,
        createdAt: values.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      commit(collection, [record, ...rows])
      return record
    },

    /**
     * @param {string} id
     * @param {object} patch
     * @returns {Promise<object>} the updated record
     */
    async update(id, patch) {
      await latency()
      const rows = table(collection)
      const index = rows.findIndex((row) => row.id === id)
      if (index === -1) throw new Error(`${collection}: no record with id "${id}"`)
      const updated = { ...rows[index], ...patch, id, updatedAt: new Date().toISOString() }
      const next = [...rows]
      next[index] = updated
      commit(collection, next)
      return updated
    },

    /**
     * @param {string} id
     * @returns {Promise<{id: string}>}
     */
    async remove(id) {
      await latency()
      const rows = table(collection)
      if (!rows.some((row) => row.id === id)) {
        throw new Error(`${collection}: no record with id "${id}"`)
      }
      commit(collection, rows.filter((row) => row.id !== id))
      return { id }
    },

    /**
     * Read without latency — for cross-referencing inside another service.
     * @returns {Array<object>}
     */
    peek() {
      return snapshot()
    },
  }
}
