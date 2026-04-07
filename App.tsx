import React, { useState, useEffect } from 'react';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { QuantumNumbers, ViewMode } from './types';
import { Menu, X } from 'lucide-react';

import { startPreWarming, PreWarmProgress } from './services/prewarmer';

const App: React.FC = () => {
  const [quantumNumbers, setQuantumNumbers] = useState<QuantumNumbers>({ n: 2, l: 1, m: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('points');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showUI, setShowUI] = useState<boolean>(true);
  const [preWarm, setPreWarm] = useState<PreWarmProgress>({ current: 0, total: 0, isDone: false });

  useEffect(() => {
    // Start pre-warming all orbitals in the background
    startPreWarming((progress) => {
      setPreWarm(progress);
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Visualizer 
          quantumNumbers={quantumNumbers} 
          mode={viewMode} 
          autoRotate={autoRotate}
        />
      </div>

      {/* Header / Toggle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
        <button 
          onClick={() => setShowUI(!showUI)}
          className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-slate-600"
        >
          {showUI ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md hidden sm:block">
          量子<span className="text-science-500">轨道</span>可视化
        </h1>
      </div>

      {/* UI Overlay */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none flex flex-col md:flex-row justify-between p-4 md:p-8 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0'}`}
      >
        
        {/* Left: Controls */}
        <div className={`pointer-events-auto transition-transform duration-500 ${showUI ? 'translate-x-0' : '-translate-x-20'}`}>
          <div className="mt-16 md:mt-0">
             {/* Pre-warming Status */}
            {!preWarm.isDone && preWarm.total > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
                  <span>正在预热轨道模型</span>
                  <span>{Math.round((preWarm.current / preWarm.total) * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-science-500 transition-all duration-300" 
                    style={{ width: `${(preWarm.current / preWarm.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Controls 
              value={quantumNumbers} 
              onChange={setQuantumNumbers} 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              autoRotate={autoRotate}
              onAutoRotateChange={setAutoRotate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
