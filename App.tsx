
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Coffee, Plus, ChevronLeft, Star, Clock, ArrowUpDown, Trash2, 
  ChevronRight, Database, X, Zap, Sparkles, Trophy, History, 
  LayoutGrid, Settings2, Download, Upload, Target 
} from 'lucide-react';
import type { Bean, Shot, ViewState, SortOption, OriginType, RoastType } from './types';

const STORAGE_KEY = 'bean_log_data_v1';
const APP_VERSION = 'v0.1';

// We import types separately to avoid runtime issues in browser-transpilation
const App: React.FC = () => {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'bean-list' });
  const [sortOption, setSortOption] = useState<SortOption>('rating');
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
    const newBean: Bean = { ...bean, id: crypto.randomUUID(), createdAt: Date.now() };
    setBeans(prev => [newBean, ...prev]);
    setView({ type: 'bean-list' });
  };

  const deleteBean = (id: string) => {
    if (window.confirm("Archive these beans? All shot logs will be lost.")) {
      setBeans(prev => prev.filter(b => b.id !== id));
      setShots(prev => prev.filter(s => s.beanId !== id));
      setView({ type: 'bean-list' });
    }
  };

  const addShot = (shot: Omit<Shot, 'id' | 'timestamp'>) => {
    const newShot: Shot = { ...shot, id: crypto.randomUUID(), timestamp: Date.now() };
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
    link.download = `beanlog-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="max-w-xl mx-auto px-6 py-8 pb-32 fade-in min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
          <span className="text-[10px] font-black tracking-[0.4em] text-amber-500/60 uppercase">Laboratory</span>
          <h1 className="text-5xl font-display text-white mt-1">Collections</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(true)} className="btn-secondary w-14 h-14 rounded-full flex items-center justify-center text-stone-500"><Database size={24} /></button>
          <button onClick={() => setView({ type: 'add-bean' })} className="btn-primary w-14 h-14 rounded-full flex items-center justify-center text-black"><Plus size={28} strokeWidth={3} /></button>
        </div>
      </header>

      {beans.length === 0 ? (
        <div className="mt-12 text-center py-20">
          <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-white/5">
            <Coffee className="text-amber-500 w-12 h-12 opacity-50" />
          </div>
          <h3 className="text-2xl font-display text-white mb-3">No Beans Logged</h3>
          <button onClick={() => setView({ type: 'add-bean' })} className="btn-primary px-10 py-5 rounded-[2rem] font-bold text-black text-[11px]">INITIALIZE ARCHIVE</button>
        </div>
      ) : (
        <div className="space-y-6">
          {beans.map(bean => {
            const bShots = shots.filter(s => s.beanId === bean.id);
            const avgRating = bShots.length > 0 ? (bShots.reduce((a, s) => a + s.rating, 0) / bShots.length).toFixed(1) : null;
            return (
              <button key={bean.id} onClick={() => setView({ type: 'bean-details', beanId: bean.id })} className="glass-card w-full p-6 rounded-[38px] flex items-center text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">{bean.roastType}</span>
                    {avgRating && <div className="flex items-center gap-1 text-[10px] font-bold text-amber-200"><Star size={10} className="fill-amber-500 text-amber-500" />{avgRating}</div>}
                  </div>
                  <h3 className="text-2xl font-display text-white mb-0.5">{bean.name}</h3>
                  <p className="text-stone-500 text-sm font-semibold">{bean.roaster}</p>
                </div>
                <ChevronRight size={24} className="text-stone-600" />
              </button>
            );
          })}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[48px] p-10 space-y-8 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-stone-500"><X size={24} /></button>
            <div className="text-center"><Database size={40} className="text-amber-500 mx-auto mb-4" /><h3 className="text-2xl font-display text-white">Data Vault</h3></div>
            <div className="space-y-4">
              <button onClick={exportData} className="w-full flex items-center justify-between p-6 bg-white/5 rounded-3xl"><span className="text-white font-bold">Create Backup</span><Download className="text-stone-500" /></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-6 bg-white/5 rounded-3xl"><span className="text-white font-bold">Restore Data</span><Upload className="text-stone-500" /></button>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const AddBeanForm = () => {
    const [formData, setFormData] = useState({ roaster: '', name: '', originType: 'Single Origin' as OriginType, roastType: 'Medium' as RoastType, tastingNotes: '' });
    return (
      <div className="max-w-xl mx-auto px-6 py-8 pb-32 fade-in flex flex-col min-h-screen">
        <header className="flex items-center justify-between mb-16">
          <button onClick={() => setView({ type: 'bean-list' })} className="btn-secondary w-14 h-14 rounded-[24px] flex items-center justify-center text-stone-500"><ChevronLeft size={28} /></button>
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Initialize Bag</h2>
          <div className="w-14" />
        </header>
        <form onSubmit={e => { e.preventDefault(); addBean(formData); }} className="space-y-10">
          <div className="glass-card p-6 rounded-[40px] space-y-6">
            <input required type="text" placeholder="Roaster" className="w-full bg-white/5 border border-white/5 rounded-3xl p-5 text-white outline-none" value={formData.roaster} onChange={e => setFormData({ ...formData, roaster: e.target.value })} />
            <input required type="text" placeholder="Bean Name" className="w-full bg-white/5 border border-white/5 rounded-3xl p-5 text-white outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-[40px]">
              <label className="text-[10px] font-black text-stone-600 uppercase mb-4 block">Classification</label>
              {['Single Origin', 'Blend'].map(t => (
                <button key={t} type="button" onClick={() => setFormData({...formData, originType: t as OriginType})} className={`w-full py-3 mb-2 rounded-xl text-[10px] font-black ${formData.originType === t ? 'bg-amber-600 text-black' : 'bg-white/5 text-stone-500'}`}>{t}</button>
              ))}
            </div>
            <div className="glass-card p-6 rounded-[40px] overflow-auto max-h-[200px]">
              <label className="text-[10px] font-black text-stone-600 uppercase mb-4 block">Roast</label>
              {['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark'].map(r => (
                <button key={r} type="button" onClick={() => setFormData({...formData, roastType: r as RoastType})} className={`w-full text-left p-2 rounded-lg text-[10px] ${formData.roastType === r ? 'text-amber-500' : 'text-stone-600'}`}>{r}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-6 rounded-[2.5rem] font-black text-[12px] uppercase">Register Collection</button>
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
      <div className="min-h-screen bg-[#050505] fade-in pb-32">
        <div className="p-8 space-y-4">
          <button onClick={() => setView({ type: 'bean-list' })} className="btn-secondary p-3 rounded-2xl text-white"><ChevronLeft size={24} /></button>
          <h1 className="text-5xl font-display text-white">{bean.name}</h1>
          <p className="text-amber-500 font-bold tracking-widest text-xs uppercase">{bean.roaster}</p>
        </div>
        <div className="px-6 space-y-8">
          <div className="glass-card p-10 rounded-[56px] border-white/10">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-6">Best Pull</h3>
            {bestShot ? (
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-[9px] text-stone-600 uppercase">Dose</p><p className="text-3xl font-display text-white">{bestShot.dose}g</p></div>
                <div><p className="text-[9px] text-stone-600 uppercase">Yield</p><p className="text-3xl font-display text-white">{bestShot.yield}g</p></div>
                <div><p className="text-[9px] text-stone-600 uppercase">Time</p><p className="text-3xl font-display text-white">{bestShot.time}s</p></div>
              </div>
            ) : <p className="text-stone-600 italic">No logs yet.</p>}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-[11px] font-black text-stone-700 uppercase">History</h3><button onClick={() => setSortOption(s => s === 'rating' ? 'recent' : 'rating')}><ArrowUpDown size={18} className="text-stone-600" /></button></div>
            {sortedShots.map(shot => (
              <div key={shot.id} className="glass-card p-6 rounded-[32px] space-y-4">
                <div className="flex justify-between">
                  <span className="text-amber-500 font-bold">{shot.rating}/10</span>
                  <span className="text-[9px] text-stone-600">{new Date(shot.timestamp).toLocaleDateString()}</span>
                  <button onClick={() => deleteShot(shot.id)}><Trash2 size={16} className="text-stone-800" /></button>
                </div>
                <div className="flex gap-4 text-xs font-bold text-stone-400"><span>{shot.dose}g → {shot.yield}g</span><span>{shot.time}s</span><span>Grind: {shot.grindSetting}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2"><button onClick={() => setView({ type: 'add-shot', beanId })} className="btn-primary h-20 px-12 rounded-[2.5rem] flex items-center gap-4 text-black font-black uppercase"><Zap size={24} />Initialize Pull</button></div>
      </div>
    );
  };

  const AddShotForm = ({ beanId }: { beanId: string }) => {
    const last = shots.filter(s => s.beanId === beanId)[0];
    const [fd, setFd] = useState({ beanId, dose: last?.dose || 18, yield: last?.yield || 36, time: last?.time || 30, grindSetting: last?.grindSetting || '', rating: 7, notes: '' });
    return (
      <div className="max-w-xl mx-auto px-6 py-8 pb-32 fade-in min-h-screen">
        <header className="flex items-center justify-between mb-16"><button onClick={() => setView({ type: 'bean-details', beanId })} className="btn-secondary p-4 rounded-2xl"><ChevronLeft size={28} /></button><h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Log Protocol</h2><div className="w-14"/></header>
        <form onSubmit={e => { e.preventDefault(); addShot(fd); }} className="space-y-8">
          <div className="glass-card p-10 rounded-[56px] space-y-10">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div><label className="text-[9px] text-stone-600 uppercase block mb-2">Dose</label><input type="number" step="0.1" className="w-full bg-white/5 p-4 rounded-2xl text-2xl font-display text-center outline-none" value={fd.dose} onChange={e => setFd({...fd, dose: +e.target.value})} /></div>
              <div><label className="text-[9px] text-stone-600 uppercase block mb-2">Yield</label><input type="number" step="0.5" className="w-full bg-white/5 p-4 rounded-2xl text-2xl font-display text-center outline-none" value={fd.yield} onChange={e => setFd({...fd, yield: +e.target.value})} /></div>
            </div>
            <div className="text-center"><label className="text-[9px] text-stone-600 uppercase block mb-4">Seconds</label><input type="number" className="w-full bg-white/5 p-8 rounded-3xl text-6xl font-display text-center outline-none" value={fd.time} onChange={e => setFd({...fd, time: +e.target.value})} /></div>
          </div>
          <div className="glass-card p-10 rounded-[56px]"><label className="text-[9px] text-stone-600 uppercase mb-4 block">Grind Setting</label><input type="text" className="w-full bg-white/5 p-6 rounded-3xl text-3xl font-display outline-none text-amber-500" value={fd.grindSetting} onChange={e => setFd({...fd, grindSetting: e.target.value})} /></div>
          <div className="glass-card p-10 rounded-[56px]"><label className="text-[9px] text-stone-600 uppercase mb-4 block">Rating: {fd.rating}/10</label><input type="range" min="1" max="10" className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" value={fd.rating} onChange={e => setFd({...fd, rating: +e.target.value})} /></div>
          <button type="submit" className="btn-primary w-full py-8 rounded-[3rem] font-black uppercase text-black">Commit Extraction</button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100 overflow-x-hidden">
      {view.type === 'bean-list' && <BeanList />}
      {view.type === 'add-bean' && <AddBeanForm />}
      {view.type === 'bean-details' && <BeanDetails beanId={view.beanId} />}
      {view.type === 'add-shot' && <AddShotForm beanId={view.beanId} />}
    </div>
  );
};

export default App;
