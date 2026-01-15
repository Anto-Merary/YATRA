import React from 'react';

interface ModernCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ModernCard: React.FC<ModernCardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`${className}`}>
      <div className="relative w-full max-w-lg group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
        
        {/* Card */}
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-white/40 hover:shadow-pink-500/20">
          {/* Content */}
          <div className="text-white/90 leading-relaxed">
            {children}
          </div>
          
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-transparent rounded-bl-full" />
        </div>
      </div>
    </div>
  );
};

export default ModernCard;
