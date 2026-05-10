import {
  SUBJECT_OPTIONS,
  removeMistake,
  searchMistakes,
  toggleMastered,
  type MistakeItem
} from '../../utils/mistake'

interface MistakeCard extends MistakeItem {
  preview: string
  tagsText: string
  displayTime: string
  masteredLabel: string
}

Page({
  data: {
    keyword: '',
    subjectOptions: ['全部', ...SUBJECT_OPTIONS],
    subjectIndex: 0,
    masteredOptions: ['全部', '未掌握', '已掌握'],
    masteredIndex: 0,
    mistakes: <MistakeCard[]>[]
  },

  onShow() {
    this.applyFilters()
  },

  onKeywordInput(e: any) {
    this.setData({
      keyword: e.detail.value
    }, () => {
      this.applyFilters()
    })
  },

  onSubjectChange(e: any) {
    this.setData({
      subjectIndex: Number(e.detail.value)
    }, () => {
      this.applyFilters()
    })
  },

  onMasteredChange(e: any) {
    this.setData({
      masteredIndex: Number(e.detail.value)
    }, () => {
      this.applyFilters()
    })
  },

  applyFilters() {
    const { keyword, subjectOptions, subjectIndex, masteredOptions, masteredIndex } = this.data
    const mistakes = searchMistakes(
      keyword,
      subjectOptions[subjectIndex],
      masteredOptions[masteredIndex]
    ).map((mistake) => this.toMistakeCard(mistake))

    this.setData({ mistakes })
  },

  toMistakeCard(mistake: MistakeItem): MistakeCard {
    return {
      ...mistake,
      preview: mistake.question.replace(/\s+/g, ' ').slice(0, 90),
      tagsText: mistake.tags.length ? mistake.tags.join('、') : '无标签',
      displayTime: this.formatDate(mistake.updatedAt || mistake.createdAt),
      masteredLabel: mistake.mastered ? '已掌握' : '未掌握'
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
      subjectIndex: 0,
      masteredIndex: 0
    }, () => {
      this.applyFilters()
    })
  },

  createMistake() {
    wx.navigateTo({
      url: '/pages/mistake-editor/mistake-editor?mode=manual'
    })
  },

  importFromRecords() {
    wx.navigateTo({
      url: '/pages/mistake-editor/mistake-editor?mode=record'
    })
  },

  createFromPhoto() {
    wx.navigateTo({
      url: '/pages/mistake-editor/mistake-editor?mode=photo'
    })
  },

  openDetail(e: any) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mistake-detail/mistake-detail?id=${id}`
    })
  },

  toggleMastered(e: any) {
    const { id } = e.currentTarget.dataset
    toggleMastered(id)
    this.applyFilters()
  },

  deleteMistake(e: any) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '删除错题',
      content: '删除后无法恢复，确定继续吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        removeMistake(id)
        this.applyFilters()
      }
    })
  }
})
