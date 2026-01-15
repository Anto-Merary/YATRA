import React from 'react';

interface NeobrutalCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const NeobrutalCard: React.FC<NeobrutalCardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`${className}`}>
      <div className="card font-montserrat w-full max-w-md -translate-x-1.5 -translate-y-1.5 bg-[#ff66a3] border-[3px] border-black shadow-[12px_12px_0_#000000] overflow-hidden transition-all duration-300 ease-in-out hover:-translate-x-1.5 hover:translate-y-0">
        <div className="head font-montserrat text-sm font-black w-full h-8 bg-white px-3 py-1.5 text-black border-b-[3px] border-black">
          {title}
        </div>
        <div className="content px-3 py-2 text-sm font-semibold">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NeobrutalCard;
