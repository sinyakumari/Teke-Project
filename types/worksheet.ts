export interface Worksheet {
  id: string
  name: string
  trainingId: string
  lessonId: string
  lessonName: string
  createdAt: string
  updatedAt: string
  questions?: WorksheetQuestion[]
}

export interface WorksheetQuestion {
  id: string
  worksheetId: string
  question: string
  answer?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateWorksheetData {
  name: string
  trainingId: string
  lessonId: string
}

export interface CreateQuestionData {
  worksheetId: string
  question: string
  answer?: string
  order?: number
}
