/**
 * Turn rows into a CSV string and hand it to the browser as a download.
 * Used by the DataTable export and the reports module.
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = Array.isArray(value) ? value.join('; ') : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * @param {Array<object>} rows
 * @param {Array<{key: string, label: string, value?: (row: object) => unknown}>} columns
 * @returns {string}
 */
export function toCsv(rows, columns) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCell(column.value ? column.value(row) : get(row, column.key)))
      .join(','),
  )
  return [header, ...body].join('\n')
}

/**
 * @param {string} filename
 * @param {string} csv
 */
export function downloadCsv(filename, csv) {
  // Excel needs a UTF-8 BOM to read accented characters correctly.
  const bom = String.fromCharCode(0xfeff)
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * @param {object} row
 * @param {string} path
 */
function get(row, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), row)
}
