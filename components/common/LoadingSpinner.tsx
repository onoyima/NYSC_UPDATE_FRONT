'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  showText = true
}) => {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      logo: 'w-4 h-4',
      text: 'text-xs',
      border: 'border-2'
    },
    md: {
      container: 'w-12 h-12',
      logo: 'w-6 h-6',
      text: 'text-sm',
      border: 'border-3'
    },
    lg: {
      container: 'w-16 h-16',
      logo: 'w-8 h-8',
      text: 'text-base',
      border: 'border-4'
    },
    xl: {
      container: 'w-24 h-24',
      logo: 'w-12 h-12',
      text: 'text-lg',
      border: 'border-4'
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className="relative">
        {/* Spinning border with gradient */}
        <div className={cn(
          sizeClasses[size].container,
          sizeClasses[size].border,
          'border-transparent border-t-blue-600 dark:border-t-blue-400 border-r-blue-500 dark:border-r-blue-300 rounded-full animate-spin',
          'bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950 dark:to-transparent'
        )}></div>
        
        {/* Secondary spinning ring for enhanced effect */}
        <div className={cn(
          sizeClasses[size].container,
          'border-2 border-gray-200 dark:border-gray-700 rounded-full absolute inset-0 animate-pulse'
        )}></div>
        
        {/* Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <Image
              src="/logo.png"
              alt="NYSC Logo"
              width={32}
              height={32}
              className={cn(sizeClasses[size].logo, 'object-contain drop-shadow-sm')}
              priority
            />
          </div>
        </div>
      </div>
      
      {showText && text && (
        <p className={cn(
          sizeClasses[size].text,
          'text-gray-600 dark:text-gray-400 font-medium animate-pulse'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;