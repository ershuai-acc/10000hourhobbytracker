import Taro from '@tarojs/taro'
import { Project, UserProfile, DB_COLLECTIONS, CLOUD_STORAGE } from '@/types'

let db: any = null
let cloudInitialized = false

export function initCloud() {
  if (cloudInitialized) return

  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
    Taro.cloud.init({
      env: 'cloud1-1ga45e303c7e0c3b',
      traceUser: true,
    })
    db = Taro.cloud.database()
    cloudInitialized = true
  }
}

function getDb() {
  if (!db) {
    initCloud()
  }
  return db
}

export async function getOpenId(): Promise<string> {
  if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
    return 'h5-test-user'
  }

  try {
    const res = await Taro.cloud.callFunction({
      name: 'login',
    })
    return (res.result as any)?.openid || ''
  } catch (error) {
    console.error('getOpenId error:', error)
    return ''
  }
}

export async function getUserProfile(openid: string): Promise<UserProfile | null> {
  const database = getDb()
  if (!database) return null

  try {
    const res = await database
      .collection(DB_COLLECTIONS.USERS)
      .where({ openid })
      .limit(1)
      .get()

    if (res.data && res.data.length > 0) {
      return res.data[0] as UserProfile
    }
    return null
  } catch (error) {
    console.error('getUserProfile error:', error)
    return null
  }
}

export async function createOrUpdateUser(userInfo: Partial<UserProfile>): Promise<UserProfile | null> {
  const database = getDb()
  if (!database) return null

  const openid = userInfo.openid
  if (!openid) return null

  try {
    const existingUser = await getUserProfile(openid)

    if (existingUser) {
      await database
        .collection(DB_COLLECTIONS.USERS)
        .doc(existingUser._id!)
        .update({
          data: {
            ...userInfo,
            updatedAt: Date.now(),
          },
        })
      return { ...existingUser, ...userInfo, updatedAt: Date.now() }
    } else {
      const newUser: UserProfile = {
        openid,
        nickName: userInfo.nickName || 'User',
        avatarUrl: userInfo.avatarUrl || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const res = await database.collection(DB_COLLECTIONS.USERS).add({ data: newUser })
      return { ...newUser, _id: res._id }
    }
  } catch (error) {
    console.error('createOrUpdateUser error:', error)
    return null
  }
}

export async function getProjects(userId: string): Promise<Project[]> {
  const database = getDb()
  if (!database) return []

  try {
    const res = await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .where({ userId })
      .orderBy('createdAt', 'asc')
      .get()

    return (res.data || []) as Project[]
  } catch (error) {
    console.error('getProjects error:', error)
    return []
  }
}

export async function createProject(project: Omit<Project, '_id'>): Promise<Project | null> {
  const database = getDb()
  if (!database) return null

  try {
    const res = await database.collection(DB_COLLECTIONS.PROJECTS).add({ data: project })
    return { ...project, _id: res._id } as Project
  } catch (error) {
    console.error('createProject error:', error)
    return null
  }
}

export async function updateProject(
  projectId: string,
  data: Partial<Project>
): Promise<boolean> {
  const database = getDb()
  if (!database) return false

  try {
    await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .update({
        data: {
          ...data,
          updatedAt: Date.now(),
        },
      })
    return true
  } catch (error) {
    console.error('updateProject error:', error)
    return false
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const database = getDb()
  if (!database) return false

  try {
    await database.collection(DB_COLLECTIONS.PROJECTS).doc(projectId).remove()
    return true
  } catch (error) {
    console.error('deleteProject error:', error)
    return false
  }
}

export async function uploadPhoto(
  userId: string,
  projectId: string,
  tempFilePath: string
): Promise<string | null> {
  if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return tempFilePath

  try {
    const cloudPath = `${CLOUD_STORAGE.PHOTOS}/${userId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const res = await Taro.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
    })

    return res.fileID
  } catch (error) {
    console.error('uploadPhoto error:', error)
    return null
  }
}

export async function deletePhoto(fileID: string): Promise<boolean> {
  if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return true

  try {
    await Taro.cloud.deleteFile({ fileList: [fileID] })
    return true
  } catch (error) {
    console.error('deletePhoto error:', error)
    return false
  }
}

export async function addPhotoToProject(
  projectId: string,
  fileID: string
): Promise<boolean> {
  const database = getDb()
  if (!database) return false

  try {
    const _ = database.command
    await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .update({
        data: {
          photos: _.push(fileID),
          updatedAt: Date.now(),
        },
      })
    return true
  } catch (error) {
    console.error('addPhotoToProject error:', error)
    return false
  }
}

export async function removePhotoFromProject(
  projectId: string,
  photoIndex: number,
  fileID: string
): Promise<boolean> {
  const database = getDb()
  if (!database) return false

  try {
    const projectRes = await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .get()

    if (!projectRes.data) return false

    const photos = [...(projectRes.data.photos || [])]
    photos.splice(photoIndex, 1)

    await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .update({
        data: {
          photos,
          updatedAt: Date.now(),
        },
      })

    await deletePhoto(fileID)
    return true
  } catch (error) {
    console.error('removePhotoFromProject error:', error)
    return false
  }
}

export async function updateProjectLog(
  projectId: string,
  date: string,
  count: number
): Promise<boolean> {
  const database = getDb()
  if (!database) return false

  try {
    const projectRes = await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .get()

    if (!projectRes.data) return false

    const logs = { ...(projectRes.data.logs || {}) }
    if (count <= 0) {
      delete logs[date]
    } else {
      logs[date] = count
    }

    await database
      .collection(DB_COLLECTIONS.PROJECTS)
      .doc(projectId)
      .update({
        data: {
          logs,
          updatedAt: Date.now(),
        },
      })
    return true
  } catch (error) {
    console.error('updateProjectLog error:', error)
    return false
  }
}

export async function getTempFileURLs(fileIDs: string[]): Promise<string[]> {
  if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return fileIDs
  if (fileIDs.length === 0) return []

  try {
    const res = await Taro.cloud.getTempFileURL({ fileList: fileIDs })
    return res.fileList.map((item: any) => item.tempFileURL || item.fileID)
  } catch (error) {
    console.error('getTempFileURLs error:', error)
    return fileIDs
  }
}
