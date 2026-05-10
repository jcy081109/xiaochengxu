import { NOTE_CATEGORIES, removeNote, searchNotes, type NoteItem } from '../../utils/note'

interface NoteCard extends NoteItem {
  preview: string
  displayTime: string
}

Page({
  data: {
    keyword: '',
    categoryOptions: ['全部', ...NOTE_CATEGORIES],
    categoryIndex: 0,
    notes: <NoteCard[]>[]
  },

  onShow() {
    this.loadNotes()
  },

  loadNotes() {
    this.applyFilters()
  },

  onKeywordInput(e: any) {
    this.setData({
      keyword: e.detail.value
    }, () => {
      this.applyFilters()
    })
  },

  onCategoryChange(e: any) {
    this.setData({
      categoryIndex: Number(e.detail.value)
    }, () => {
      this.applyFilters()
    })
  },

  applyFilters() {
    const { keyword, categoryOptions, categoryIndex } = this.data
    const filtered = searchNotes(keyword, categoryOptions[categoryIndex]).map((note) => this.toNoteCard(note))
    this.setData({
      notes: filtered
    })
  },

  toNoteCard(note: NoteItem): NoteCard {
    return {
      ...note,
      preview: note.content.replace(/\s+/g, ' ').slice(0, 80),
      displayTime: this.formatDate(note.updatedAt || note.createdAt)
    }
  },

  formatDate(value: string) {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hour = `${date.getHours()}`.padStart(2, '0')
    const minute = `${date.getMinutes()}`.padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  clearFilters() {
    this.setData({
      keyword: '',
      categoryIndex: 0
    }, () => {
      this.applyFilters()
    })
  },

  createManualNote() {
    wx.navigateTo({
      url: '/pages/editor/editor'
    })
  },

  openDetail(e: any) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/note-detail/note-detail?id=${id}`
    })
  },

  deleteNote(e: any) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '删除笔记',
      content: '删除后无法恢复，确定继续吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        removeNote(id)
        this.loadNotes()
      }
    })
  }
})
