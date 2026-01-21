import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for navigation messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Verify message origin for security (adjust if needed)
      if (event.data && event.data.type === 'navigate') {
        const path = event.data.path;
        if (path && typeof path === 'string') {
          navigate(path);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <iframe
        ref={iframeRef}
        src="/homepage.html"
        style={{
          width: '100%',
          flex: '1',
          border: 'none',
          display: 'block',
        }}
        scrolling="yes"
        title="YATRA 2026 Homepage"
      />
    </div>
  );
}
