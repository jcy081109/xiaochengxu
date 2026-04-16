Page({
  goToOcr() {
    wx.navigateTo({
      url: '/pages/ocr/ocr'
    })
  },

  goToNotes() {
    wx.navigateTo({
      url: '/pages/notes/notes'
    })
  },

  goToMistakes() {
    wx.navigateTo({
      url: '/pages/mistakes/mistakes'
    })
  }
})
