
import React from 'react';
import { Project, Intensity } from '../types';

interface Props {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onLog: (intensity: Intensity) => void;
  onAddPhoto: (photoBase64: string) => void;
}

const CalendarView: React.FC<Props> = ({ projects, activeProject, onSelectProject, onLog }) => {
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const themeColor = activeProject.colorBase.startsWith('#') ? activeProject.colorBase : '#3b82f6';
  const hasLoggedToday = !!activeProject.logs[today];

  const getProjectColor = (p: Project) => p.colorBase.startsWith('#') ? p.colorBase : '#3b82f6';

  const getCellColor = (month: number, day: number) => {
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const intensity = activeProject.logs[dateStr];
    
    const d = new Date(currentYear, month - 1, day);
    if (d.getMonth() !== month - 1) return { style: {}, className: 'bg-transparent opacity-0' };
    if (!intensity) return { style: {}, className: 'bg-white/40 border-gray-100' };
    
    return { style: { backgroundColor: themeColor }, className: '' };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="flex overflow-x-auto no-scrollbar gap-1 px-1 shrink-0 relative z-10">
          {projects.map(p => {
            const pColor = getProjectColor(p);
            const isActive = activeProject.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 rounded-t-lg border-t border-l border-r ${
                  isActive 
                    ? 'text-white -mb-px relative z-20' 
                    : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                }`}
                style={isActive ? { 
                  backgroundColor: pColor,
                  borderColor: pColor
                } : {}}
              >
                {p.mode === 'gallery' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {p.name}
              </button>
            );
          })}
        </div>
        
        <div 
          className="grid-paper border border-gray-100 rounded-lg rounded-tl-none p-3 pt-4 card-shadow flex-1 flex flex-col min-h-0"
          style={{ borderTopColor: themeColor }}
        >
          <div className="flex ml-5 mb-1">
            <div className="grid grid-cols-12 flex-1 gap-px">
              {months.map(m => (
                <div key={m} className="text-[9px] font-gaegu font-bold text-gray-300 text-center">{m}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="flex flex-col w-5 pt-[1px]">
              {days.map(d => (
                <div key={d} className="h-[calc(100%/31)] flex items-center justify-start text-[8px] font-gaegu font-bold text-gray-300 leading-none">
                  {d % 5 === 0 || d === 1 ? d : ''}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-12 gap-[1px] h-full">
                {months.map(month => (
                  <div key={month} className="flex flex-col gap-[1px] h-full">
                    {days.map(day => {
                      const { style, className } = getCellColor(month, day);
                      return (
                        <div 
                          key={day} 
                          className={`w-full h-full border-[0.5px] border-gray-50 rounded-sm transition-colors ${className}`}
                          style={style}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => onLog(1)}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                hasLoggedToday 
                  ? 'text-white shadow-sm' 
                  : 'border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400'
              }`}
              style={hasLoggedToday ? { backgroundColor: themeColor } : {}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {hasLoggedToday ? '今日已打卡' : '打卡一次'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
