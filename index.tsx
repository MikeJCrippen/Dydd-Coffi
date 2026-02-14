import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Coffee, Plus, ChevronLeft, Star, ArrowUpDown, Trash2, 
  ChevronRight, Database, X, Zap, Download, Upload, Edit3, Camera
} from 'lucide-react';

// --- Global Type Extensions ---
declare global {
  interface Window {
    emergencyReset: () => Promise<void>;
  }
}

// --- Types ---
type OriginType = 'Single Origin' | 'Blend';
type RoastType = 'Light' | 'Light-Medium' | 'Medium' | 'Medium-Dark' | 'Dark';

interface Bean {
  id: string;
  roaster: string;
  name: string;
  originType: OriginType;
  roastType: RoastType;
  tastingNotes: string;
  image?: string; // Base64 compressed image
  createdAt: number;
}

interface Shot {
  id: string;
  beanId: string;
  timestamp: number;
  dose: number;
  yield: number;
  time: number;
  grindSetting: string;
  rating: number;
  notes: string;
}

type ViewState = 
  | { type: 'bean-list' }
  | { type: 'add-bean' }
  | { type: 'edit-bean'; beanId: string }
  | { type: 'bean-details'; beanId: string }
  | { type: 'add-shot'; beanId: string };

const STORAGE_KEY = 'bean_log_data_v1';

