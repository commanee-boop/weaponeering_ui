import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const analysisRecordsAPI = {
  async list() {
    const response = await client.get('/analysis-records')
    return response.data.records
  },

  async count() {
    const response = await client.get('/analysis-records/count')
    return response.data.count
  },

  async create(record) {
    const response = await client.post('/analysis-records', record, { timeout: 30_000 })
    return response.data.record
  },

  async update(id, record) {
    const response = await client.patch(`/analysis-records/${id}`, record)
    return response.data.record
  },

  async remove(id) {
    await client.delete(`/analysis-records/${id}`)
  },

  subscribe(onChange) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    const events = new EventSource(`${baseUrl}/analysis-records/events`)

    events.addEventListener('changed', event => {
      try {
        onChange(JSON.parse(event.data))
      } catch (error) {
        console.error('Unable to read realtime analysis event', error)
      }
    })

    events.addEventListener('error', error => {
      console.error('Realtime analysis connection interrupted; reconnecting', error)
    })

    return () => events.close()
  },
}
