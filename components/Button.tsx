import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#18181b] focus:ring-offset-white";
  
  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] dark:text-white dark:border-[#3f3f46] focus:ring-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-[#27272a] text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};