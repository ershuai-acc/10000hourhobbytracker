
import React, { useRef, useState } from 'react';
import { Project, PhotoAspectRatio } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  projects: Project[];
  activeProject?: Project;
  onSelectProject: (id: string) => void;
  onAddPhoto: (photoBase64: string) => void;
  onUpdatePhoto: (index: number, newPhoto: string) => void;
  onDeletePhoto: (index: number) => void;
}

const getAspectRatioClass = (ratio: PhotoAspectRatio): string => {
  switch (ratio) {
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16]';
    case '4:3': return 'aspect-[4/3]';
    case '3:4': return 'aspect-[3/4]';
    default: return 'aspect-square';
  }
};

const GalleryView: React.FC<Props> = ({ projects, activeProject, onSelectProject, onAddPhoto, onUpdatePhoto, onDeletePhoto }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [showReplaceUrlInput, setShowReplaceUrlInput] = useState(false);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceError, setReplaceError] = useState('');

  const getProjectColor = (p: Project) => p.colorBase.startsWith('#') ? p.colorBase : '#3b82f6';
  const themeColor = activeProject ? getProjectColor(activeProject) : '#ec4899';
  const aspectRatioClass = getAspectRatioClass(activeProject?.photoAspectRatio || '1:1');

  const handleExportPolaroid = async () => {
    if (!activeProject || !galleryRef.current) return;
    setShowExportModal(false);
    
    const photos = activeProject.photos || [];
    if (photos.length === 0) return;
    
    const exportBtn = galleryRef.current.querySelector('[data-export-btn]') as HTMLElement;
    const uploadBtn = galleryRef.current.querySelector('[data-upload-btn]') as HTMLElement;
    const scrollContainer = galleryRef.current.querySelector('[data-scroll-container]') as HTMLElement;
    const inactiveTabs = galleryRef.current.querySelectorAll('[data-tab]:not([data-active])') as NodeListOf<HTMLElement>;
    const activeTab = galleryRef.current.querySelector('[data-tab][data-active]') as HTMLElement;
    const activeTabText = activeTab?.querySelector('span, [data-tab-text]') as HTMLElement;
    
    if (exportBtn) exportBtn.style.display = 'none';
    if (uploadBtn) uploadBtn.style.display = 'none';
    inactiveTabs.forEach(tab => tab.style.display = 'none');
    if (activeTabText) activeTabText.style.transform = 'translateY(-8px)';
    
    const originalStyles = {
      galleryOverflow: galleryRef.current.style.overflow,
      galleryHeight: galleryRef.current.style.height,
      galleryMaxHeight: galleryRef.current.style.maxHeight,
      galleryFlex: galleryRef.current.style.flex,
      containerOverflow: scrollContainer?.style.overflow,
      containerHeight: scrollContainer?.style.height,
      containerMaxHeight: scrollContainer?.style.maxHeight,
      containerFlex: scrollContainer?.style.flex,
    };
    
    galleryRef.current.style.overflow = 'visible';
    galleryRef.current.style.height = 'auto';
    galleryRef.current.style.maxHeight = 'none';
    galleryRef.current.style.flex = 'none';
    
    if (scrollContainer) {
      scrollContainer.style.overflow = 'visible';
      scrollContainer.style.height = 'auto';
      scrollContainer.style.maxHeight = 'none';
      scrollContainer.style.flex = 'none';
    }
    
    try {
      const canvas = await html2canvas(galleryRef.current, {
        scale: 4,
        backgroundColor: '#f9fafb',
        useCORS: true,
        logging: false,
        imageTimeout: 0,
      });
      
      const link = document.createElement('a');
      link.download = `${activeProject.name}-polaroid.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      if (exportBtn) exportBtn.style.display = '';
      if (uploadBtn) uploadBtn.style.display = '';
      inactiveTabs.forEach(tab => tab.style.display = '');
      if (activeTabText) activeTabText.style.transform = '';
      
      galleryRef.current.style.overflow = originalStyles.galleryOverflow || '';
      galleryRef.current.style.height = originalStyles.galleryHeight || '';
      galleryRef.current.style.maxHeight = originalStyles.galleryMaxHeight || '';
      galleryRef.current.style.flex = originalStyles.galleryFlex || '';
      
      if (scrollContainer) {
        scrollContainer.style.overflow = originalStyles.containerOverflow || '';
        scrollContainer.style.height = originalStyles.containerHeight || '';
        scrollContainer.style.maxHeight = originalStyles.containerMaxHeight || '';
        scrollContainer.style.flex = originalStyles.containerFlex || '';
      }
    }
  };

  const handleExportTiled = async () => {
    if (!activeProject) return;
    setShowExportModal(false);
    
    const photos = activeProject.photos || [];
    if (photos.length === 0) return;
    
    const a4Width = 595;
    const a4Height = 842;
    const margin = 20;
    const gap = 8;
    const cols = 4;
    const rows = 4;
    const photosPerPage = cols * rows;
    
    const cellWidth = (a4Width - margin * 2 - gap * (cols - 1)) / cols;
    const cellHeight = (a4Height - margin * 2 - gap * (rows - 1)) / rows;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    };
    
    for (let i = 0; i < photos.length; i++) {
      const pageIndex = Math.floor(i / photosPerPage);
      const indexInPage = i % photosPerPage;
      
      if (indexInPage === 0 && pageIndex > 0) {
        pdf.addPage();
      }
      
      const col = indexInPage % cols;
      const row = Math.floor(indexInPage / cols);
      
      const cellX = margin + col * (cellWidth + gap);
      const cellY = margin + row * (cellHeight + gap);
      
      const img = await loadImage(photos[i]);
      const imgRatio = img.width / img.height;
      const cellRatio = cellWidth / cellHeight;
      
      let drawWidth, drawHeight;
      if (imgRatio > cellRatio) {
        drawWidth = cellWidth;
        drawHeight = cellWidth / imgRatio;
      } else {
        drawHeight = cellHeight;
        drawWidth = cellHeight * imgRatio;
      }
      
      const drawX = cellX + (cellWidth - drawWidth) / 2;
      const drawY = cellY + (cellHeight - drawHeight) / 2;
      
      pdf.addImage(photos[i], 'JPEG', drawX, drawY, drawWidth, drawHeight);
    }
    
    pdf.save(`${activeProject.name}-print.pdf`);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
        <h3 className="text-xl font-bold font-gaegu text-gray-700">No Photo Journals yet</h3>
        <p className="text-sm font-handwritten text-gray-400">Add a new project and select "Photo Journal" mode to start collecting memories!</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    
    setUrlLoading(true);
    setUrlError('');
    
    const img = new Image();
    
    img.onload = () => {
      onAddPhoto(imageUrl.trim());
      setShowAddModal(false);
      setShowUrlInput(false);
      setImageUrl('');
      setUrlLoading(false);
    };
    
    img.onerror = () => {
      setUrlError('无法加载图片，请检查链接或保存到本地上传');
      setUrlLoading(false);
    };
    
    img.src = imageUrl.trim();
  };

  const handleReplaceWithFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPhotoIndex !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdatePhoto(editingPhotoIndex, reader.result as string);
        setEditingPhotoIndex(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleReplaceWithUrl = () => {
    if (!replaceUrl.trim() || editingPhotoIndex === null) return;
    
    setReplaceLoading(true);
    setReplaceError('');
    
    const img = new Image();
    
    img.onload = () => {
      onUpdatePhoto(editingPhotoIndex, replaceUrl.trim());
      setEditingPhotoIndex(null);
      setShowReplaceUrlInput(false);
      setReplaceUrl('');
      setReplaceLoading(false);
    };
    
    img.onerror = () => {
      setReplaceError('无法加载图片');
      setReplaceLoading(false);
    };
    
    img.src = replaceUrl.trim();
  };

  const handleDeletePhoto = () => {
    if (editingPhotoIndex !== null) {
      onDeletePhoto(editingPhotoIndex);
      setEditingPhotoIndex(null);
    }
  };

  const closeEditModal = () => {
    setEditingPhotoIndex(null);
    setShowReplaceUrlInput(false);
    setReplaceUrl('');
    setReplaceError('');
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={galleryRef} className="relative flex-1 flex flex-col min-h-0">
        <div className="flex overflow-x-auto no-scrollbar gap-1 px-1 shrink-0 relative z-10">
          {projects.map(p => {
            const pColor = getProjectColor(p);
            const isActive = activeProject?.id === p.id;
            return (
              <button
                key={p.id}
                data-tab
                data-active={isActive ? 'true' : undefined}
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
                <span data-tab-text>{p.name}</span>
              </button>
            );
          })}
        </div>
        
        <div 
          data-scroll-container
          className="grid-paper border border-gray-100 rounded-lg rounded-tl-none p-3 pt-4 card-shadow flex-1 overflow-y-auto"
          style={{ borderTopColor: themeColor }}
        >
          <div className="flex justify-end mb-2" data-export-btn>
            <button
              onClick={() => setShowExportModal(true)}
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors"
              title="导出"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeProject?.photos?.map((photo, i) => (
              <div 
                key={i} 
                onClick={() => setEditingPhotoIndex(i)}
                className={`${aspectRatioClass} bg-white rounded-xl border-4 border-white shadow-md overflow-hidden transform transition-transform hover:scale-105 cursor-pointer relative group`}
                style={{ transform: `rotate(${(i % 3 === 0 ? -2 : i % 3 === 1 ? 2 : 0)}deg)` }}
              >
                <img src={photo} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-xs text-white bg-black/50 px-2 py-1 rounded">编辑</span>
                </div>
              </div>
            ))}

            <button
              data-upload-btn
              onClick={() => setShowAddModal(true)}
              className={`${aspectRatioClass} bg-white/50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 group hover:bg-white hover:border-gray-300 transition-all`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-gray-300 group-hover:text-gray-400 uppercase tracking-widest">New Moment</span>
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
          />
          <input 
            type="file" 
            ref={replaceInputRef} 
            onChange={handleReplaceWithFile} 
            className="hidden" 
            accept="image/*" 
          />

          {activeProject?.photos?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <p className="text-sm font-handwritten text-gray-300 italic">No photos in this album yet.<br/>Upload your first achievement!</p>
            </div>
          )}
        </div>
      </div>

      {editingPhotoIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeEditModal}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-gaegu text-gray-700 mb-4 text-center">编辑图片</h3>
            
            {!showReplaceUrlInput ? (
              <div className="space-y-3">
                <button
                  onClick={() => { replaceInputRef.current?.click(); }}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-700">本地图片替换</div>
                      <div className="text-xs text-gray-400">从相册选择新图片</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowReplaceUrlInput(true)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-700">网络图片替换</div>
                      <div className="text-xs text-gray-400">粘贴新图片链接</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={handleDeletePhoto}
                  className="w-full p-4 rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">删除图片</div>
                      <div className="text-xs text-red-400">从相册中移除</div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={replaceUrl}
                  onChange={e => { setReplaceUrl(e.target.value); setReplaceError(''); }}
                  placeholder="粘贴图片链接..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  autoFocus
                />
                {replaceError && (
                  <p className="text-xs text-red-400 mt-2">{replaceError}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-2">如加载失败，建议先保存图片到本地再上传</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setShowReplaceUrlInput(false); setReplaceUrl(''); setReplaceError(''); }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleReplaceWithUrl}
                    disabled={replaceLoading || !replaceUrl.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    {replaceLoading ? '加载中...' : '替换'}
                  </button>
                </div>
              </>
            )}
            
            {!showReplaceUrlInput && (
              <button
                onClick={closeEditModal}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowAddModal(false); setShowUrlInput(false); setUrlError(''); setImageUrl(''); }}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-gaegu text-gray-700 mb-4 text-center">添加图片</h3>
            
            {!showUrlInput ? (
              <div className="space-y-3">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAddModal(false); }}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-700">本地图片</div>
                      <div className="text-xs text-gray-400">从相册选择</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowUrlInput(true)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-gray-700">网络图片</div>
                      <div className="text-xs text-gray-400">粘贴图片链接</div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setUrlError(''); }}
                  placeholder="粘贴图片链接..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  autoFocus
                />
                {urlError && (
                  <p className="text-xs text-red-400 mt-2">{urlError}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-2">如加载失败，建议先保存图片到本地再上传</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setShowUrlInput(false); setUrlError(''); setImageUrl(''); }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleUrlSubmit}
                    disabled={urlLoading || !imageUrl.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    {urlLoading ? '加载中...' : '添加'}
                  </button>
                </div>
              </>
            )}
            
            {!showUrlInput && (
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-gaegu text-gray-700 mb-4 text-center">选择导出方式</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportPolaroid}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-700">宝丽来照片墙</div>
                    <div className="text-xs text-gray-400">按页面样式导出 JPG</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={handleExportTiled}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-700">平铺打印</div>
                    <div className="text-xs text-gray-400">A4 PDF 格式，适合打印</div>
                  </div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
