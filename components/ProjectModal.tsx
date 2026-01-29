
import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectMode, PhotoAspectRatio, CheckInShape } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
  onDelete: (id: string) => void;
  editingProject: Project | null;
}

const DEFAULT_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#f43f5e'];

const ASPECT_RATIOS: { value: PhotoAspectRatio; label: string; width: number; height: number }[] = [
  { value: '1:1', label: '1:1', width: 1, height: 1 },
  { value: '16:9', label: '16:9', width: 16, height: 9 },
  { value: '9:16', label: '9:16', width: 9, height: 16 },
  { value: '4:3', label: '4:3', width: 4, height: 3 },
  { value: '3:4', label: '3:4', width: 3, height: 4 },
];

const ProjectModal: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, editingProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<ProjectMode>('calendar');
  const [color, setColor] = useState('#3b82f6');
  const [goal, setGoal] = useState(10000);
  const [hoursPerCheckIn, setHoursPerCheckIn] = useState(1);
  const [checkInLevels, setCheckInLevels] = useState<number[]>([1, 2, 3, 4, 5]);
  const [checkInShape, setCheckInShape] = useState<CheckInShape>('square');
  const [aspectRatio, setAspectRatio] = useState<PhotoAspectRatio>('1:1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setName(editingProject.name);
        setDescription(editingProject.description || '');
        setMode(editingProject.mode || 'calendar');
        setColor(editingProject.colorBase.startsWith('#') ? editingProject.colorBase : '#3b82f6');
        setGoal(editingProject.goalHours);
        setHoursPerCheckIn(editingProject.hoursPerCheckIn || 1);
        setCheckInLevels(editingProject.checkInLevels || [1, 2, 3, 4, 5]);
        setCheckInShape(editingProject.checkInShape || 'square');
        setAspectRatio(editingProject.photoAspectRatio || '1:1');
        setShowAdvanced(false);
      } else {
        setName('');
        setDescription('');
        setMode('calendar');
        setColor('#3b82f6');
        setGoal(10000);
        setHoursPerCheckIn(1);
        setCheckInLevels([1, 2, 3, 4, 5]);
        setCheckInShape('square');
        setAspectRatio('1:1');
        setShowAdvanced(false);
      }
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <header className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 font-gaegu">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h2>
            <p className="text-sm text-gray-400 font-medium font-handwritten">Choose your mastery style</p>
          </header>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g. Piano, Coding, Gym..."
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">备注</label>
              <input 
                type="text" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="添加备注..."
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-gray-700 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Recording Mode</label>
              <div className="grid grid-cols-2 bg-gray-50 p-1.5 rounded-2xl gap-2">
                <button
                  onClick={() => setMode('calendar')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
                    mode === 'calendar' ? 'bg-white text-blue-500 shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>日历打卡</span>
                </button>
                <button
                  onClick={() => setMode('gallery')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
                    mode === 'gallery' ? 'bg-white text-rose-500 shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>图片记录</span>
                </button>
              </div>
            </div>

            {mode === 'calendar' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">目标时长</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={goal}
                      onChange={e => setGoal(Number(e.target.value))}
                      className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-gray-700"
                    />
                    <span className="text-gray-400 text-sm">小时</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">单次打卡时长</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={hoursPerCheckIn}
                      onChange={e => setHoursPerCheckIn(Number(e.target.value))}
                      min={0.5}
                      step={0.5}
                      className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-gray-700"
                    />
                    <span className="text-gray-400 text-sm">小时</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors pl-1"
                >
                  <svg 
                    className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  更多设置
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pl-2 border-l-2 border-gray-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">主题颜色</label>
                      <div className="flex items-center gap-2">
                        {DEFAULT_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-lg transition-all ${
                              color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={color}
                          onChange={e => setColor(e.target.value)}
                          className="hidden"
                        />
                        <button
                          onClick={() => colorInputRef.current?.click()}
                          className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-all"
                          title="自定义颜色"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">打卡形状</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCheckInShape('square')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                            checkInShape === 'square' 
                              ? 'bg-gray-100 ring-2 ring-gray-300' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-sm ${checkInShape === 'square' ? 'bg-gray-500' : 'bg-gray-300'}`} />
                          <span className={`text-xs font-bold ${checkInShape === 'square' ? 'text-gray-700' : 'text-gray-400'}`}>方形</span>
                        </button>
                        <button
                          onClick={() => setCheckInShape('circle')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                            checkInShape === 'circle' 
                              ? 'bg-gray-100 ring-2 ring-gray-300' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${checkInShape === 'circle' ? 'bg-gray-500' : 'bg-gray-300'}`} />
                          <span className={`text-xs font-bold ${checkInShape === 'circle' ? 'text-gray-700' : 'text-gray-400'}`}>圆形</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">打卡等级 (5个颜色深度)</label>
                      <div className="flex items-center gap-1">
                        {checkInLevels.map((level, idx) => (
                          <input
                            key={idx}
                            type="number"
                            value={level}
                            onChange={e => {
                              const newLevels = [...checkInLevels];
                              newLevels[idx] = Number(e.target.value);
                              setCheckInLevels(newLevels);
                            }}
                            min={1}
                            className="w-12 px-2 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-gray-700 text-center text-sm"
                          />
                        ))}
                        <span className="text-gray-400 text-xs ml-1">次</span>
                      </div>
                      <p className="text-[10px] text-gray-300 pl-1">从浅到深，每个数字代表达到该颜色需要的打卡次数</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === 'gallery' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">图片比例</label>
                <div className="flex items-center gap-2">
                  {ASPECT_RATIOS.map(ar => {
                    const isSelected = aspectRatio === ar.value;
                    const scale = 24;
                    const maxDim = Math.max(ar.width, ar.height);
                    const w = (ar.width / maxDim) * scale;
                    const h = (ar.height / maxDim) * scale;
                    return (
                      <button
                        key={ar.value}
                        onClick={() => setAspectRatio(ar.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          isSelected 
                            ? 'bg-gray-100 ring-2 ring-gray-300' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div 
                          className={`border-2 rounded ${isSelected ? 'border-gray-500' : 'border-gray-300'}`}
                          style={{ width: w, height: h }}
                        />
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                          {ar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={() => onSave({ 
                name, 
                description, 
                mode, 
                colorBase: color, 
                goalHours: goal, 
                hoursPerCheckIn,
                checkInLevels,
                checkInShape,
                photoAspectRatio: aspectRatio 
              })}
              className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all font-gaegu text-lg"
            >
              {editingProject ? 'Update Project' : 'Add New Project'}
            </button>
            
            {editingProject && (
              <button
                onClick={() => {
                  if(confirm('Delete this project and all its records?')) {
                    onDelete(editingProject.id);
                    onClose();
                  }
                }}
                className="w-full py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
              >
                Delete Project
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-bold text-sm hover:text-gray-600 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
