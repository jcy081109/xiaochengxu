import { getMistakeById, removeMistake, toggleMastered, type MistakeItem } from '../../utils/mistake'

Page({
  data: {
    mistakeId: '',
    mistake: null as MistakeItem | null,
    displayTime: '',
    tagsText: '',
    masteredLabel: ''
  },

  onLoad(query: Record<string, string>) {
    const mistakeId = query.id ? decodeURIComponent(query.id) : ''
    this.setData({ mistakeId })
    this.loadMistake()
  },

  onShow() {
    this.loadMistake()
  },

  loadMistake() {
    const { mistakeId } = this.data
    const mistake = mistakeId ? getMistakeById(mistakeId) || null : null

    this.setData({
      mistake,
      displayTime: mistake ? this.formatDate(mistake.updatedAt || mistake.createdAt) : '',
      tagsText: mistake && mistake.tags.length ? mistake.tags.join('、') : '无标签',
      masteredLabel: mistake && mistake.mastered ? '已掌握' : '未掌握'
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

  editMistake() {
    const { mistakeId } = this.data
    if (!mistakeId) {
      return
    }

    wx.navigateTo({
      url: `/pages/mistake-editor/mistake-editor?id=${encodeURIComponent(mistakeId)}`
    })
  },

  toggleMastered() {
    const { mistakeId } = this.data
    if (!mistakeId) {
      return
    }

    toggleMastered(mistakeId)
    this.loadMistake()
  },

  deleteMistake() {
    const { mistake } = this.data

    if (!mistake) {
      return
    }

    wx.showModal({
      title: '删除错题',
      content: '删除后无法恢复，确定继续吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        removeMistake(mistake.id)
        wx.redirectTo({
          url: '/pages/mistakes/mistakes'
        })
      }
    })
  }
})
