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
        title: 'Select an image first',
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
          errorMsg: result.message || 'OCR failed',
          serverMessage: result.engine ? `Engine: ${result.engine}` : ''
        })
        return
      }

      this.setData({
        ocrText: result.text,
        ocrLines: result.lines || [],
        serverMessage: result.message || 'OCR finished'
      })
    } catch (_error) {
      this.setData({
        errorMsg: 'Cannot connect to the local Flask server. Make sure backend is running.'
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
        title: 'Run OCR first',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/editor/editor?imagePath=${encodeURIComponent(imagePath)}&content=${encodeURIComponent(ocrText)}`
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
