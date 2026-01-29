import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function GVPrakashPage() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    // Listen for navigation messages from the iframe if needed
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate') {
        const path = event.data.path;
        if (path && typeof path === 'string' && !path.startsWith('/gv-prakash')) {
          navigate(path);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIframeError(false);
      // Give the iframe content time to initialize
      setTimeout(() => {
        try {
          // Try to access the iframe's window to check if it loaded
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow) {
            // Iframe loaded successfully
            setIframeError(false);
          }
        } catch (e) {
          // Cross-origin or other error - this is expected for security
          // but the iframe should still work
        }
      }, 1000);
    };

    const handleError = () => {
      setIframeError(true);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, []);

  // The Next.js app should be built using: npm run build:gv-prakash
  // This will build the app and copy it to public/gv-prakash
  // Or if deployed separately, set VITE_GV_PRAKASH_URL environment variable
  const gvPrakashUrl = import.meta.env.VITE_GV_PRAKASH_URL || '/gv-prakash/index.html';

  if (iframeError) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        padding: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Failed to load GV Prakash page</h2>
        <p style={{ marginBottom: '1rem', opacity: 0.7 }}>
          Please make sure the Next.js app has been built using: <code>npm run build:gv-prakash</code>
        </p>
        <button
          onClick={() => {
            setIframeError(false);
            if (iframeRef.current) {
              iframeRef.current.src = iframeRef.current.src;
            }
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#d946ef',
            color: '#000',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={gvPrakashUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        scrolling="yes"
        title="GV Prakash - YATRA 2026"
        allow="autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}

