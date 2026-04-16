import { getNoteById, removeNote, type NoteItem } from '../../utils/note'

Page({
  data: {
    noteId: '',
    note: null as NoteItem | null,
    displayTime: ''
  },

  onLoad(query: Record<string, string>) {
    const noteId = query.id ? decodeURIComponent(query.id) : ''
    this.setData({ noteId })
    this.loadNote()
  },

  onShow() {
    this.loadNote()
  },

  loadNote() {
    const { noteId } = this.data
    const note = noteId ? getNoteById(noteId) || null : null
    this.setData({
      note,
      displayTime: note ? this.formatDate(note.updatedAt || note.createdAt) : ''
    })
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

  editNote() {
    const { noteId } = this.data
    if (!noteId) {
      return
    }

    wx.navigateTo({
      url: `/pages/editor/editor?id=${encodeURIComponent(noteId)}`
    })
  },

  deleteNote() {
    const { note } = this.data

    if (!note) {
      return
    }

    wx.showModal({
      title: 'Delete Note',
      content: 'This note cannot be recovered after deletion. Continue?',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        removeNote(note.id)
        wx.redirectTo({
          url: '/pages/notes/notes'
        })
      }
    })
  }
})
