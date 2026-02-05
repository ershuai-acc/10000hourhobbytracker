// 项目类型定义

export type Intensity = 1 | 2 | 3 | 4 | 5

export interface DailyLog {
  [date: string]: number
}

export type ProjectMode = 'calendar' | 'gallery'

export type PhotoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

export type CheckInShape = 'square' | 'circle'

export interface Project {
  _id?: string // 云数据库ID
  id: string // 本地ID (兼容)
  userId: string // 用户openid
  name: string
  description?: string
  mode: ProjectMode
  colorBase: string
  goalHours: number
  hoursPerCheckIn: number
  checkInLevels: number[]
  checkInShape?: CheckInShape
  logs: DailyLog
  photos?: string[] // 云存储的fileID数组
  photoAspectRatio?: PhotoAspectRatio
  createdAt: number
  updatedAt?: number
}

export type Tab = 'calendar' | 'progress'

export interface UserProfile {
  _id?: string
  openid: string
  nickName?: string
  avatarUrl?: string
  createdAt: number
  updatedAt?: number
}

// 云数据库集合名称
export const DB_COLLECTIONS = {
  USERS: 'ht_users',
  PROJECTS: 'ht_projects',
} as const

// 云存储路径前缀
export const CLOUD_STORAGE = {
  PHOTOS: 'ht_photos',
} as const
