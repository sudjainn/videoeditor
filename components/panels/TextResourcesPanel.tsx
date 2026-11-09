
import React, { useState } from 'react';
import { ChevronsLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { ANIMATIONS } from '../PropertiesPanel';
import { INSTAGRAM_FONTS } from '../../utils/fontLibrary';

interface TextResourcesPanelProps {
  onAddText: (options: any) => void;
  onClose: () => void;
}

export const TextResourcesPanel: React.FC<TextResourcesPanelProps> = ({ onAddText, onClose }) => {
  const [showAnimations, setShowAnimations] = useState(false);

  const itemClass = "w-full p-3 bg-gray-50 dark:bg-[#27272a] hover:bg-gray-100 dark:hover:bg-[#3f3f46] rounded text-left transition-colors border border-gray-200 dark:border-[#3f3f46] hover:border-gray-400 dark:hover:border-gray-500";
  const textClass = "text-gray-900 dark:text-gray-200";

  const renderFontButton = (font: typeof INSTAGRAM_FONTS[0]) => (
    <button 
      key={font.label} 
      onClick={() => onAddText({ text: font.label, fontSize: 50, fontFamily: font.family, fontWeight: font.weight, fontStyle: (font as any).style })} 
      className={`${itemClass} p-2`} 
      style={{ fontFamily: font.family, fontWeight: font.weight || 400, fontStyle: (font as any).style || 'normal' }}
    >
      <span className={`text-base ${textClass}`}>{font.label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] w-full md:w-[320px] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#27272a]">
        <h2 className="font-semibold text-gray-900 dark:text-white">Text</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronsLeft size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Basic Text */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Basic text</h3>
          <div className="space-y-2">
            <button onClick={() => onAddText({ text: 'Add a heading', fontSize: 80, fontWeight: 700 })} className={itemClass}>
              <span className={`text-2xl font-bold ${textClass} block`}>Add a heading</span>
            </button>
            <button onClick={() => onAddText({ text: 'Add a subheading', fontSize: 50, fontWeight: 500 })} className={itemClass}>
              <span className={`text-lg font-medium ${textClass} block`}>Add a subheading</span>
            </button>
            <button onClick={() => onAddText({ text: 'Add body text', fontSize: 30, fontWeight: 400 })} className={itemClass}>
              <span className={`text-sm font-normal ${textClass} block`}>Add body text</span>
            </button>
          </div>
        </div>
        
        {/* Animated Section - Collapsible */}
        <div>
          <button 
            onClick={() => setShowAnimations(!showAnimations)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-900 dark:text-white mb-3 hover:text-primary-500 transition-colors"
          >
            <span>Animated</span>
            {showAnimations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showAnimations && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {ANIMATIONS.filter(a => a.value !== '').map(anim => (
                <button
                  key={anim.value}
                  onClick={() => onAddText({ text: anim.label, fontSize: 60, animation: anim.value })}
                  className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] rounded hover:bg-gray-100 dark:hover:bg-[#3f3f46] hover:border-gray-400 dark:hover:border-gray-500 transition-all group"
                >
                  <span className="text-lg font-bold text-primary-500 dark:text-primary-400 mb-1">ABC</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">{anim.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sans Serif */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Sans Serif</h3>
          <div className="space-y-2">
            {INSTAGRAM_FONTS.filter(f => f.category === 'sans').map(renderFontButton)}
          </div>
        </div>

        {/* Serif */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Serif</h3>
          <div className="space-y-2">
            {INSTAGRAM_FONTS.filter(f => f.category === 'serif').map(renderFontButton)}
          </div>
        </div>

        {/* Monospace */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Monospace</h3>
          <div className="space-y-2">
            {INSTAGRAM_FONTS.filter(f => f.category === 'mono').map(renderFontButton)}
          </div>
        </div>

      </div>
    </div>
  );
};
