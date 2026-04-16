export const API_BASE_URL = 'http://127.0.0.1:5000'

export interface OcrResponse {
  success: boolean
  text: string
  lines: string[]
  message: string
  engine?: string
}

export function buildApiUrl(path: string) {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`
  }

  return `${API_BASE_URL}${path}`
}

export function uploadImageForOcr(filePath: string): Promise<OcrResponse> {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: buildApiUrl('/ocr'),
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data) as OcrResponse
          resolve(data)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}
