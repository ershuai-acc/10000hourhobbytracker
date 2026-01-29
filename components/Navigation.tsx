
import React from 'react';
import { Tab } from '../types';

interface Props {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navigation: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'calendar', label: 'Record', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
    )},
    { id: 'progress', label: 'Project', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    )},
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-lg border border-gray-100 h-20 flex items-center justify-between px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`flex-1 flex flex-col items-center justify-center transition-all ${
            activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'
          }`}
        >
          <div className="mb-0.5">{tab.icon}</div>
          <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
