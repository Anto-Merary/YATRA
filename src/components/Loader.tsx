import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="yatra-loader-wrap" aria-label="Loading" role="status" aria-live="polite">
        <span className="yatra-loader-star">✦</span>
      </div>

      <style>{`
        .yatra-loader-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .yatra-loader-star {
          font-family: 'Wave', var(--hero-font-family), sans-serif;
          font-size: 4rem;
          color: #FFFFFF;
          line-height: 1;
          animation: yatraLoaderSpin 2s linear infinite;
        }

        @keyframes yatraLoaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .yatra-loader-star {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
