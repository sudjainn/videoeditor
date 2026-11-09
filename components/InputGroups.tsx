import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import Chrome from "@uiw/react-color-chrome";

interface UpdateProps {
  [key: string]: any;
}

// Universal Number Input Pair (X/Y, Offset, Position, etc.)
export const NumberInputPair = ({
  labelX,
  labelY,
  valueX,
  valueY,
  onChange,
  className = "",
}: {
  labelX: string;
  labelY: string;
  valueX: number;
  valueY: number;
  onChange: (props: UpdateProps) => void;
  className?: string;
}) => (
  <div className={`grid grid-cols-2 gap-3 ${className}`}>
    <div>
      <label className="text-xs text-gray-500 block mb-1">{labelX}</label>
      <input
        type="number"
        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1 text-xs text-gray-900 dark:text-white"
        value={valueX}
        onChange={(e) =>
          onChange({
            [labelX.replace(/\s/g, "")]: parseInt(e.target.value) || 0,
          })
        }
      />
    </div>
    <div>
      <label className="text-xs text-gray-500 block mb-1">{labelY}</label>
      <input
        type="number"
        className="w-full bg-gray-50 dark:bg-[#27272a] border border-gray-300 dark:border-[#3f3f46] rounded p-1 text-xs text-gray-900 dark:text-white"
        value={valueY}
        onChange={(e) =>
          onChange({
            [labelY.replace(/\s/g, "")]: parseInt(e.target.value) || 0,
          })
        }
      />
    </div>
  </div>
);

// Universal Slider
export const SliderInput = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  decimals = 0,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  decimals?: number;
}) => (
  <>
    <div className="flex justify-between mb-1">
      <label className="text-10px text-gray-400">{label}</label>
      <span className="text-10px text-gray-500">{value.toFixed(decimals)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-primary-500"
    />
  </>
);

export const ColorPickerButton = ({ color, onChange, picker = "test", label = "A" }: { color: string, onChange: (color: string) => void, picker?: string, label?: string }) => {
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [isBelow, setIsBelow] = useState(true);
  const [currentColor, setCurrentColor] = useState(color || "#000000");
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (colorObj: any, event?: React.SyntheticEvent) => {
    if (event) event.stopPropagation();
    onChange(colorObj.hex);
    setCurrentColor(colorObj.hex);
  };

  const handleColorChangeComplete = (colorObj: any) => {
    onChange(colorObj.hex); // Call parent callback
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pickerHeight = 220;
    const pickerWidth = 220; // Approximate Chrome picker width
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    // Vertical positioning (same as before)
    const below = spaceBelow >= pickerHeight && spaceBelow >= spaceAbove;
    const topPos = below ? rect.bottom + 8 : rect.top - pickerHeight - 8;

    // Horizontal positioning
    let leftPos: number;
    if (spaceRight >= pickerWidth) {
      leftPos = rect.left; // Align left edge
    } else if (spaceLeft >= pickerWidth) {
      leftPos = rect.right - pickerWidth; // Align right edge
    } else if (rect.left >= pickerWidth / 2 && window.innerWidth - rect.right >= pickerWidth / 2) {
      leftPos = rect.left + rect.width / 2 - pickerWidth / 2; // Center on button
    } else {
      leftPos = Math.max(8, Math.min(rect.left, window.innerWidth - pickerWidth - 8)); // Clamp to viewport
    }

    setPickerPos({ x: leftPos, y: topPos });
    setIsBelow(below);
    setActivePicker(activePicker === picker ? null : picker);
  };

  // useEffect(() => {
  //   const handleGlobalClick = () => setActivePicker(null);
  //   const handleKey = (e: KeyboardEvent) => {
  //     if (e.key === 'Escape') setActivePicker(null);
  //   };
  //   document.addEventListener('click', handleGlobalClick);
  //   document.addEventListener('keydown', handleKey);
  //   return () => {
  //     document.removeEventListener('click', handleGlobalClick);
  //     document.removeEventListener('keydown', handleKey);
  //   };
  // }, []);

  const closePicker = () => setActivePicker(null);

  return (
    <div className="relative" ref={buttonRef}>
      <div
        className={`flex items-center space-x-2 rounded-lg cursor-pointer ${label === '' ? '' : 'border border-gray-300 dark:border-gray-600 p-1'}`}
        onClick={handleClick}
      >
        {label ?
          <>
            <div
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden shrink-0 relative"
              style={{ backgroundColor: color || "#000000" }}
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 pr-1">
              {label}
            </span>
          </>
          : <div className="w-6 h-5 rounded cursor-pointer bg-transparent border-none p-0" style={{ backgroundColor: color || "#000000" }}></div>}
      </div>

      {activePicker === picker && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={closePicker}
          />
          <div
            className={`fixed z-[9999] shadow-xl svg-color-fix transition-all duration-200 ${isBelow ? 'mb-2' : 'mt-2'
              }`}
            style={{ left: `${pickerPos.x}px`, top: `${pickerPos.y}px` }}
          >
            <Chrome
              showAlpha={false}
              color={currentColor}
              onChange={handleColorChange}
              onChangeComplete={handleColorChangeComplete}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// Toggle Button
export const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
  >
    <div
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0"
        }`}
    />
  </button>
);
