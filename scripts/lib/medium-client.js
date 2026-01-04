import axios from 'axios'

const MEDIUM_API_BASE = 'https://api.medium.com/v1'

export class MediumClient {
  constructor(token) {
    if (!token) {
      throw new Error('Medium API token is required')
    }
    this.client = axios.create({
      baseURL: MEDIUM_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    })
  }

  async getUser() {
    const response = await this.client.get('/me')
    return response.data.data
  }

  async createPost(authorId, { title, content, contentFormat = 'markdown', canonicalUrl, tags = [], publishStatus = 'draft' }) {
    const post = {
      title,
      contentFormat,
      content,
      canonicalUrl,
      tags: tags.slice(0, 5), // Medium allows max 5 tags
      publishStatus // 'public', 'draft', or 'unlisted'
    }

    const response = await this.client.post(`/users/${authorId}/posts`, post)
    return response.data.data
  }
}
