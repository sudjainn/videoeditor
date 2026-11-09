export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  
  return `${mStr}:${sStr}.${ms}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};