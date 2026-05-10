import { uploadImageForOcr } from '../../utils/request'
import { saveOcrHistory } from '../../utils/ocr-history'

interface FormattedOcrLine {
  id: string
  text: string
  type: 'heading' | 'list' | 'plain'
}

Page({
  recognizing: false,

  data: {
    imagePath: '',
    ocrText: '',
    ocrLines: [] as string[],
    formattedLines: [] as FormattedOcrLine[],
    errorMsg: '',
    serverMessage: ''
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const imagePath = res.tempFiles[0]?.tempFilePath || ''
        this.setData({
          imagePath,
          ocrText: '',
          ocrLines: [],
          formattedLines: [],
          errorMsg: '',
          serverMessage: ''
        })
      }
    })
  },

  async recognizeImage() {
    const { imagePath } = this.data

    if (this.recognizing) {
      return
    }

    if (!imagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.recognizing = true
    wx.showLoading({
      title: '识别中',
      mask: true
    })

    try {
      const result = await uploadImageForOcr(imagePath)

      if (!result.success) {
        this.setData({
          errorMsg: result.message || 'OCR 识别失败',
          serverMessage: result.engine ? `识别引擎：${result.engine}` : '',
          ocrText: '',
          ocrLines: [],
          formattedLines: []
        })
        return
      }

      this.setData({
        ocrText: result.text,
        ocrLines: result.lines || [],
        formattedLines: this.formatOcrLines(result.lines || result.text.split('\n')),
        serverMessage: result.message || 'OCR 识别完成',
        errorMsg: ''
      })
      saveOcrHistory(result.text, imagePath)
    } catch (_error) {
      this.setData({
        errorMsg: '无法连接本地 Flask 服务，请确认后端已经启动。',
        serverMessage: '',
        ocrText: '',
        ocrLines: [],
        formattedLines: []
      })
    } finally {
      this.recognizing = false
      wx.hideLoading()
    }
  },

  formatOcrLines(lines: string[]): FormattedOcrLine[] {
    return lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => ({
        id: `${index}-${line.slice(0, 12)}`,
        text: line,
        type: this.detectLineType(line)
      }))
  },

  detectLineType(line: string): FormattedOcrLine['type'] {
    if (/^第?[一二三四五六七八九十\d]+[、.．)]/.test(line) || /^[A-Za-z][.．、)]/.test(line)) {
      return 'list'
    }

    if (
      line.length <= 24 &&
      (/[:：]$/.test(line) || /^[一二三四五六七八九十\d]+[.．、]/.test(line))
    ) {
      return 'heading'
    }

    return 'plain'
  },

  goToEditor() {
    const { imagePath, ocrText } = this.data

    if (!ocrText.trim()) {
      wx.showToast({
        title: '请先完成识别',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/editor/editor?imagePath=${encodeURIComponent(imagePath)}&content=${encodeURIComponent(ocrText)}`
    })
  },

  goToMistakeEditor() {
    const { ocrText } = this.data

    if (!ocrText.trim()) {
      wx.showToast({
        title: '请先完成识别',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/mistake-editor/mistake-editor?question=${encodeURIComponent(ocrText)}`
    })
  },

  clearResult() {
    this.setData({
      ocrText: '',
      ocrLines: [],
      formattedLines: [],
      errorMsg: '',
      serverMessage: ''
    })
  }
})
