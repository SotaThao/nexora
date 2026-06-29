import React from 'react';
import { LucideIcon } from 'lucide-react';
import './IconBox.css';

interface IconBoxProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const IconBox: React.FC<IconBoxProps> = ({ 
  icon: Icon, 
  className = '',
  size = 28,
  strokeWidth = 2
}) => {
  return (
    <div className={`icon-box ${className}`}>
      <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
    </div>
  );
};
