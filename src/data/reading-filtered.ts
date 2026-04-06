import rawData from './reading.json'

const CUTOFF = '2026-01-01T00:00:00.000Z'

const readingData = rawData.filter((item: any) => item.time >= CUTOFF)

export default readingData
