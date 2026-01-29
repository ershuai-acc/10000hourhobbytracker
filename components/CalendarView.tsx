
import React, { useMemo, useRef } from 'react';
import { Project } from '../types';
import { generateColorLevels, getColorForLevel } from '../utils/colors';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onLog: () => void;
  onAddPhoto: (photoBase64: string) => void;
}

const CalendarView: React.FC<Props> = ({ projects, activeProject, onSelectProject, onLog }) => {
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const printRef = useRef<HTMLDivElement>(null);

  const themeColor = activeProject.colorBase.startsWith('#') ? activeProject.colorBase : '#3b82f6';
  const todayCount = activeProject.logs[today] || 0;
  const checkInLevels = activeProject.checkInLevels || [1, 2, 3, 4, 5];
  const checkInShape = activeProject.checkInShape || 'square';
  
  const colorLevels = useMemo(() => generateColorLevels(themeColor), [themeColor]);

  const getProjectColor = (p: Project) => p.colorBase.startsWith('#') ? p.colorBase : '#3b82f6';

  const isValidDate = (month: number, day: number) => {
    const d = new Date(currentYear, month - 1, day);
    return d.getMonth() === month - 1;
  };

  const getCheckInCount = (month: number, day: number): number | null => {
    if (!isValidDate(month, day)) return null;
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activeProject.logs[dateStr] || 0;
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: '#f9fafb',
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${activeProject.name}-${currentYear}.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={printRef} className="relative flex-1 flex flex-col min-h-0">
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
          className="grid-paper border border-gray-200 rounded-lg rounded-tl-none p-3 pt-4 card-shadow flex-1 flex flex-col min-h-0"
          style={{ borderTopColor: themeColor }}
        >
          <div className="flex items-center mb-1">
            <div className="w-6 text-[10px] font-gaegu font-bold text-gray-400">{currentYear}</div>
            <div className="flex-1 grid grid-cols-12">
              {months.map(m => (
                <div key={m} className="text-[9px] font-gaegu font-bold text-gray-400 text-center">{m}月</div>
              ))}
            </div>
            <button
              onClick={handleExportPDF}
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors"
              title="导出PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto no-scrollbar min-h-0">
            <div 
              className="grid gap-[2px] h-full" 
              style={{ 
                minWidth: '280px',
                gridTemplateColumns: '16px repeat(12, 1fr)',
                gridTemplateRows: 'repeat(31, 1fr)'
              }}
            >
              {days.map(d => (
                <div 
                  key={`date-${d}`}
                  className="flex items-center justify-end pr-0.5 text-[8px] font-gaegu font-bold text-gray-300"
                  style={{ gridColumn: 1, gridRow: d }}
                >
                  {d === 1 || d % 5 === 0 ? d : ''}
                </div>
              ))}
              
              {months.map((month, monthIdx) => (
                days.map(day => {
                  const count = getCheckInCount(month, day);
                  const isInvalid = count === null;
                  const cellColor = count !== null && count > 0 
                    ? getColorForLevel(count, checkInLevels, colorLevels)
                    : null;
                  
                  return (
                    <div
                      key={`${month}-${day}`}
                      className={`aspect-square transition-colors ${
                        isInvalid ? 'opacity-0' : ''
                      } ${checkInShape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
                      style={{
                        gridColumn: monthIdx + 2,
                        gridRow: day,
                        backgroundColor: cellColor || 'rgba(0,0,0,0.03)',
                      }}
                    />
                  );
                })
              ))}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                {colorLevels.map((c, i) => (
                  <div 
                    key={i}
                    className={`w-4 h-4 ${checkInShape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                    style={{ backgroundColor: c }}
                    title={`${checkInLevels[i]}次`}
                  />
                ))}
              </div>
              {todayCount > 0 && (
                <span className="text-xs text-gray-400">今日: {todayCount}次</span>
              )}
            </div>
            <button
              onClick={onLog}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              打卡 +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
