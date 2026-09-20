/**
 * Recharts styling driven by the app's semantic tokens, so every chart follows
 * the theme automatically. Kept out of the component file so the component file
 * only exports components.
 */

export const CHART_COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  muted: 'var(--text-muted)',
  grid: 'var(--border)',
}

export const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text)',
}

export const AXIS_TICK = { fontSize: 11, fill: 'var(--text-muted)' }

export const LEGEND_STYLE = { fontSize: 12, color: 'var(--text-muted)' }
