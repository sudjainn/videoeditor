
import React from 'react';
import { CanvasSettings } from '../../types';
import { ChevronsLeft } from 'lucide-react';
import { ColorPickerButton } from '../InputGroups';

interface SettingsPanelProps {
  settings: CanvasSettings;
  duration: number;
  onUpdateSettings: (settings: Partial<CanvasSettings>) => void;
  onUpdateDuration: (duration: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { name: '1:1', width: 1080, height: 1080, label: '1080x1080px' },
  { name: '1:1', width: 720, height: 720, label: '720x720px' },
  { name: '1:1', width: 600, height: 600, label: '600x600px' },
  { name: '4:5', width: 1080, height: 1350, label: '1080x1350px' },
  { name: '16:9', width: 1280, height: 720, label: '1280x720px' },
  { name: '16:9', width: 640, height: 360, label: '640x360px' },
  { name: '9:16', width: 720, height: 1280, label: '720x1280px' },
  { name: '9:16', width: 360, height: 640, label: '360x640px' },
  { name: '4:3', width: 640, height: 480, label: '640x480px' },
  { name: '4:3', width: 480, height: 360, label: '480x360px' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  duration,
  onUpdateSettings,
  onUpdateDuration,
  onClose
}) => {
  const inputClass = "bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] overflow-y-auto w-full md:w-[280px]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white">Settings</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Canvas Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Canvas Settings</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => onUpdateSettings({ width: parseInt(e.target.value) })}
                className={`col-span-2 ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => onUpdateSettings({ height: parseInt(e.target.value) })}
                className={`col-span-2 ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Background</label>
              <div className="col-span-2 flex gap-2">
                <ColorPickerButton color={settings.backgroundColor || '#ffffff'} picker='accent' onChange={(val) => onUpdateSettings({ backgroundColor: val })} label='' />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                  className={`flex-1 ${inputClass} uppercase`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#27272a]">
              <label className="text-xs text-gray-500 dark:text-gray-400">Duration (sec)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => onUpdateDuration(parseInt(e.target.value))}
                className={`col-span-2 ${inputClass}`}
              />
            </div>
          </div>
        </div>

        {/* Presets */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset, index) => {
              const isActive = settings.width === preset.width && settings.height === preset.height;
              return (
                <button
                  key={index}
                  onClick={() => onUpdateSettings({ width: preset.width, height: preset.height })}
                  className={`flex flex-col items-center justify-center p-3 border rounded transition-all group ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 ring-1 ring-primary-500' 
                      : 'bg-gray-50 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] hover:bg-gray-100 dark:hover:bg-[#3f3f46] hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <span className={`text-sm font-medium ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {preset.name}
                  </span>
                  <span className={`text-[10px] mt-1 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`}>
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
