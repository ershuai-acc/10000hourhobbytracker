import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { Project, Tab } from '@/types'
import * as cloudService from '@/services/cloudService'

interface ProjectState {
  projects: Project[]
  activeProjectId: string
  activeTab: Tab
  loading: boolean
  error: string | null
}

const initialState: ProjectState = {
  projects: [],
  activeProjectId: '',
  activeTab: 'calendar',
  loading: false,
  error: null,
}

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (userId: string) => {
    const projects = await cloudService.getProjects(userId)
    return projects
  }
)

export const createProjectAsync = createAsyncThunk(
  'project/createProject',
  async (project: Omit<Project, '_id'>) => {
    const result = await cloudService.createProject(project)
    return result
  }
)

export const updateProjectAsync = createAsyncThunk(
  'project/updateProject',
  async ({ projectId, data }: { projectId: string; data: Partial<Project> }) => {
    await cloudService.updateProject(projectId, data)
    return { projectId, data }
  }
)

export const deleteProjectAsync = createAsyncThunk(
  'project/deleteProject',
  async (projectId: string) => {
    await cloudService.deleteProject(projectId)
    return projectId
  }
)

export const logProgressAsync = createAsyncThunk(
  'project/logProgress',
  async ({ projectId, date }: { projectId: string; date: string }, { getState }) => {
    const state = getState() as { project: ProjectState }
    const project = state.project.projects.find((p) => p._id === projectId || p.id === projectId)
    if (!project) return null

    const currentCount = project.logs[date] || 0
    const newCount = currentCount + 1
    await cloudService.updateProjectLog(project._id || projectId, date, newCount)
    return { projectId, date, count: newCount }
  }
)

export const updateLogAsync = createAsyncThunk(
  'project/updateLog',
  async ({ projectId, date, count }: { projectId: string; date: string; count: number }) => {
    await cloudService.updateProjectLog(projectId, date, count)
    return { projectId, date, count }
  }
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProjectId: (state, action: PayloadAction<string>) => {
      state.activeProjectId = action.payload
    },
    setActiveTab: (state, action: PayloadAction<Tab>) => {
      state.activeTab = action.payload
    },
    updateProjectLocal: (state, action: PayloadAction<{ projectId: string; data: Partial<Project> }>) => {
      const { projectId, data } = action.payload
      const index = state.projects.findIndex((p) => p._id === projectId || p.id === projectId)
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...data }
      }
    },
    addPhotoLocal: (state, action: PayloadAction<{ projectId: string; fileID: string }>) => {
      const { projectId, fileID } = action.payload
      const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
      if (project) {
        if (!project.photos) project.photos = []
        project.photos.push(fileID)
      }
    },
    addPhotosLocal: (state, action: PayloadAction<{ projectId: string; fileIDs: string[] }>) => {
      const { projectId, fileIDs } = action.payload
      const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
      if (project) {
        if (!project.photos) project.photos = []
        project.photos.push(...fileIDs)
      }
    },
    removePhotoLocal: (state, action: PayloadAction<{ projectId: string; index: number }>) => {
      const { projectId, index } = action.payload
      const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
      if (project && project.photos) {
        project.photos.splice(index, 1)
      }
    },
    replacePhotoLocal: (state, action: PayloadAction<{ projectId: string; index: number; fileID: string }>) => {
      const { projectId, index, fileID } = action.payload
      const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
      if (project && project.photos && index >= 0 && index < project.photos.length) {
        project.photos[index] = fileID
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
        if (action.payload.length > 0 && !state.activeProjectId) {
          state.activeProjectId = action.payload[0]._id || action.payload[0].id
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch projects'
      })
      .addCase(createProjectAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.projects.push(action.payload)
          state.activeProjectId = action.payload._id || action.payload.id
          state.activeTab = 'calendar'
        }
      })
      .addCase(updateProjectAsync.fulfilled, (state, action) => {
        const { projectId, data } = action.payload
        const index = state.projects.findIndex((p) => p._id === projectId || p.id === projectId)
        if (index !== -1) {
          state.projects[index] = { ...state.projects[index], ...data }
        }
      })
      .addCase(deleteProjectAsync.fulfilled, (state, action) => {
        const projectId = action.payload
        state.projects = state.projects.filter((p) => p._id !== projectId && p.id !== projectId)
        if (state.activeProjectId === projectId && state.projects.length > 0) {
          state.activeProjectId = state.projects[0]._id || state.projects[0].id
        }
      })
      .addCase(logProgressAsync.fulfilled, (state, action) => {
        if (action.payload) {
          const { projectId, date, count } = action.payload
          const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
          if (project) {
            project.logs[date] = count
          }
        }
      })
      .addCase(updateLogAsync.fulfilled, (state, action) => {
        const { projectId, date, count } = action.payload
        const project = state.projects.find((p) => p._id === projectId || p.id === projectId)
        if (project) {
          if (count <= 0) {
            delete project.logs[date]
          } else {
            project.logs[date] = count
          }
        }
      })
  },
})

export const {
  setActiveProjectId,
  setActiveTab,
  updateProjectLocal,
  addPhotoLocal,
  addPhotosLocal,
  removePhotoLocal,
  replacePhotoLocal,
} = projectSlice.actions
export default projectSlice.reducer
