import { promises as fs } from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class ConfigLoader {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '..', 'tunes-config.yaml')
    this.config = null
  }

  async load() {
    try {
      const fileContents = await fs.readFile(this.configPath, 'utf8')
      this.config = yaml.load(fileContents)
      return this.config
    } catch (error) {
      console.error(`Error loading config: ${error.message}`)
      throw error
    }
  }

  get settings() {
    return this.config?.settings || {}
  }

  get prompts() {
    return this.config?.prompts || {}
  }

  getNumberOfItems() {
    return this.settings.number_of_items || 11
  }

  getCoverImageRange() {
    return {
      min: this.settings.cover_image_min || 1,
      max: this.settings.cover_image_max || 23
    }
  }

  getTitlePrompt(context) {
    const prompt = this.prompts.title
    if (!prompt) return ''

    const instruction = this.interpolate(prompt.instruction, context)
    return `${prompt.system}\n\n${instruction}`
  }

  getSummaryPrompt(context) {
    const prompt = this.prompts.summary
    if (!prompt) return ''

    const instruction = this.interpolate(prompt.instruction, context)
    return `${prompt.system}\n\n${instruction}`
  }

  getAlbumResearchPrompt(context) {
    const prompt = this.prompts.album_research
    if (!prompt) return ''

    const instruction = this.interpolate(prompt.instruction, context)
    return `${prompt.system}\n\n${instruction}`
  }

  interpolate(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match
    })
  }
}
