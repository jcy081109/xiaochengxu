import {
  SUBJECT_OPTIONS,
  createMistake,
  getMistakeById,
  updateMistake
} from '../../utils/mistake'
import { getNotes, type NoteItem } from '../../utils/note'
import { getOcrHistory, saveOcrHistory, type OcrHistoryItem } from '../../utils/ocr-history'
import { uploadImageForOcr } from '../../utils/request'

interface ImportRecordOption {
  id: string
  label: string
  content: string
  source: string
}

interface NoteOption extends NoteItem {
  label: string
}

type ImportField = 'question' | 'answer' | 'analysis'
type CreateMode = 'record' | 'photo' | 'manual'

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
    noteOptions: <NoteOption[]>[],
    importRecordOptions: <ImportRecordOption[]>[],
    recognizingField: '',
    createMode: 'manual' as CreateMode,
    modeTitle: '新增错题',
    modeDesc: '手动填写题目、答案、解析、标签和掌握状态。',
    modeHelpText: '当前只保留手动输入表单，适合直接整理完整错题。',
    isEdit: false
  },

  onLoad(query: Record<string, string>) {
    this.loadImportRecords()
    const createMode = this.resolveCreateMode(query)
    this.setModeText(createMode)
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

    if (createMode === 'photo') {
      setTimeout(() => {
        this.recognizeField('question')
      }, 300)
    }
  },

  resolveCreateMode(query: Record<string, string>): CreateMode {
    if (query.mode === 'record' || query.importFromRecord === '1') {
      return 'record'
    }

    if (query.mode === 'photo' || query.importFromPhoto === '1') {
      return 'photo'
    }

    return 'manual'
  },

  setModeText(createMode: CreateMode) {
    const modeText = {
      record: {
        modeTitle: '从记录创建',
        modeDesc: '从已保存笔记或 OCR 识别结果中选择内容，分别填入题目、答案和解析。',
        modeHelpText: '当前只显示记录导入入口，适合把已有笔记或识别记录拆成错题。'
      },
      photo: {
        modeTitle: '拍照创建',
        modeDesc: '对题目、答案或解析分别拍照识别，也可以手动修正识别结果。',
        modeHelpText: '当前只显示拍照识别入口，适合分别补充题目、答案和解析。'
      },
      manual: {
        modeTitle: '手动创建',
        modeDesc: '手动填写题目、答案、解析、标签和掌握状态。',
        modeHelpText: '当前只保留手动输入表单，适合直接整理完整错题。'
      }
    }[createMode]

    this.setData({
      createMode,
      ...modeText
    })
  },

  loadImportRecords() {
    const noteOptions = getNotes().map((note) => ({
      ...note,
      label: this.buildNoteLabel(note)
    }))
    const noteRecords = noteOptions.map((note) => ({
      id: `note-${note.id}`,
      label: `笔记：${note.label}`,
      content: note.content,
      source: '笔记'
    }))
    const ocrRecords = getOcrHistory().map((record) => ({
      id: `ocr-${record.id}`,
      label: `识别：${this.buildHistoryLabel(record)}`,
      content: record.text,
      source: '识别'
    }))

    this.setData({
      noteOptions,
      importRecordOptions: [...noteRecords, ...ocrRecords]
    })
  },

  buildNoteLabel(note: NoteItem) {
    const preview = note.content.replace(/\s+/g, ' ').slice(0, 18)
    return `${note.title} / ${preview}`
  },

  buildHistoryLabel(record: OcrHistoryItem) {
    const date = new Date(record.createdAt)
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hour = `${date.getHours()}`.padStart(2, '0')
    const minute = `${date.getMinutes()}`.padStart(2, '0')
    const preview = record.text.replace(/\s+/g, ' ').slice(0, 18)
    return `${month}-${day} ${hour}:${minute} ${preview}`
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

  onRecordImportChange(e: any) {
    const index = Number(e.detail.value)
    const field = e.currentTarget.dataset.field as ImportField
    const record = this.data.importRecordOptions[index]

    if (!record) {
      return
    }

    this.fillField(field, record.content)
    wx.showToast({
      title: `已从${record.source}填入`,
      icon: 'success'
    })
  },

  showNoRecordsTip() {
    wx.showToast({
      title: '暂无可导入记录',
      icon: 'none'
    })
  },

  recognizeFieldFromEvent(e: any) {
    const field = e.currentTarget.dataset.field as ImportField
    this.recognizeField(field)
  },

  recognizeField(field: ImportField) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const imagePath = res.tempFiles[0]?.tempFilePath || ''

        if (!imagePath) {
          return
        }

        this.setData({
          recognizingField: field
        })

        try {
          const result = await uploadImageForOcr(imagePath)

          if (!result.success) {
            wx.showToast({
              title: result.message || '识别失败',
              icon: 'none'
            })
            return
          }

          saveOcrHistory(result.text, imagePath)
          this.loadImportRecords()
          this.fillField(field, result.text)
          wx.showToast({
            title: '识别结果已填入',
            icon: 'success'
          })
        } catch (_error) {
          wx.showToast({
            title: '请先启动后端服务',
            icon: 'none'
          })
        } finally {
          this.setData({
            recognizingField: ''
          })
        }
      }
    })
  },

  fillField(field: ImportField, value: string) {
    const text = value.trim()

    if (field === 'question') {
      this.setData({ question: text })
      return
    }

    if (field === 'answer') {
      this.setData({ answer: text })
      return
    }

    this.setData({ analysis: text })
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
