
import React from 'react';
import { Project, UserProfile } from '../types';
import { BUTTON_COLORS } from '../constants';

interface Props {
  user: UserProfile;
  projects: Project[];
  onBack: () => void;
}

const ProfileView: React.FC<Props> = ({ user, projects, onBack }) => {
  // Fix: Cast Object.values(p.logs) to number[] to avoid "unknown" type errors in reduce
  const totalHoursOverall = projects.reduce((acc, p) => {
    return acc + (Object.values(p.logs) as number[]).reduce((sum, val) => sum + val, 0);
  }, 0);

  const completedCount = projects.filter(p => {
    // Fix: Cast Object.values(p.logs) to number[] to avoid "unknown" type errors in reduce
    const total = (Object.values(p.logs) as number[]).reduce((sum, val) => sum + val, 0);
    return total >= p.goalHours;
  }).length;

  return (
    <div className="py-10 space-y-12 animate-in fade-in zoom-in-95 duration-500">
      {/* User Header */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ring-gray-50">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold font-gaegu text-gray-800">{user.name}</h2>
          <p className="text-gray-400 font-handwritten italic">Collector of small wins</p>
        </div>
      </div>

      {/* Global Stats Card */}
      <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 shadow-sm flex justify-around items-center">
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Total Effort</p>
          <p className="text-2xl font-bold text-gray-700 font-gaegu">{totalHoursOverall.toLocaleString()}h</p>
        </div>
        <div className="w-px h-10 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Masteries</p>
          <p className="text-2xl font-bold text-gray-700 font-gaegu">{completedCount} / {projects.length}</p>
        </div>
      </div>

      {/* Projects Timeline/List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-handwritten text-gray-800 px-2 flex items-center gap-2">
          <span>Current Quests</span>
          <div className="h-px flex-1 bg-gray-100" />
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {projects.map((p, idx) => {
            // Fix: Cast Object.values(p.logs) to number[] to avoid "unknown" type errors in reduce
            const total = (Object.values(p.logs) as number[]).reduce((sum, val) => sum + val, 0);
            const isCompleted = total >= p.goalHours;
            const btnInfo = BUTTON_COLORS[idx % BUTTON_COLORS.length];

            return (
              <div key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${isCompleted ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-50 shadow-sm'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${btnInfo.bg}`}>
                  {btnInfo.char}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-700 font-gaegu text-lg">{p.name}</h4>
                  <p className="text-xs text-gray-400 font-handwritten">
                    {total.toLocaleString()}h of {p.goalHours.toLocaleString()}h
                  </p>
                </div>
                {isCompleted && (
                  <div className="text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative Stickers */}
      <div className="flex justify-center pt-8 opacity-40 select-none pointer-events-none">
        <div className="flex -space-x-4">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center rotate-[-15deg] shadow-sm text-pink-400">❤</div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center rotate-[10deg] shadow-sm text-blue-400">✨</div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center rotate-[-5deg] shadow-sm text-emerald-400">☕</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
