
import React, { useState, useEffect, useCallback } from 'react';
import { Tab, Project, UserProfile, Intensity } from './types';
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
        photos: p.photos || []
      }));
    }
    return INITIAL_PROJECTS.map(p => ({ ...p, mode: 'calendar' as const, photos: [] }));
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const user: UserProfile = {
    name: 'Creative Soul',
    avatar: 'https://picsum.photos/seed/hobbies/150/150'
  };

  useEffect(() => {
    localStorage.setItem('hobby_tracker_projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleLogProgress = useCallback((intensity: Intensity) => {
    const today = new Date().toISOString().split('T')[0];
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          logs: {
            ...p.logs,
            [today]: intensity
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

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...projectData } : p));
    } else {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: projectData.name || 'New Hobby',
        mode: projectData.mode || 'calendar',
        colorBase: projectData.colorBase || '#3b82f6',
        themeImage: projectData.themeImage,
        goalHours: projectData.goalHours || 100,
        logs: {},
        photos: [],
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

  const recentThemes = projects
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => ({ color: p.colorBase, image: p.themeImage }))
    .slice(0, 5);

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
            />
          ) : (
            <CalendarView 
              projects={projects}
              activeProject={activeProject}
              onSelectProject={setActiveProjectId}
              onLog={handleLogProgress}
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
        recentThemes={recentThemes}
      />
    </div>
  );
};

export default App;
