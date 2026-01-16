import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="loader-spinner" aria-hidden="true" />
        <div className="text-white/80 text-sm font-medium">Loading...</div>
      </div>
      <style>{`
        .loader-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .loader-spinner {
            animation: none;
            border-top-color: rgba(255, 255, 255, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;