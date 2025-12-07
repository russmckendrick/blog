/**
 * SVG Chart Generator for Year Wrapped posts
 * Generates beautiful SVG charts as separate files for MDX embedding
 */

import { promises as fs } from 'fs'
import path from 'path'

// Color palette inspired by modern data visualization
const COLORS = {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Violet
  accent: '#ec4899',     // Pink
  success: '#10b981',    // Emerald
  warning: '#f59e0b',    // Amber
  info: '#3b82f6',       // Blue
  muted: '#64748b',      // Slate
  // Gradient palette for bars
  palette: [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308'
  ]
}

/**
 * Save an SVG chart to a file and return the public path
 * @param {string} svg - The SVG content
 * @param {string} filename - The filename (without path)
 * @param {string} outputDir - The output directory (public/assets/...)
 * @returns {Promise<string>} The public URL path to the saved SVG
 */
export async function saveSvgChart(svg, filename, outputDir) {
  await fs.mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, filename)
  await fs.writeFile(filePath, svg)
  // Return the public URL path (strip "public" from the beginning)
  const publicPath = filePath.replace(/^.*public/, '')
  return publicPath
}

/**
 * Generate a horizontal bar chart SVG for genre breakdown
 * @param {Array} data - Array of {genre, plays, percentage} objects
 * @param {Object} options - Chart options
 * @returns {string} SVG markup
 */
export function generateGenreBarChart(data, options = {}) {
  const {
    width = 600,
    barHeight = 32,
    padding = 20,
    labelWidth = 140,
    showValues = true,
    darkModeSupport = true
  } = options

  const chartHeight = data.length * (barHeight + 10) + padding * 2
  const maxPercentage = Math.max(...data.map(d => d.percentage))
  const barAreaWidth = width - labelWidth - padding * 2 - 80 // Leave space for value labels

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${chartHeight}" class="genre-chart">`

  // Add style for dark mode support
  if (darkModeSupport) {
    svg += `
  <style>
    .genre-chart text.label { fill: #374151; }
    .genre-chart text.value { fill: #6b7280; }
    .genre-chart rect.bar-bg { fill: #e5e7eb; }
    @media (prefers-color-scheme: dark) {
      .genre-chart text.label { fill: #e5e7eb; }
      .genre-chart text.value { fill: #9ca3af; }
      .genre-chart rect.bar-bg { fill: #374151; }
    }
    .dark .genre-chart text.label { fill: #e5e7eb; }
    .dark .genre-chart text.value { fill: #9ca3af; }
    .dark .genre-chart rect.bar-bg { fill: #374151; }
  </style>`
  }

  data.forEach((item, index) => {
    const y = padding + index * (barHeight + 10)
    const barWidth = (item.percentage / maxPercentage) * barAreaWidth
    const color = COLORS.palette[index % COLORS.palette.length]

    // Genre label
    svg += `
  <text x="${padding}" y="${y + barHeight / 2 + 5}" class="label" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500">${escapeXml(item.genre)}</text>`

    // Background bar
    svg += `
  <rect class="bar-bg" x="${labelWidth + padding}" y="${y}" width="${barAreaWidth}" height="${barHeight}" rx="4" />`

    // Value bar with gradient
    svg += `
  <rect x="${labelWidth + padding}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" opacity="0.9">
    <animate attributeName="width" from="0" to="${barWidth}" dur="0.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </rect>`

    // Value label
    if (showValues) {
      svg += `
  <text x="${labelWidth + padding + barAreaWidth + 10}" y="${y + barHeight / 2 + 5}" class="value" font-family="system-ui, -apple-system, sans-serif" font-size="12">${item.percentage}%</text>`
    }
  })

  svg += '\n</svg>'
  return svg
}

/**
 * Generate a monthly activity chart (sparkline-style bar chart)
 * @param {Array} data - Array of {month, plays, isAboveAverage} objects
 * @param {Object} options - Chart options
 * @returns {string} SVG markup
 */
