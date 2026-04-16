export interface NoteItem {
  id: string
  title: string
  category: string
  content: string
  imagePath?: string
  createdAt: string
  updatedAt?: string
}

export interface SaveNoteInput {
  title: string
  category: string
  content: string
  imagePath?: string
}

export const NOTE_CATEGORIES = ['Class Notes', 'Knowledge', 'Reading', 'Lab', 'Other']

const NOTES_STORAGE_KEY = 'notebook_notes'

export function getNotes(): NoteItem[] {
  const notes = wx.getStorageSync(NOTES_STORAGE_KEY) || []
  return notes.sort((a: NoteItem, b: NoteItem) => b.createdAt.localeCompare(a.createdAt))
}

export function getNoteById(id: string): NoteItem | undefined {
  return getNotes().find((note) => note.id === id)
}

export function saveNotes(notes: NoteItem[]) {
  wx.setStorageSync(NOTES_STORAGE_KEY, notes)
}

export function createNote(input: SaveNoteInput): NoteItem {
  const note: NoteItem = {
    id: Date.now().toString(),
    title: input.title.trim(),
    category: input.category,
    content: input.content.trim(),
    imagePath: input.imagePath,
    createdAt: new Date().toISOString()
  }

  const notes = getNotes()
  notes.unshift(note)
  saveNotes(notes)
  return note
}

export function updateNote(id: string, input: SaveNoteInput): NoteItem | undefined {
  const notes = getNotes()
  const index = notes.findIndex((note) => note.id === id)

  if (index === -1) {
    return undefined
  }

  const original = notes[index]
  const nextNote: NoteItem = {
    ...original,
    title: input.title.trim(),
    category: input.category,
    content: input.content.trim(),
    imagePath: input.imagePath || original.imagePath,
    updatedAt: new Date().toISOString()
  }

  notes.splice(index, 1)
  notes.unshift(nextNote)
  saveNotes(notes)
  return nextNote
}

export function removeNote(id: string) {
  const notes = getNotes().filter((note) => note.id !== id)
  saveNotes(notes)
}

export function searchNotes(keyword: string, category: string): NoteItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  return getNotes().filter((note) => {
    const categoryMatched = category === 'All' || note.category === category
    const keywordMatched =
      !normalizedKeyword ||
      note.title.toLowerCase().includes(normalizedKeyword) ||
      note.content.toLowerCase().includes(normalizedKeyword)

    return categoryMatched && keywordMatched
  })
}

export function buildSuggestedTitle(content: string): string {
  const firstLine = content
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.length > 0)

  if (!firstLine) {
    return ''
  }

  return firstLine.slice(0, 18)
}
