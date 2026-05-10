export interface MistakeItem {
  id: string
  subject: string
  question: string
  answer: string
  analysis: string
  tags: string[]
  createdAt: string
  updatedAt?: string
  mastered: boolean
}

export interface SaveMistakeInput {
  subject: string
  question: string
  answer: string
  analysis: string
  tags: string
  mastered: boolean
}

export const SUBJECT_OPTIONS = ['数学', '英语', '物理', '化学', '语文', '其他']

const MISTAKES_STORAGE_KEY = 'study_mistakes'

function normalizeTags(value: string): string[] {
  return value
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

export function getMistakes(): MistakeItem[] {
  const mistakes = wx.getStorageSync(MISTAKES_STORAGE_KEY) || []
  return mistakes.sort((a: MistakeItem, b: MistakeItem) => b.createdAt.localeCompare(a.createdAt))
}

export function getMistakeById(id: string): MistakeItem | undefined {
  return getMistakes().find((mistake) => mistake.id === id)
}

export function saveMistakes(mistakes: MistakeItem[]) {
  wx.setStorageSync(MISTAKES_STORAGE_KEY, mistakes)
}

export function createMistake(input: SaveMistakeInput): MistakeItem {
  const mistake: MistakeItem = {
    id: Date.now().toString(),
    subject: input.subject,
    question: input.question.trim(),
    answer: input.answer.trim(),
    analysis: input.analysis.trim(),
    tags: normalizeTags(input.tags),
    createdAt: new Date().toISOString(),
    mastered: input.mastered
  }

  const mistakes = getMistakes()
  mistakes.unshift(mistake)
  saveMistakes(mistakes)
  return mistake
}

export function updateMistake(id: string, input: SaveMistakeInput): MistakeItem | undefined {
  const mistakes = getMistakes()
  const index = mistakes.findIndex((mistake) => mistake.id === id)

  if (index === -1) {
    return undefined
  }

  const original = mistakes[index]
  const nextMistake: MistakeItem = {
    ...original,
    subject: input.subject,
    question: input.question.trim(),
    answer: input.answer.trim(),
    analysis: input.analysis.trim(),
    tags: normalizeTags(input.tags),
    mastered: input.mastered,
    updatedAt: new Date().toISOString()
  }

  mistakes.splice(index, 1)
  mistakes.unshift(nextMistake)
  saveMistakes(mistakes)
  return nextMistake
}

export function removeMistake(id: string) {
  const mistakes = getMistakes().filter((mistake) => mistake.id !== id)
  saveMistakes(mistakes)
}

export function toggleMastered(id: string): MistakeItem | undefined {
  const mistakes = getMistakes()
  const index = mistakes.findIndex((mistake) => mistake.id === id)

  if (index === -1) {
    return undefined
  }

  const nextMistake: MistakeItem = {
    ...mistakes[index],
    mastered: !mistakes[index].mastered,
    updatedAt: new Date().toISOString()
  }

  mistakes.splice(index, 1, nextMistake)
  saveMistakes(mistakes)
  return nextMistake
}

export function searchMistakes(keyword: string, subject: string, masteredFilter: string): MistakeItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  return getMistakes().filter((mistake) => {
    const subjectMatched = subject === '全部' || mistake.subject === subject
    const masteredMatched =
      masteredFilter === '全部' ||
      (masteredFilter === '已掌握' && mistake.mastered) ||
      (masteredFilter === '未掌握' && !mistake.mastered)
    const keywordMatched =
      !normalizedKeyword ||
      mistake.question.toLowerCase().includes(normalizedKeyword) ||
      mistake.answer.toLowerCase().includes(normalizedKeyword) ||
      mistake.analysis.toLowerCase().includes(normalizedKeyword) ||
      mistake.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))

    return subjectMatched && masteredMatched && keywordMatched
  })
}
