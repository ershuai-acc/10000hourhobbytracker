
import React from 'react';
import { Project, UserProfile } from '../types';

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onAdd: () => void;
  user: UserProfile;
}

const ProgressView: React.FC<Props> = ({ projects, onEdit, onAdd, user }) => {
  const calculateStats = (project: Project) => {
    if (project.mode === 'gallery') {
      return { 
        count: project.photos?.length || 0,
        isGallery: true
      };
    }
    const totalCheckIns = (Object.values(project.logs) as number[]).reduce((acc, curr) => acc + curr, 0);
    const hoursPerCheckIn = project.hoursPerCheckIn || 1;
    const totalHours = totalCheckIns * hoursPerCheckIn;
    const progressPercent = Math.min((totalHours / project.goalHours) * 100, 100);
    return { totalHours, progressPercent, isGallery: false };
  };

  const getProjectIcon = (mode: string) => {
    if (mode === 'gallery') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  const getWashiColor = (color: string) => {
    if (color.startsWith('#')) {
      return color + '40';
    }
    return '#e5e7eb';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 px-2 py-4 shrink-0">
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
        />
        <div>
          <h2 className="text-lg font-bold font-gaegu text-[#2d3748]">{user.name}</h2>
          <p className="text-xs text-gray-400 font-handwritten">Keep tracking your journey!</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        <div className="space-y-8">
          {projects.map((project) => {
            const stats = calculateStats(project);
            const themeColor = project.colorBase.startsWith('#') ? project.colorBase : '#3b82f6';

            return (
              <div key={project.id} className="relative pt-3">
                <div 
                  className="absolute -top-0 left-1/2 -translate-x-1/2 w-20 h-5 washi-tape z-20 rounded-sm"
                  style={{ backgroundColor: getWashiColor(themeColor) }}
                />
                
                <button 
                  onClick={() => onEdit(project)}
                  className="w-full text-left grid-paper border border-gray-100 rounded-lg p-4 pt-6 card-shadow relative hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 text-white/80"
                      style={{ backgroundColor: themeColor }}
                    >
                      {getProjectIcon(project.mode)}
                    </div>

                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <h3 className="text-2xl font-bold font-gaegu text-[#2d3748] tracking-tight truncate">{project.name}</h3>
                      {stats.isGallery ? (
                        <span className="text-gray-400 font-gaegu text-base shrink-0 ml-2">{stats.count} 张</span>
                      ) : (
                        <span className="text-gray-400 font-gaegu text-base shrink-0 ml-2">{stats.totalHours?.toLocaleString()}h</span>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-400 font-gaegu mb-3 pl-1 line-clamp-2">{project.description}</p>
                  )}

                  {!stats.isGallery && (
                    <div className="space-y-1">
                      <div className="w-full h-6 bg-gray-50 rounded-md overflow-hidden border border-gray-100 flex items-center p-1">
                        <div 
                          className="h-full rounded-sm progress-textured transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${stats.progressPercent}%`, backgroundColor: themeColor }}
                        />
                      </div>
                      <div className="flex justify-end pr-1">
                         <span className="text-xs font-bold text-gray-400 font-gaegu uppercase tracking-widest">{stats.progressPercent?.toFixed(1)}% MASTERY</span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}

          <div className="relative pt-3">
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-200 washi-tape z-20 rounded-sm"></div>
            
            <button 
              onClick={onAdd}
              className="w-full grid-paper border-2 border-dashed border-gray-200 rounded-lg p-4 pt-6 hover:border-gray-300 hover:bg-gray-50/50 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-xl text-gray-400">+</span>
                </div>
                <span className="text-lg font-gaegu text-gray-400">Add New Project</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
