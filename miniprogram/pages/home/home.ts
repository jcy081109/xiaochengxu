import { getMistakes } from '../../utils/mistake'
import { getNotes } from '../../utils/note'
import { getOcrHistory } from '../../utils/ocr-history'

Page({
  data: {
    noteCount: 0,
    mistakeCount: 0,
    openMistakeCount: 0,
    historyCount: 0
  },

  onShow() {
    const notes = getNotes()
    const mistakes = getMistakes()
    const histories = getOcrHistory()

    this.setData({
      noteCount: notes.length,
      mistakeCount: mistakes.length,
      openMistakeCount: mistakes.filter((item) => !item.mastered).length,
      historyCount: histories.length
    })
  },

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
