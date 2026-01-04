import axios from 'axios'

const GITHUB_API_BASE = 'https://api.github.com'

export class GitHubGistClient {
  constructor(token) {
    this.token = token
    this.client = axios.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  /**
   * Create a Gist from table data
   * @param {string} filename - Filename (should end in .csv)
   * @param {string} content - CSV content
   * @param {string} description - Optional description
   * @returns {Promise<{url: string, rawUrl: string}>}
   */
  async createGist(filename, content, description = '') {
    const response = await this.client.post('/gists', {
      description,
      public: true,
      files: {
        [filename]: {
          content
        }
      }
    })

    return {
      url: response.data.html_url,
      rawUrl: response.data.files[filename].raw_url
    }
  }
}

/**
 * Convert markdown table to CSV format
 * @param {string} headerRow - Pipe-separated header row
 * @param {string} bodyRows - Pipe-separated body rows
 * @returns {string} CSV content
 */
export function markdownTableToCSV(headerRow, bodyRows) {
  // Parse headers
  const headers = headerRow.split('|').map(h => h.trim()).filter(h => h)

  // Parse body rows
  const rows = bodyRows.trim().split('\n').map(row => {
    return row.split('|').map(cell => cell.trim()).filter(cell => cell)
  })

  // Build CSV
  const csvLines = []

  // Header row
  csvLines.push(headers.map(h => escapeCSV(h)).join(','))

  // Data rows
  for (const row of rows) {
    csvLines.push(row.map(cell => escapeCSV(cell)).join(','))
  }

  return csvLines.join('\n')
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
