export interface Project {
  id: string
  title: string
  description: string
  coverImageUrl: string
  createdAt: string
  category?: string
  client?: string
  technologies?: string[]
  challenge?: string
  solution?: string
  keyFeatures?: string[]
}