export function generateMonthlyChart(data, options = {}) {
  const {
    width = 700,
    height = 200,
    padding = 40,
    barGap = 8,
    darkModeSupport = true
  } = options

  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const barWidth = (chartWidth - (data.length - 1) * barGap) / data.length
  const maxPlays = Math.max(...data.map(d => d.plays))

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="monthly-chart">`

  // Add style for dark mode support
  if (darkModeSupport) {
    svg += `
  <style>
    .monthly-chart text.month-label { fill: #6b7280; }
    .monthly-chart text.value-label { fill: #374151; }
    .monthly-chart line.grid { stroke: #e5e7eb; }
    @media (prefers-color-scheme: dark) {
      .monthly-chart text.month-label { fill: #9ca3af; }
      .monthly-chart text.value-label { fill: #e5e7eb; }
      .monthly-chart line.grid { stroke: #374151; }
    }
    .dark .monthly-chart text.month-label { fill: #9ca3af; }
    .dark .monthly-chart text.value-label { fill: #e5e7eb; }
    .dark .monthly-chart line.grid { stroke: #374151; }
  </style>`
  }

  // Draw grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i
    svg += `
  <line class="grid" x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>`
  }

  data.forEach((item, index) => {
    const x = padding + index * (barWidth + barGap)
    const barHeightPx = (item.plays / maxPlays) * chartHeight
    const y = padding + chartHeight - barHeightPx

    // Determine bar color based on performance
    const color = item.isAboveAverage ? COLORS.success : COLORS.primary

    // Bar
    svg += `
  <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeightPx}" rx="3" fill="${color}" opacity="0.85">
    <animate attributeName="height" from="0" to="${barHeightPx}" dur="0.4s" fill="freeze" begin="${index * 0.05}s" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    <animate attributeName="y" from="${padding + chartHeight}" to="${y}" dur="0.4s" fill="freeze" begin="${index * 0.05}s" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </rect>`

    // Month label
    const monthAbbrev = item.month.substring(0, 3)
    svg += `
  <text class="month-label" x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11">${monthAbbrev}</text>`

    // Value on hover (title element for tooltip)
    svg += `
  <title>${item.month}: ${item.plays.toLocaleString()} plays</title>`
  })

  svg += '\n</svg>'
  return svg
}

/**
 * Generate a decade distribution donut chart
 * @param {Array} data - Array of {decade, plays, percentage} objects
 * @param {Object} options - Chart options
 * @returns {string} SVG markup
 */
export function generateDecadeDonut(data, options = {}) {
  const {
    size = 300,
    innerRadius = 60,
    outerRadius = 100,
    darkModeSupport = true
  } = options

  const centerX = size / 2
  const centerY = size / 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" class="decade-chart">`

  // Add style for dark mode support
  if (darkModeSupport) {
    svg += `
  <style>
    .decade-chart text.center-label { fill: #374151; }
    .decade-chart text.center-value { fill: #111827; }
    @media (prefers-color-scheme: dark) {
      .decade-chart text.center-label { fill: #e5e7eb; }
      .decade-chart text.center-value { fill: #f9fafb; }
    }
    .dark .decade-chart text.center-label { fill: #e5e7eb; }
    .dark .decade-chart text.center-value { fill: #f9fafb; }
  </style>`
  }

  // Calculate total for percentage
  const total = data.reduce((sum, d) => sum + d.plays, 0)

  let currentAngle = -90 // Start at top

  data.slice(0, 6).forEach((item, index) => {
    const percentage = (item.plays / total) * 100
    const angle = (percentage / 100) * 360
    const color = COLORS.palette[index % COLORS.palette.length]

    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const path = describeArc(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle)

    svg += `
  <path d="${path}" fill="${color}" opacity="0.9">
    <title>${item.decade}s: ${item.plays.toLocaleString()} plays (${percentage.toFixed(1)}%)</title>
  </path>`

    currentAngle = endAngle
  })

  // Center text
  const topDecade = data[0]
  svg += `
  <text class="center-value" x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700">${topDecade.decade}s</text>
  <text class="center-label" x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12">Top Decade</text>`

  svg += '\n</svg>'
  return svg
}

/**
 * Generate a simple stats card SVG
 * @param {Object} stats - Stats object with values
 * @returns {string} SVG markup
 */
export function generateStatsCard(stats, options = {}) {
  const {
    width = 600,
    darkModeSupport = true
  } = options

  const height = 120
  const itemWidth = width / 4

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="stats-card">`

  if (darkModeSupport) {
    svg += `
  <style>
    .stats-card text.stat-value { fill: #111827; }
    .stats-card text.stat-label { fill: #6b7280; }
    .stats-card rect.card-bg { fill: #f9fafb; }
    @media (prefers-color-scheme: dark) {
      .stats-card text.stat-value { fill: #f9fafb; }
      .stats-card text.stat-label { fill: #9ca3af; }
      .stats-card rect.card-bg { fill: #1f2937; }
    }
    .dark .stats-card text.stat-value { fill: #f9fafb; }
    .dark .stats-card text.stat-label { fill: #9ca3af; }
    .dark .stats-card rect.card-bg { fill: #1f2937; }
  </style>`
  }

  // Background
  svg += `
  <rect class="card-bg" x="0" y="0" width="${width}" height="${height}" rx="8" />`

  const items = [
    { label: 'Scrobbles', value: stats.totalScrobbles.toLocaleString(), icon: '🎵' },
    { label: 'Hours', value: stats.estimatedHours.toLocaleString(), icon: '⏱️' },
    { label: 'Artists', value: stats.uniqueArtists.toString(), icon: '🎤' },
    { label: 'Albums', value: stats.uniqueAlbums.toString(), icon: '💿' }
  ]

  items.forEach((item, index) => {
    const x = itemWidth * index + itemWidth / 2
    svg += `
  <text x="${x}" y="45" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28">${item.icon}</text>
  <text class="stat-value" x="${x}" y="75" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">${item.value}</text>
  <text class="stat-label" x="${x}" y="95" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11">${item.label}</text>`
  })

  svg += '\n</svg>'
  return svg
}

// Helper function to describe an arc path for donut chart
function describeArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle)
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle)
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ')
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
