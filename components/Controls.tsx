import React from 'react';
import { QuantumNumbers, ViewMode } from '../types';
import { Atom, Info, Zap, Box, RotateCw } from 'lucide-react';

interface ControlsProps {
  value: QuantumNumbers;
  onChange: (newVal: QuantumNumbers) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  autoRotate: boolean;
  onAutoRotateChange: (rotate: boolean) => void;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  value, 
  onChange, 
  viewMode, 
  onViewModeChange, 
  autoRotate,
  onAutoRotateChange,
  disabled 
}) => {
  
  // Logic to enforce valid quantum numbers:
  // n > 0
  // 0 <= l < n
  // -l <= m <= l

  const handleChange = (key: keyof QuantumNumbers, newVal: number) => {
    let updated = { ...value, [key]: newVal };
    
    // Validation constraints
    if (key === 'n') {
      if (newVal < 1) newVal = 1;
      if (newVal > 7) newVal = 7; // limit for performance
      updated.n = newVal;
      // Reset l if it violates n
      if (updated.l >= newVal) updated.l = newVal - 1;
      // Reset m if it violates l
      if (Math.abs(updated.m) > updated.l) updated.m = 0;
    }

    if (key === 'l') {
      if (newVal < 0) newVal = 0;
      if (newVal >= updated.n) newVal = updated.n - 1;
      updated.l = newVal;
      if (Math.abs(updated.m) > newVal) updated.m = 0;
    }

    if (key === 'm') {
      if (newVal < -updated.l) newVal = -updated.l;
      if (newVal > updated.l) newVal = updated.l;
      updated.m = newVal;
    }

    onChange(updated);
  };

  const orbitalMap = ['s', 'p', 'd', 'f', 'g', 'h'];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-xl w-full md:w-80 shadow-2xl flex flex-col gap-6 max-h-[80vh] overflow-y-auto overscroll-contain custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(71, 85, 105, 0.8);
          border-radius: 8px;
          border: 2px solid rgba(30, 41, 59, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 1);
        }
      `}</style>
      <div className="flex items-center gap-3 text-science-500 mb-2">
        <Atom className="w-7 h-7" />
        <h2 className="text-2xl font-bold text-white">轨道配置</h2>
      </div>

      {/* View Mode Toggle - Made Prominent */}
      <div className="space-y-3 pb-2 border-b border-slate-800">
        <label className="text-slate-300 font-bold text-sm uppercase tracking-wider">可视化模式</label>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onViewModeChange('points')}
            title="显示概率点云"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-base font-bold transition-all ${
              viewMode === 'points' 
                ? 'bg-science-600 text-white shadow-lg shadow-science-900/50' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-5 h-5" />
            点云
          </button>
          <button
            onClick={() => onViewModeChange('surface')}
            title="显示平滑等值面"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-base font-bold transition-all ${
              viewMode === 'surface' 
                ? 'bg-science-600 text-white shadow-lg shadow-science-900/50' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Box className="w-5 h-5" />
            实体
          </button>
        </div>
      </div>

      {/* Auto Rotate Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <label className="text-slate-300 font-bold text-sm uppercase tracking-wider">自动旋转</label>
        <button
          onClick={() => onAutoRotateChange(!autoRotate)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            autoRotate 
              ? 'bg-science-600/20 text-science-400 border border-science-500/50' 
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          {autoRotate ? '开启' : '关闭'}
        </button>
      </div>

      {/* N Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-base">
          <label className="text-slate-300 font-medium">主量子数 (n)</label>
          <span className="text-science-500 font-bold font-mono text-lg">{value.n}</span>
        </div>
        <input
          type="range"
          min="1"
          max="7"
          step="1"
          value={value.n}
          onChange={(e) => handleChange('n', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-science-500 hover:accent-science-400 transition-all"
        />
        <p className="text-sm text-slate-500">决定轨道的大小和能量等级。</p>
      </div>

      {/* L Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-base">
          <label className="text-slate-300 font-medium">角量子数 (l)</label>
          <span className="text-science-500 font-bold font-mono text-lg">
            {value.l} <span className="text-slate-500">({orbitalMap[value.l] || '?'})</span>
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0, value.n - 1)}
          step="1"
          value={value.l}
          onChange={(e) => handleChange('l', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-science-500 hover:accent-science-400 transition-all"
        />
        <p className="text-sm text-slate-500">决定轨道的形状 (s, p, d, f)。</p>
      </div>

      {/* M Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-base">
          <label className="text-slate-300 font-medium">磁量子数 (m)</label>
          <span className="text-science-500 font-bold font-mono text-lg">{value.m}</span>
        </div>
        <input
          type="range"
          min={-value.l}
          max={value.l}
          step="1"
          value={value.m}
          onChange={(e) => handleChange('m', parseInt(e.target.value))}
          disabled={value.l === 0 || disabled}
          className={`w-full h-2.5 rounded-lg appearance-none transition-all ${
            value.l === 0 
            ? 'bg-slate-800 cursor-not-allowed' 
            : 'bg-slate-700 cursor-pointer accent-science-500 hover:accent-science-400'
          }`}
        />
        <p className="text-sm text-slate-500">决定轨道在空间中的取向。</p>
      </div>

      <div className="pt-4 border-t border-slate-700 space-y-3">
         <div className="flex items-center gap-2 text-sm text-slate-400">
             <Info className="w-4 h-4" />
             <span>调整滑块以查看 3D 结构。</span>
         </div>
         <div className="text-xs text-slate-500 flex flex-col gap-1">
             <div>作者: OwenLiu04</div>
             <div>邮箱: lf19902001@qq.com</div>
         </div>
      </div>
    </div>
  );
};