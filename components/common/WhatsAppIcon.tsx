'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppIconProps {
  url?: string;
  className?: string;
}

const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({ 
  url = 'https://wa.me/2348168438930?text=Hello%3BUpdate%20information%20related%3A',
  className = ''
}) => {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 ${className}`}
      style={{ zIndex: 9999 }}
    >
      <button
        onClick={handleClick}
        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        title="Contact us on WhatsApp"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default WhatsAppIcon;