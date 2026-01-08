import React, { useState, useRef } from 'react';
import './ChromaGrid.css';

export interface ChromaItem {
  image: string;
  title: string;
  subtitle: string;
  handle?: string;
  location?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
}

export interface ChromaGridProps {
  items?: ChromaItem[];
  className?: string;
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

type SetterFn = (v: number | string) => void;

interface CardWithSymbolsProps {
  item: ChromaItem;
  htmlTag: string;
  symbolPositions: Array<{ top: string; left: string; delay: number }>;
  onCardClick: (url?: string) => void;
}

const CardWithSymbols: React.FC<CardWithSymbolsProps> = ({
  item,
  htmlTag,
  symbolPositions,
  onCardClick
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0.5, y: 0.5 });
  };

  const getSymbolTransform = (pos: { top: string; left: string; delay: number }) => {
    const offsetX = (mousePos.x - 0.5) * 20;
    const offsetY = (mousePos.y - 0.5) * 20;
    return `translate(${offsetX}px, ${offsetY}px)`;
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onCardClick(item.url)}
      className="group relative flex flex-col w-[300px] rounded-[20px] overflow-hidden border-2 border-transparent transition-colors duration-300 cursor-pointer"
      style={
        {
          '--card-border': item.borderColor || 'transparent',
          background: item.gradient
        } as React.CSSProperties
      }
    >
      {/* Pixelated HTML Tag Overlay */}
      <div 
        className="absolute top-4 left-4 z-20 pointer-events-none font-mono text-[#6A5CFF] text-lg font-bold pixelated-tag"
        style={{
          textShadow: `
            0 0 2px #6A5CFF,
            0 0 4px #6A5CFF,
            0 0 6px #6A5CFF,
            1px 1px 0 #6A5CFF,
            -1px -1px 0 #6A5CFF,
            1px -1px 0 #6A5CFF,
            -1px 1px 0 #6A5CFF
          `,
          filter: 'blur(0.5px)',
          imageRendering: 'pixelated',
          WebkitFontSmoothing: 'none',
          fontSmooth: 'never',
          transform: getSymbolTransform({ top: '0', left: '0', delay: 0 }),
          transition: 'transform 0.3s ease-out'
        }}
      >
        {htmlTag}
      </div>

      {/* </> Symbols scattered across the card */}
      {symbolPositions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute z-20 pointer-events-none font-mono text-[#6A5CFF] text-sm font-bold pixelated-tag opacity-60"
          style={{
            top: pos.top,
            left: pos.left,
            textShadow: `
              0 0 2px #6A5CFF,
              0 0 4px #6A5CFF,
              1px 1px 0 #6A5CFF,
              -1px -1px 0 #6A5CFF
            `,
            filter: 'blur(0.3px)',
            imageRendering: 'pixelated',
            WebkitFontSmoothing: 'none',
            fontSmooth: 'never',
            transform: getSymbolTransform(pos),
            transition: `transform 0.3s ease-out ${pos.delay}s`
          }}
        >
          &lt;/&gt;
        </div>
      ))}
      
      <div className="relative z-10 flex-1 p-[10px] box-border">
        <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover rounded-[10px]" />
      </div>
      <footer className="relative z-10 p-3 text-white font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
        <h3 className="m-0 text-[1.05rem] font-semibold pixelated-text" style={{
          textShadow: `
            0 0 2px #6A5CFF,
            0 0 4px #6A5CFF,
            1px 1px 0 #6A5CFF,
            -1px -1px 0 #6A5CFF
          `,
          filter: 'blur(0.3px)',
          WebkitFontSmoothing: 'none'
        }}>{item.title}</h3>
        {item.handle && <span className="text-[0.95rem] opacity-80 text-right">{item.handle}</span>}
        <p className="m-0 text-[0.85rem] opacity-85 pixelated-text" style={{
          textShadow: `
            0 0 2px #6A5CFF,
            0 0 3px #6A5CFF,
            1px 1px 0 #6A5CFF
          `,
          filter: 'blur(0.2px)',
          WebkitFontSmoothing: 'none'
        }}>{item.subtitle}</p>
        {item.location && <span className="text-[0.85rem] opacity-85 text-right">{item.location}</span>}
      </footer>
    </article>
  );
};

const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = '',
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out'
}) => {
  const demo: ChromaItem[] = [
    {
      image: 'https://i.pravatar.cc/300?img=8',
      title: 'Alex Rivera',
      subtitle: 'Full Stack Developer',
      handle: '@alexrivera',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg,#4F46E5,#000)',
      url: 'https://github.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=11',
      title: 'Jordan Chen',
      subtitle: 'DevOps Engineer',
      handle: '@jordanchen',
      borderColor: '#10B981',
      gradient: 'linear-gradient(210deg,#10B981,#000)',
      url: 'https://linkedin.com/in/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=3',
      title: 'Morgan Blake',
      subtitle: 'UI/UX Designer',
      handle: '@morganblake',
      borderColor: '#F59E0B',
      gradient: 'linear-gradient(165deg,#F59E0B,#000)',
      url: 'https://dribbble.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=16',
      title: 'Casey Park',
      subtitle: 'Data Scientist',
      handle: '@caseypark',
      borderColor: '#EF4444',
      gradient: 'linear-gradient(195deg,#EF4444,#000)',
      url: 'https://kaggle.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=25',
      title: 'Sam Kim',
      subtitle: 'Mobile Developer',
      handle: '@thesamkim',
      borderColor: '#8B5CF6',
      gradient: 'linear-gradient(225deg,#8B5CF6,#000)',
      url: 'https://github.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=60',
      title: 'Tyler Rodriguez',
      subtitle: 'Cloud Architect',
      handle: '@tylerrod',
      borderColor: '#06B6D4',
      gradient: 'linear-gradient(135deg,#06B6D4,#000)',
      url: 'https://aws.amazon.com/'
    }
  ];

  const data = items?.length ? items : demo;

  const handleCardClick = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };


  return (
    <div
      className={`relative w-full h-full flex flex-wrap justify-center items-start gap-3 ${className}`}
    >
      {data.map((c, i) => {
        const htmlTags = ['<div>', '<span>', '<section>', '<article>', '<header>', '<footer>'];
        const randomTag = htmlTags[i % htmlTags.length];
        
        // Generate random positions for </> symbols
        const symbolPositions = [
          { top: '15%', left: '20%', delay: 0 },
          { top: '25%', left: '75%', delay: 0.1 },
          { top: '45%', left: '15%', delay: 0.2 },
          { top: '55%', left: '80%', delay: 0.3 },
          { top: '70%', left: '25%', delay: 0.4 },
          { top: '80%', left: '70%', delay: 0.5 },
          { top: '35%', left: '50%', delay: 0.15 },
          { top: '60%', left: '45%', delay: 0.25 }
        ];
        
        return (
          <CardWithSymbols
            key={i}
            item={c}
            htmlTag={randomTag}
            symbolPositions={symbolPositions}
            onCardClick={handleCardClick}
          />
        );
      })}
    </div>
  );
};

export default ChromaGrid;
