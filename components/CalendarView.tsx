
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Project } from '../types';
import { generateColorLevels, getColorForLevel } from '../utils/colors';
import html2canvas from 'html2canvas';

interface Props {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (id: string) => void;
  onLog: (date?: string) => void;
  onUpdateLog: (date: string, count: number) => void;
  onAddPhoto: (photoBase64: string) => void;
}

const CalendarView: React.FC<Props> = ({ projects, activeProject, onSelectProject, onLog, onUpdateLog }) => {
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    setSelectedDate(today);
  }, [activeProject.id, today]);

  const themeColor = activeProject.colorBase.startsWith('#') ? activeProject.colorBase : '#3b82f6';
  const selectedDateCount = selectedDate ? (activeProject.logs[selectedDate] || 0) : (activeProject.logs[today] || 0);
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

  const openEditModal = (dateStr: string) => {
    const count = activeProject.logs[dateStr] || 0;
    if (count > 0) {
      setEditingDate(dateStr);
      setEditCount(count);
    }
  };

  const handleCellPointerDown = (dateStr: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      openEditModal(dateStr);
    }, 500);
  };

  const handleCellPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCellDoubleClick = (dateStr: string) => {
    openEditModal(dateStr);
  };

  const handleSaveEdit = () => {
    if (editingDate) {
      onUpdateLog(editingDate, editCount);
      setEditingDate(null);
    }
  };

  const handleExportPDF = async () => {
    const cellSize = 18;
    const cellGap = 2;
    const dateColWidth = 20;
    const padding = 24;
    
    const gridWidth = dateColWidth + 12 * (cellSize + cellGap);
    const gridHeight = 31 * (cellSize + cellGap);
    const totalWidth = padding * 2 + gridWidth + 32;
    const totalHeight = padding * 2 + 30 + 20 + gridHeight + 50;
    
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${totalWidth}px;
      height: ${totalHeight}px;
      background: #f9fafb;
      font-family: 'Architects Daughter', 'Long Cang', 'Gaegu', cursive;
      padding: ${padding}px;
      box-sizing: border-box;
    `;
    
    const shapeRadius = checkInShape === 'circle' ? '50%' : '2px';
    
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div style="display: flex; align-items: flex-end; margin-bottom: -1px; gap: 8px;">
          <div style="
            padding: 6px 12px;
            background: ${themeColor};
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 6px 6px 0 0;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style="display: inline-block; transform: translateY(-8px);">${activeProject.name}</span>
          </div>
          
          <div style="display: flex; gap: 3px; padding-bottom: 4px;">
            ${colorLevels.map((c, i) => `
              <div style="
                width: 12px;
                height: 12px;
                background-color: ${c};
                border-radius: ${checkInShape === 'circle' ? '50%' : '2px'};
              " title="${checkInLevels[i]}次"></div>
            `).join('')}
          </div>
        </div>
        
        <div style="
          flex: 1;
          background: white;
          border: 1px solid #e5e7eb;
          border-top-color: ${themeColor};
          border-radius: 0 8px 8px 8px;
          padding: 16px;
          position: relative;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
            background-size: 15px 15px;
            border-radius: 0 8px 8px 8px;
            pointer-events: none;
          "></div>
          
          <div style="position: relative; height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; margin-bottom: 6px; align-items: center;">
              <div style="width: ${dateColWidth}px; font-size: 10px; font-weight: bold; color: #9ca3af; margin-left: -1px;">${currentYear}</div>
              <div style="display: grid; grid-template-columns: repeat(12, ${cellSize}px); gap: ${cellGap}px; margin-left: 1px;">
                ${months.map(m => `<div style="font-size: 9px; font-weight: bold; color: #9ca3af; text-align: center;">${m}月</div>`).join('')}
              </div>
            </div>
            
            <div style="display: grid; gap: ${cellGap}px; grid-template-columns: ${dateColWidth}px repeat(12, ${cellSize}px); grid-template-rows: repeat(31, ${cellSize}px);">
              ${days.map(d => `
                <div style="grid-column: 1; grid-row: ${d}; display: flex; align-items: center; justify-content: flex-end; padding-right: 2px; font-size: 9px; font-weight: bold; color: #9ca3af; margin-top: -4px;">
                  ${d === 1 || d % 5 === 0 ? d : ''}
                </div>
              `).join('')}
              
              ${months.map((month, monthIdx) => 
                days.map(day => {
                  const count = getCheckInCount(month, day);
                  const isInvalid = count === null;
                  const cellColor = count !== null && count > 0 
                    ? getColorForLevel(count, checkInLevels, colorLevels)
                    : 'rgba(0,0,0,0.03)';
                  
                  return `
                    <div style="
                      grid-column: ${monthIdx + 2};
                      grid-row: ${day};
                      width: ${cellSize}px;
                      height: ${cellSize}px;
                      background-color: ${isInvalid ? 'transparent' : cellColor};
                      border-radius: ${shapeRadius};
                      ${isInvalid ? 'opacity: 0;' : ''}
                    "></div>
                  `;
                }).join('')
              ).join('')}
            </div>
          </div>
        </div>
        
        <div style="
          text-align: right;
          padding-top: 8px;
          font-size: 10px;
          color: #d1d5db;
          font-weight: bold;
        ">
          Hour Tracker · 10,000 steps to mastery
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    try {
      const canvas = await html2canvas(container, {
        scale: 4,
        backgroundColor: '#f9fafb',
        useCORS: true,
        logging: false,
        imageTimeout: 0,
      });
      
      const link = document.createElement('a');
      link.download = `${activeProject.name}-${currentYear}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
    } finally {
      document.body.removeChild(container);
    }
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
                  const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === today;
                  const cellColor = count !== null && count > 0 
                    ? getColorForLevel(count, checkInLevels, colorLevels)
                    : null;
                  
                  return (
                    <div
                      key={`${month}-${day}`}
                      onClick={() => {
                        if (!isInvalid && !longPressTriggered.current) {
                          setSelectedDate(isSelected ? null : dateStr);
                        }
                      }}
                      onDoubleClick={() => !isInvalid && handleCellDoubleClick(dateStr)}
                      onPointerDown={() => !isInvalid && handleCellPointerDown(dateStr)}
                      onPointerUp={handleCellPointerUp}
                      onPointerLeave={handleCellPointerUp}
                      className={`aspect-square transition-all cursor-pointer ${
                        isInvalid ? 'opacity-0 pointer-events-none' : ''
                      } ${checkInShape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
                      style={{
                        gridColumn: monthIdx + 2,
                        gridRow: day,
                        backgroundColor: cellColor || 'rgba(0,0,0,0.03)',
                        boxShadow: isSelected ? `0 0 0 2px ${themeColor}` : isToday ? '0 0 0 1px rgba(0,0,0,0.2)' : 'none',
                        transform: isSelected ? 'scale(1.1)' : 'none',
                        zIndex: isSelected ? 10 : 1,
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
              {selectedDateCount > 0 && (
                <span className="text-xs text-gray-400">
                  {selectedDate ? `${selectedDate.slice(5).replace('-', '/')}: ${selectedDateCount}次` : `今日: ${selectedDateCount}次`}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                const dateToLog = selectedDate || today;
                onLog(dateToLog);
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              {selectedDate ? `${selectedDate.slice(5).replace('-', '/')} 打卡 +1` : '今日打卡 +1'}
            </button>
          </div>
        </div>
      </div>

      {editingDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingDate(null)}>
          <div className="bg-white rounded-2xl p-5 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4">
              修改 {editingDate.slice(5).replace('-', '/')} 打卡
            </h3>
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                onClick={() => setEditCount(Math.max(0, editCount - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 active:bg-gray-200"
              >
                −
              </button>
              <span className="text-3xl font-bold w-16 text-center" style={{ color: themeColor }}>
                {editCount}
              </span>
              <button
                onClick={() => setEditCount(editCount + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 active:bg-gray-200"
              >
                +
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingDate(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ backgroundColor: themeColor }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
