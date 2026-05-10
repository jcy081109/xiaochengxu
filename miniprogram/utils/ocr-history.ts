export interface OcrHistoryItem {
  id: string
  text: string
  imagePath?: string
  createdAt: string
}

const OCR_HISTORY_STORAGE_KEY = 'ocr_history_records'
const MAX_HISTORY_COUNT = 30

export function getOcrHistory(): OcrHistoryItem[] {
  const records = wx.getStorageSync(OCR_HISTORY_STORAGE_KEY) || []
  return records.sort((a: OcrHistoryItem, b: OcrHistoryItem) => b.createdAt.localeCompare(a.createdAt))
}

export function saveOcrHistory(text: string, imagePath?: string): OcrHistoryItem | undefined {
  const normalizedText = text.trim()

  if (!normalizedText) {
    return undefined
  }

  const record: OcrHistoryItem = {
    id: Date.now().toString(),
    text: normalizedText,
    imagePath,
    createdAt: new Date().toISOString()
  }

  const records = getOcrHistory()
    .filter((item) => item.text !== normalizedText)
    .slice(0, MAX_HISTORY_COUNT - 1)

  wx.setStorageSync(OCR_HISTORY_STORAGE_KEY, [record, ...records])
  return record
}

