import {
  NOTE_CATEGORIES,
  buildSuggestedTitle,
  createNote,
  getNoteById,
  updateNote
} from '../../utils/note'

Page({
  data: {
    noteId: '',
    title: '',
    categoryOptions: NOTE_CATEGORIES,
    categoryIndex: 0,
    content: '',
    imagePath: '',
    isEdit: false
  },

  onLoad(query: Record<string, string>) {
    const noteId = query.id ? decodeURIComponent(query.id) : ''

    if (noteId) {
      const note = getNoteById(noteId)
      if (!note) {
        wx.showToast({
          title: 'Note not found',
          icon: 'none'
        })
        return
      }

      const categoryIndex = NOTE_CATEGORIES.findIndex((item) => item === note.category)

      this.setData({
        noteId: note.id,
        title: note.title,
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        content: note.content,
        imagePath: note.imagePath || '',
        isEdit: true
      })
      return
    }

    const content = query.content ? decodeURIComponent(query.content) : ''
    this.setData({
      imagePath: query.imagePath ? decodeURIComponent(query.imagePath) : '',
      content,
      title: buildSuggestedTitle(content)
    })
  },

  onTitleInput(e: any) {
    this.setData({
      title: e.detail.value
    })
  },

  onCategoryChange(e: any) {
    this.setData({
      categoryIndex: Number(e.detail.value)
    })
  },

  onContentInput(e: any) {
    this.setData({
      content: e.detail.value
    })
  },

  saveNote() {
    const { noteId, title, categoryOptions, categoryIndex, content, imagePath, isEdit } = this.data

    if (!title.trim()) {
      wx.showToast({
        title: 'Enter a title',
        icon: 'none'
      })
      return
    }

    if (!content.trim()) {
      wx.showToast({
        title: 'Enter note content',
        icon: 'none'
      })
      return
    }

    const payload = {
      title: title.trim(),
      category: categoryOptions[categoryIndex],
      content: content.trim(),
      imagePath
    }

    const note = isEdit ? updateNote(noteId, payload) : createNote(payload)

    if (!note) {
      wx.showToast({
        title: 'Save failed',
        icon: 'none'
      })
      return
    }

    wx.showToast({
      title: isEdit ? 'Updated' : 'Saved',
      icon: 'success'
    })

    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/note-detail/note-detail?id=${note.id}`
      })
    }, 300)
  }
})
