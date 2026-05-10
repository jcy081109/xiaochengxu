import {
  SUBJECT_OPTIONS,
  createMistake,
  getMistakeById,
  updateMistake
} from '../../utils/mistake'

Page({
  data: {
    mistakeId: '',
    subjectOptions: SUBJECT_OPTIONS,
    subjectIndex: 0,
    question: '',
    answer: '',
    analysis: '',
    tags: '',
    mastered: false,
    isEdit: false
  },

  onLoad(query: Record<string, string>) {
    const mistakeId = query.id ? decodeURIComponent(query.id) : ''

    if (mistakeId) {
      const mistake = getMistakeById(mistakeId)
      if (!mistake) {
        wx.showToast({
          title: '未找到错题',
          icon: 'none'
        })
        return
      }

      const subjectIndex = SUBJECT_OPTIONS.findIndex((item) => item === mistake.subject)
      this.setData({
        mistakeId: mistake.id,
        subjectIndex: subjectIndex >= 0 ? subjectIndex : 0,
        question: mistake.question,
        answer: mistake.answer,
        analysis: mistake.analysis,
        tags: mistake.tags.join(', '),
        mastered: mistake.mastered,
        isEdit: true
      })
      return
    }

    this.setData({
      question: query.question ? decodeURIComponent(query.question) : ''
    })
  },

  onSubjectChange(e: any) {
    this.setData({
      subjectIndex: Number(e.detail.value)
    })
  },

  onQuestionInput(e: any) {
    this.setData({
      question: e.detail.value
    })
  },

  onAnswerInput(e: any) {
    this.setData({
      answer: e.detail.value
    })
  },

  onAnalysisInput(e: any) {
    this.setData({
      analysis: e.detail.value
    })
  },

  onTagsInput(e: any) {
    this.setData({
      tags: e.detail.value
    })
  },

  onMasteredChange(e: any) {
    this.setData({
      mastered: Boolean(e.detail.value)
    })
  },

  saveMistake() {
    const {
      mistakeId,
      subjectOptions,
      subjectIndex,
      question,
      answer,
      analysis,
      tags,
      mastered,
      isEdit
    } = this.data

    if (!question.trim()) {
      wx.showToast({
        title: '请输入题目',
        icon: 'none'
      })
      return
    }

    if (!answer.trim()) {
      wx.showToast({
        title: '请输入答案',
        icon: 'none'
      })
      return
    }

    const payload = {
      subject: subjectOptions[subjectIndex],
      question: question.trim(),
      answer: answer.trim(),
      analysis: analysis.trim(),
      tags,
      mastered
    }

    const mistake = isEdit ? updateMistake(mistakeId, payload) : createMistake(payload)

    if (!mistake) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      return
    }

    wx.showToast({
      title: isEdit ? '已更新' : '已保存',
      icon: 'success'
    })

    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/mistake-detail/mistake-detail?id=${mistake.id}`
      })
    }, 300)
  }
})