// Stable UUID Fallback for local/non-secure contexts
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID is restricted
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- Utilities ---
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- App Component ---
const App: React.FC = () => {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'bean-list' });
  const [sortOption, setSortOption] = useState<'rating' | 'recent'>('rating');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBeans(parsed.beans || []);
        setShots(parsed.shots || []);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ beans, shots }));
  }, [beans, shots]);

  const addBean = (bean: Omit<Bean, 'id' | 'createdAt'>) => {
    const newBean: Bean = { ...bean, id: generateUUID(), createdAt: Date.now() };
    setBeans(prev => [newBean, ...prev]);
    setView({ type: 'bean-list' });
  };

  const updateBean = (id: string, updates: Omit<Bean, 'id' | 'createdAt'>) => {
    setBeans(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setView({ type: 'bean-details', beanId: id });
  };

  const deleteBean = (id: string) => {
    if (window.confirm("Archive these beans? All shot logs will be lost.")) {
      setBeans(prev => prev.filter(b => b.id !== id));
      setShots(prev => prev.filter(s => s.beanId !== id));
      setView({ type: 'bean-list' });
    }
  };

  const addShot = (shot: Omit<Shot, 'id' | 'timestamp'>) => {
    const newShot: Shot = { ...shot, id: generateUUID(), timestamp: Date.now() };
    setShots(prev => [newShot, ...prev]);
    setView({ type: 'bean-details', beanId: shot.beanId });
  };

  const deleteShot = (id: string) => {
    if (window.confirm("Remove this log entry?")) {
      setShots(prev => prev.filter(s => s.id !== id));
    }
  };

  const exportData = () => {
    const data = JSON.stringify({ beans, shots }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bragupro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        if (parsed.beans && parsed.shots) {
          if (window.confirm("Overwrite current logs with backup?")) {
            setBeans(parsed.beans);
            setShots(parsed.shots);
            setShowSettings(false);
          }
        }
      } catch (err) { alert("Invalid file"); }
    };
    reader.readAsText(file);
  };

  const BeanList = () => (
    <div className="max-w-xl mx-auto px-6 pt-safe pb-safe min-h-[100dvh] flex flex-col fade-in">
      <header className="flex justify-between items-center mb-12 mt-2 px-2">
        <div className="flex-1 min-w-0 pr-6">
          <span className="text-[10px] font-black tracking-[0.4em] text-amber-500/60 uppercase">Bragu Pro v0.5.1</span>
          <h1 className="text-4xl font-display text-white mt-1 leading-tight truncate">Collections</h1>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setShowSettings(true)} className="w-14 h-14 rounded-full flex items-center justify-center text-stone-500 glass-card border-white/5"><Database size={22} /></button>
          <button onClick={() => setView({ type: 'add-bean' })} className="btn-primary w-14 h-14 rounded-full flex items-center justify-center text-black shadow-amber-500/20 shadow-2xl"><Plus size={26} strokeWidth={3} /></button>
        </div>
      </header>

      {beans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
            <Coffee className="text-amber-500 w-12 h-12 opacity-50" />
          </div>
          <h3 className="text-2xl font-display text-white mb-3 text-center">Archive Empty</h3>
          <button onClick={() => setView({ type: 'add-bean' })} className="btn-primary px-10 py-5 rounded-[2rem] font-bold text-black text-[11px]">INITIALIZE ARCHIVE</button>
        </div>
      ) : (
        <div className="space-y-6 pb-32">
          {beans.map(bean => {
            const bShots = shots.filter(s => s.beanId === bean.id);
            const avgRating = bShots.length > 0 ? (bShots.reduce((a, s) => a + s.rating, 0) / bShots.length).toFixed(1) : null;
            return (
              <button key={bean.id} onClick={() => setView({ type: 'bean-details', beanId: bean.id })} className="glass-card w-full p-4 rounded-[38px] flex items-center text-left transition-transform active:scale-[0.98]">
                <div className="w-20 h-20 rounded-[28px] overflow-hidden mr-5 bg-stone-900 border border-white/5 flex-shrink-0">
                  {bean.image ? (
                    <img src={bean.image} className="w-full h-full object-cover opacity-80" alt={bean.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Coffee className="text-stone-700" size={24} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-sm">{bean.roastType}</span>
                    {avgRating && <div className="flex items-center gap-1 text-[9px] font-bold text-amber-200/80"><Star size={8} className="fill-amber-500 text-amber-500" />{avgRating}</div>}
                  </div>
                  <h3 className="text-xl font-display text-white mb-0.5 truncate">{bean.name}</h3>
                  <p className="text-stone-500 text-xs font-semibold truncate">{bean.roaster}</p>
                </div>
                <ChevronRight size={20} className="text-stone-600 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-12 bg-black/90 backdrop-blur-xl">
          <div className="glass-card w-full max-w-md rounded-[56px] p-10 space-y-8 relative mb-safe shadow-2xl border-white/20">
            <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 text-stone-500 p-2"><X size={24} /></button>
            <div className="text-center pt-4">
                <Database size={48} className="text-amber-500 mx-auto mb-6" />
                <h3 className="text-3xl font-display text-white mb-1">Data Vault</h3>
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">v0.5.1 Stable Archive</p>
            </div>
            <div className="space-y-4 pt-4">
              <button onClick={exportData} className="w-full flex items-center justify-between p-7 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-colors"><span className="text-white font-bold">Export Backup</span><Download className="text-stone-500" /></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-7 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-colors"><span className="text-white font-bold">Restore Backup</span><Upload className="text-stone-500" /></button>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              <button onClick={() => window.emergencyReset()} className="w-full py-4 text-stone-600 text-[10px] font-black uppercase tracking-widest">Reboot System</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const BeanForm = ({ beanId }: { beanId?: string }) => {
    const existing = beanId ? beans.find(b => b.id === beanId) : null;
    const [formData, setFormData] = useState({ 
      roaster: existing?.roaster || '', 
      name: existing?.name || '', 
      originType: existing?.originType || 'Single Origin' as OriginType, 
      roastType: existing?.roastType || 'Medium' as RoastType, 
      tastingNotes: existing?.tastingNotes || '',
      image: existing?.image || ''
    });
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const compressed = await compressImage(file);
          setFormData({ ...formData, image: compressed });
        } catch (err) { alert("Failed to process image."); }
      }
    };

    return (
      <div className="max-w-xl mx-auto px-6 pt-safe pb-safe min-h-[100dvh] flex flex-col fade-in">
        <header className="flex items-center justify-between mb-10 mt-2 px-2">
          <button onClick={() => setView(existing ? { type: 'bean-details', beanId: existing.id } : { type: 'bean-list' })} className="glass-card w-14 h-14 rounded-full flex items-center justify-center text-stone-500"><ChevronLeft size={28} /></button>
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{existing ? 'Modify' : 'Initialize'} Bag</h2>
          <div className="w-14" />
        </header>

        <form onSubmit={e => { e.preventDefault(); existing ? updateBean(existing.id, formData) : addBean(formData); }} className="space-y-10 flex-1 flex flex-col">
          <div className="flex justify-center mb-4">
            <button type="button" onClick={() => photoInputRef.current?.click()} className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden glass-card border-white/10 flex items-center justify-center transition-transform active:scale-95 group">
              {formData.image ? (
                <>
                  <img src={formData.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Edit3 size={24} className="text-white" /></div>
                </>
              ) : (
                <div className="text-center">
                  <Camera size={32} className="text-stone-600 mx-auto mb-2" />
                  <span className="text-[8px] font-black uppercase text-stone-600 tracking-tighter">Add Photo</span>
                </div>
              )}
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </button>
          </div>

          <div className="glass-card p-8 rounded-[48px] space-y-6 shadow-2xl">
            <input required type="text" placeholder="Roaster" className="w-full bg-white/5 border border-white/5 rounded-[2rem] p-6 text-white outline-none focus:border-amber-500/30 transition-colors" value={formData.roaster} onChange={e => setFormData({ ...formData, roaster: e.target.value })} />
            <input required type="text" placeholder="Bean Name" className="w-full bg-white/5 border border-white/5 rounded-[2rem] p-6 text-white outline-none focus:border-amber-500/30 transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-8 rounded-[48px]">
              <label className="text-[10px] font-black text-stone-600 uppercase mb-6 block">Classification</label>
              {['Single Origin', 'Blend'].map(t => (
                <button key={t} type="button" onClick={() => setFormData({...formData, originType: t as OriginType})} className={`w-full py-4 mb-3 rounded-2xl text-[10px] font-black transition-all ${formData.originType === t ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-stone-500 hover:text-stone-300'}`}>{t}</button>
              ))}
            </div>
            <div className="glass-card p-8 rounded-[48px] overflow-auto max-h-[300px]">
              <label className="text-[10px] font-black text-stone-600 uppercase mb-6 block">Roast</label>
              {['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark'].map(r => (
                <button key={r} type="button" onClick={() => setFormData({...formData, roastType: r as RoastType})} className={`w-full text-left p-2.5 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${formData.roastType === r ? 'text-amber-500' : 'text-stone-600 hover:text-stone-400'}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 rounded-[48px] shadow-xl">
            <label className="text-[10px] font-black text-stone-600 uppercase mb-4 block">Tasting Notes</label>
            <textarea 
              placeholder="e.g. Milk Chocolate, Stone Fruit..." 
              className="w-full bg-white/5 border border-white/5 rounded-[2rem] p-6 text-white outline-none focus:border-amber-500/30 transition-colors min-h-[120px] resize-none" 
              value={formData.tastingNotes} 
              onChange={e => setFormData({ ...formData, tastingNotes: e.target.value })}
            />
          </div>

          <div className="mt-auto pb-10">
            <button type="submit" className="btn-primary w-full py-7 rounded-[3rem] font-black text-[14px] uppercase shadow-2xl">
              {existing ? 'Apply Telemetry' : 'Register Bag'}
            </button>
            {existing && (
              <button type="button" onClick={() => deleteBean(existing.id)} className="w-full mt-4 py-4 text-red-500/50 text-[10px] font-black uppercase tracking-widest">Delete Collection</button>
            )}
          </div>
        </form>
      </div>
    );
  };

  const BeanDetails = ({ beanId }: { beanId: string }) => {
    const bean = beans.find(b => b.id === beanId);
    if (!bean) return null;
    const bShots = shots.filter(s => s.beanId === beanId);
    const bestShot = bShots.sort((a, b) => b.rating - a.rating)[0];
    const sortedShots = [...bShots].sort((a, b) => sortOption === 'rating' ? b.rating - a.rating : b.timestamp - a.timestamp);

    return (
      <div className="min-h-[100dvh] pt-safe pb-safe bg-[#050505] fade-in flex flex-col">
        <div className="relative h-[45vh] w-full overflow-hidden">
          {bean.image ? (
            <img src={bean.image} className="absolute inset-0 w-full h-full object-cover" alt={bean.name} />
          ) : (
            <div className="absolute inset-0 bg-stone-900 flex items-center justify-center opacity-30"><Coffee size={120} className="text-stone-700" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#050505]" />
          
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center mt-2">
            <button onClick={() => setView({ type: 'bean-list' })} className="glass-card p-4 rounded-3xl text-white backdrop-blur-md transition-transform active:scale-95"><ChevronLeft size={24} /></button>
            <button onClick={() => setView({ type: 'edit-bean', beanId: bean.id })} className="glass-card p-4 rounded-3xl text-white backdrop-blur-md transition-transform active:scale-95"><Edit3 size={20} /></button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-10 pb-4">
            <p className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase mb-3">{bean.roaster}</p>
            <h1 className="text-5xl font-display text-white leading-tight tracking-tight drop-shadow-2xl">{bean.name}</h1>
          </div>
        </div>
        
        <div className="px-6 space-y-8 flex-1 pb-40">
          <div className="flex gap-4">
            <div className="glass-card flex-1 p-5 rounded-[2.5rem] text-center">
              <span className="text-[8px] font-black text-stone-600 uppercase block mb-1">Roast</span>
              <span className="text-xs font-bold text-stone-200">{bean.roastType}</span>
            </div>
            <div className="glass-card flex-1 p-5 rounded-[2.5rem] text-center">
              <span className="text-[8px] font-black text-stone-600 uppercase block mb-1">Origin</span>
              <span className="text-xs font-bold text-stone-200">{bean.originType}</span>
            </div>
          </div>

          {bean.tastingNotes && (
             <div className="glass-card p-8 rounded-[48px] border-white/5">
                <h3 className="text-[10px] font-black text-stone-700 uppercase tracking-widest mb-3">Tasting Notes</h3>
                <p className="text-stone-300 font-medium leading-relaxed italic">"{bean.tastingNotes}"</p>
             </div>
          )}

          <div className="glass-card p-12 rounded-[64px] border-white/10 shadow-2xl relative overflow-hidden bg-white/[0.02]">
            <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-8 text-center">Optimal Extraction</h3>
            {bestShot ? (
              <div className="grid grid-cols-3 gap-6 text-center relative z-10">
                <div><p className="text-[9px] text-stone-600 uppercase font-black mb-2">Dose</p><p className="text-4xl font-display text-white">{bestShot.dose}<span className="text-xs ml-0.5 opacity-40 font-sans">g</span></p></div>
                <div><p className="text-[9px] text-stone-600 uppercase font-black mb-2">Yield</p><p className="text-4xl font-display text-white">{bestShot.yield}<span className="text-xs ml-0.5 opacity-40 font-sans">g</span></p></div>
                <div><p className="text-[9px] text-stone-600 uppercase font-black mb-2">Time</p><p className="text-4xl font-display text-white">{bestShot.time}<span className="text-xs ml-0.5 opacity-40 font-sans">s</span></p></div>
              </div>
            ) : <p className="text-stone-600 italic text-center py-4 font-bold">No telemetry recorded yet.</p>}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-4"><h3 className="text-[11px] font-black text-stone-700 uppercase tracking-widest">Extraction History</h3><button onClick={() => setSortOption(s => s === 'rating' ? 'recent' : 'rating')} className="p-2 text-stone-600 active:text-amber-500 transition-colors"><ArrowUpDown size={18} /></button></div>
            {sortedShots.length === 0 && (
               <div className="text-center py-12 text-stone-700 font-black text-[10px] uppercase tracking-widest">Zero entries in archive</div>
            )}
            {sortedShots.map(shot => (
              <div key={shot.id} className="glass-card p-7 rounded-[42px] space-y-4 border-white/5 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 text-black px-3 py-1 rounded-full text-[11px] font-black shadow-lg shadow-amber-500/10">{shot.rating}/10</div>
                    <span className="text-[10px] font-black text-stone-600 uppercase tracking-tighter">{new Date(shot.timestamp).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteShot(shot.id)} className="p-2 bg-white/5 rounded-full active:bg-red-500/20"><Trash2 size={16} className="text-stone-700" /></button>
                </div>
                <div className="flex justify-between text-[13px] font-bold text-stone-300 px-1">
                  <span className="opacity-80">{shot.dose}g → {shot.yield}g</span>
                  <span className="opacity-80">{shot.time}s</span>
                  <span className="text-amber-500/60 font-black uppercase text-[10px] tracking-widest">G:{shot.grindSetting}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 pt-12 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-40">
          <button onClick={() => setView({ type: 'add-shot', beanId })} className="btn-primary w-full h-20 rounded-[2.5rem] flex items-center justify-center gap-4 text-black font-black uppercase shadow-2xl shadow-amber-500/30 mb-safe active:scale-[0.98] transition-transform"><Zap size={24} />Record Extraction</button>
        </div>
      </div>
    );
  };

  const AddShotForm = ({ beanId }: { beanId: string }) => {
    const last = shots.filter(s => s.beanId === beanId)[0];
    const [fd, setFd] = useState({ beanId, dose: last?.dose || 18, yield: last?.yield || 36, time: last?.time || 30, grindSetting: last?.grindSetting || '', rating: 7, notes: '' });
    return (
      <div className="max-w-xl mx-auto px-6 pt-safe pb-safe min-h-[100dvh] flex flex-col fade-in">
        <header className="flex items-center justify-between mb-16 mt-2 px-2">
          <button onClick={() => setView({ type: 'bean-details', beanId })} className="glass-card p-4 rounded-full transition-transform active:scale-90"><ChevronLeft size={28} /></button>
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Log Protocol</h2>
          <div className="w-14"/>
        </header>
        <form onSubmit={e => { e.preventDefault(); addShot(fd); }} className="space-y-8 flex-1 flex flex-col">
          <div className="glass-card p-12 rounded-[64px] space-y-12 shadow-2xl">
            <div className="grid grid-cols-2 gap-10 text-center">
              <div><label className="text-[10px] text-stone-600 uppercase font-black block mb-4">Dose (g)</label><input type="number" step="0.1" className="w-full bg-white/5 p-5 rounded-3xl text-3xl font-display text-center outline-none text-white focus:border-amber-500/20 border border-transparent" value={fd.dose} onChange={e => setFd({...fd, dose: +e.target.value})} /></div>
              <div><label className="text-[10px] text-stone-600 uppercase font-black block mb-4">Yield (g)</label><input type="number" step="0.5" className="w-full bg-white/5 p-5 rounded-3xl text-3xl font-display text-center outline-none text-white focus:border-amber-500/20 border border-transparent" value={fd.yield} onChange={e => setFd({...fd, yield: +e.target.value})} /></div>
            </div>
            <div className="text-center relative">
                <label className="text-[10px] text-stone-600 uppercase font-black block mb-4">Seconds</label>
                <input type="number" className="w-full bg-white/5 p-10 rounded-[3rem] text-7xl font-display text-center outline-none text-white focus:border-amber-500/20 border border-transparent" value={fd.time} onChange={e => setFd({...fd, time: +e.target.value})} />
                <div className="absolute top-1/2 right-12 translate-y-2 opacity-20 text-4xl font-display">s</div>
            </div>
          </div>
          <div className="glass-card p-10 rounded-[56px] space-y-8 shadow-xl">
            <div><label className="text-[10px] text-stone-600 uppercase font-black mb-6 block">Grind Index</label><input type="text" className="w-full bg-white/5 p-6 rounded-[2rem] text-4xl font-display outline-none text-amber-500 text-center focus:border-amber-500/20 border border-transparent" placeholder="..." value={fd.grindSetting} onChange={e => setFd({...fd, grindSetting: e.target.value})} /></div>
            <div>
                <div className="flex justify-between items-center mb-6 px-2"><label className="text-[10px] text-stone-600 uppercase font-black">Success Rate</label><span className="text-amber-500 font-black text-xl">{fd.rating}/10</span></div>
                <input type="range" min="1" max="10" className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" value={fd.rating} onChange={e => setFd({...fd, rating: +e.target.value})} />
            </div>
          </div>
          <div className="mt-auto pb-10">
            <button type="submit" className="btn-primary w-full py-8 rounded-[3.5rem] font-black uppercase text-black shadow-2xl text-[16px] tracking-widest active:scale-[0.98] transition-transform">Commit Extraction</button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#050505] text-stone-100 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {view.type === 'bean-list' && <BeanList />}
        {view.type === 'add-bean' && <BeanForm />}
        {view.type === 'edit-bean' && <BeanForm beanId={view.beanId} />}
        {view.type === 'bean-details' && <BeanDetails beanId={view.beanId} />}
        {view.type === 'add-shot' && <AddShotForm beanId={view.beanId} />}
      </div>
    </div>
  );
};

// Implement emergencyReset utility
window.emergencyReset = async () => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    const cacheKeys = await caches.keys();
    for (const key of cacheKeys) {
      await caches.delete(key);
    }
  } catch (e) {}
  window.location.reload();
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
