
import React, { useState, useEffect, useCallback } from 'react';
import { Tab, Project, UserProfile } from './types';
import { INITIAL_PROJECTS } from './constants';
import CalendarView from './components/CalendarView';
import ProgressView from './components/ProgressView';
import GalleryView from './components/GalleryView';
import Navigation from './components/Navigation';
import ProjectModal from './components/ProjectModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('hobby_tracker_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        mode: p.mode || 'calendar',
        photos: p.photos || [],
        hoursPerCheckIn: p.hoursPerCheckIn || 1,
        checkInLevels: p.checkInLevels || [1, 2, 3, 4, 5],
        checkInShape: p.checkInShape || 'square',
      }));
    }
    return INITIAL_PROJECTS.map(p => ({ ...p }));
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const user: UserProfile = {
    name: 'Creative Soul',
    avatar: 'https://picsum.photos/seed/hobbies/150/150'
  };

  useEffect(() => {
    try {
      localStorage.setItem('hobby_tracker_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleLogProgress = useCallback((date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const currentCount = p.logs[targetDate] || 0;
        return {
          ...p,
          logs: {
            ...p.logs,
            [targetDate]: currentCount + 1
          }
        };
      }
      return p;
    }));
  }, [activeProjectId]);

  const handleAddPhoto = useCallback((photoBase64: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          photos: [...(p.photos || []), photoBase64]
        };
      }
      return p;
    }));
  }, [activeProjectId]);

  const handleUpdateLog = useCallback((date: string, count: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newLogs = { ...p.logs };
        if (count <= 0) {
          delete newLogs[date];
        } else {
          newLogs[date] = count;
        }
        return { ...p, logs: newLogs };
      }
      return p;
    }));
  }, [activeProjectId]);

  const handleUpdatePhoto = useCallback((index: number, newPhoto: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newPhotos = [...(p.photos || [])];
        newPhotos[index] = newPhoto;
        return { ...p, photos: newPhotos };
      }
      return p;
    }));
  }, [activeProjectId]);

  const handleDeletePhoto = useCallback((index: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newPhotos = [...(p.photos || [])];
        newPhotos.splice(index, 1);
        return { ...p, photos: newPhotos };
      }
      return p;
    }));
  }, [activeProjectId]);

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...projectData } : p));
    } else {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: projectData.name || 'New Hobby',
        description: projectData.description,
        mode: projectData.mode || 'calendar',
        colorBase: projectData.colorBase || '#3b82f6',
        goalHours: projectData.goalHours || 10000,
        hoursPerCheckIn: projectData.hoursPerCheckIn || 1,
        checkInLevels: projectData.checkInLevels || [1, 2, 3, 4, 5],
        checkInShape: projectData.checkInShape || 'square',
        logs: {},
        photos: [],
        photoAspectRatio: projectData.photoAspectRatio,
        createdAt: Date.now(),
      };
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      setActiveTab('calendar');
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const nextProjects = projects.filter(p => p.id !== id);
    setProjects(nextProjects);
    if (activeProjectId === id) {
      setActiveProjectId(nextProjects[0]?.id || '');
    }
  };

  return (
    <div className="bg-[#f9fafb] h-screen flex flex-col relative mx-auto max-w-md w-full overflow-hidden">
      <header className="px-6 pt-10 pb-4 shrink-0">
        <h1 className="text-4xl font-bold font-gaegu text-[#2d3748] leading-none">
          Hour Tracker
        </h1>
        <p className="text-sm font-handwritten text-gray-400 italic mt-1">
          10,000 steps to mastery...
        </p>
      </header>

      <main className="flex-1 px-4 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'calendar' ? (
          activeProject.mode === 'gallery' ? (
            <GalleryView 
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProjectId}
              onAddPhoto={handleAddPhoto}
              onUpdatePhoto={handleUpdatePhoto}
              onDeletePhoto={handleDeletePhoto}
            />
          ) : (
            <CalendarView 
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProjectId}
              onLog={handleLogProgress}
              onUpdateLog={handleUpdateLog}
              onAddPhoto={handleAddPhoto}
            />
          )
        ) : activeTab === 'progress' ? (
          <ProgressView 
            projects={projects} 
            onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
            onAdd={() => { setEditingProject(null); setIsModalOpen(true); }}
            user={user}
          />
        ) : null}
      </main>

      <div className="shrink-0 px-4 pb-6 pt-2">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        editingProject={editingProject}
      />
    </div>
  );
};

export default App;
