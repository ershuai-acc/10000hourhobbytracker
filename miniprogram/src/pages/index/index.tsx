import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchProjects,
  createProjectAsync,
  updateProjectAsync,
  deleteProjectAsync,
  logProgressAsync,
  updateLogAsync,
  setActiveProjectId,
  setActiveTab,
  addPhotosLocal,
  removePhotoLocal,
  replacePhotoLocal,
} from '@/store/slices/projectSlice'
import { initCloud, getOpenId } from '@/services/cloudService'
import { Project, Tab } from '@/types'
import CalendarView from '@/components/CalendarView'
import GalleryView from '@/components/GalleryView'
import ProgressView from '@/components/ProgressView'
import Navigation from '@/components/Navigation'
import ProjectModal from '@/components/ProjectModal'
import PageContainer from '@/components/PageContainer'

const INITIAL_PROJECTS = [
  {
    name: 'Be Happy',
    description: '记录每天的心情',
    mode: 'calendar' as const,
    colorBase: '#3b82f6',
    goalHours: 10000,
    hoursPerCheckIn: 1,
    checkInLevels: [1, 2, 3, 4, 5],
    logs: {},
    photos: [],
    createdAt: Date.now(),
  },
]

export default function Index() {
  const dispatch = useAppDispatch()
  const { projects, activeProjectId, activeTab } = useAppSelector(
    (state) => state.project
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [openid, setOpenid] = useState<string>('')
  const [initializing, setInitializing] = useState(true)

  useLoad(() => {
    console.log('Page loaded.')
    initializeApp()
  })

  const initializeApp = async () => {
    try {
      initCloud()

      const id = await getOpenId()
      console.log('Got openid:', id)
      setOpenid(id)

      if (id) {
        const result = await dispatch(fetchProjects(id))
        console.log('Fetch projects result:', result)
        if (fetchProjects.fulfilled.match(result)) {
          const fetchedProjects = result.payload
          if (fetchedProjects.length === 0) {
            console.log('No projects, creating default...')
            await createDefaultProject(id)
          }
        }
      }
      setInitializing(false)
    } catch (error) {
      console.error('Initialize error:', error)
      setInitializing(false)
    }
  }

  const createDefaultProject = async (userId: string) => {
    const defaultProject = {
      ...INITIAL_PROJECTS[0],
      userId,
      id: Math.random().toString(36).substr(2, 9),
    }
    dispatch(createProjectAsync(defaultProject))
  }

  const activeProject = projects.find(
    (p) => p._id === activeProjectId || p.id === activeProjectId
  )

  const handleSelectProject = useCallback(
    (id: string) => {
      dispatch(setActiveProjectId(id))
    },
    [dispatch]
  )

  const handleSetActiveTab = useCallback(
    (tab: Tab) => {
      dispatch(setActiveTab(tab))
    },
    [dispatch]
  )

  const handleLogProgress = useCallback(
    (date?: string) => {
      if (!activeProject) return
      const targetDate = date || new Date().toISOString().split('T')[0]
      dispatch(
        logProgressAsync({
          projectId: activeProject._id || activeProject.id,
          date: targetDate,
        })
      )
    },
    [dispatch, activeProject]
  )

  const handleUpdateLog = useCallback(
    (date: string, count: number) => {
      if (!activeProject) return
      dispatch(
        updateLogAsync({
          projectId: activeProject._id || activeProject.id,
          date,
          count,
        })
      )
    },
    [dispatch, activeProject]
  )

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      dispatch(
        updateProjectAsync({
          projectId: editingProject._id || editingProject.id,
          data: projectData,
        })
      )
    } else {
      const newProject = {
        ...projectData,
        userId: openid,
        id: Math.random().toString(36).substr(2, 9),
        logs: {},
        photos: [],
        createdAt: Date.now(),
      } as Omit<Project, '_id'>
      dispatch(createProjectAsync(newProject))
    }
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      Taro.showToast({ title: '至少保留一个项目', icon: 'none' })
      return
    }
    dispatch(deleteProjectAsync(id))
  }

  const handlePhotosAdded = useCallback(
    (fileIDs: string[]) => {
      if (!activeProject) return
      dispatch(
        addPhotosLocal({
          projectId: activeProject._id || activeProject.id,
          fileIDs,
        })
      )
    },
    [dispatch, activeProject]
  )

  const handlePhotoDeleted = useCallback(
    (index: number) => {
      if (!activeProject) return
      dispatch(
        removePhotoLocal({
          projectId: activeProject._id || activeProject.id,
          index,
        })
      )
    },
    [dispatch, activeProject]
  )

  const handlePhotoReplaced = useCallback(
    (index: number, fileID: string) => {
      if (!activeProject) return
      dispatch(
        replacePhotoLocal({
          projectId: activeProject._id || activeProject.id,
          index,
          fileID,
        })
      )
    },
    [dispatch, activeProject]
  )

  if (initializing) {
    return (
      <PageContainer className="flex items-center justify-center">
        <View className="text-center">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="bg-gray-50 h-screen flex flex-col relative mx-auto max-w-md w-full overflow-hidden">
      {activeTab === 'calendar' && (
        <View className="px-6 pt-10 pb-4 shrink-0">
          <Text className="text-3xl font-bold text-gray-800 leading-none block">
            点滴手帐
          </Text>
          <Text className="text-sm text-gray-400 italic mt-1 block">
            every drop counts
          </Text>
        </View>
      )}

      <View className="flex-1 px-4 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'calendar' ? (
          activeProject?.mode === 'gallery' ? (
            <GalleryView
              projects={projects}
              activeProject={activeProject}
              userId={openid}
              onSelectProject={handleSelectProject}
              onPhotosAdded={handlePhotosAdded}
              onPhotoDeleted={handlePhotoDeleted}
              onPhotoReplaced={handlePhotoReplaced}
            />
          ) : activeProject ? (
            <CalendarView
              projects={projects}
              activeProject={activeProject}
              onSelectProject={handleSelectProject}
              onLog={handleLogProgress}
              onUpdateLog={handleUpdateLog}
            />
          ) : null
        ) : activeTab === 'progress' ? (
          <ProgressView
            projects={projects}
            onEdit={(p) => {
              setEditingProject(p)
              setIsModalOpen(true)
            }}
            onAdd={() => {
              setEditingProject(null)
              setIsModalOpen(true)
            }}
          />
        ) : null}
      </View>

      <View className="shrink-0 px-4 pb-6 pt-2">
        <Navigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </View>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        editingProject={editingProject}
      />
    </PageContainer>
  )
}
