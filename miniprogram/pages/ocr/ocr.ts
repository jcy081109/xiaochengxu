import { uploadImageForOcr } from '../../utils/request'

Page({
  data: {
    imagePath: '',
    ocrText: '',
    ocrLines: [] as string[],
    loading: false,
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
          errorMsg: '',
          serverMessage: ''
        })
      }
    })
  },

  async recognizeImage() {
    const { imagePath } = this.data

    if (!imagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.setData({
      loading: true,
      errorMsg: '',
      serverMessage: '',
      ocrText: '',
      ocrLines: []
    })

    try {
      const result = await uploadImageForOcr(imagePath)

      if (!result.success) {
        this.setData({
          errorMsg: result.message || 'OCR 识别失败',
          serverMessage: result.engine ? `识别引擎：${result.engine}` : ''
        })
        return
      }

      this.setData({
        ocrText: result.text,
        ocrLines: result.lines || [],
        serverMessage: result.message || 'OCR 识别完成'
      })
    } catch (_error) {
      this.setData({
        errorMsg: '无法连接本地 Flask 服务，请确认后端已经启动。'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
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
      errorMsg: '',
      serverMessage: ''
    })
  }
})
