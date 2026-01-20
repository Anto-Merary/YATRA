import { useEffect, useState } from 'react';
import { MobileHomePage } from '../components/MobileHomePage';
import { useMobile } from '../hooks/use-mobile';

export function HomePage() {
  const { isMobileOnly } = useMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show mobile version for mobile devices
  if (isClient && isMobileOnly) {
    return <MobileHomePage />;
  }

  // Show desktop HTML version for larger screens
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/homepage.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        scrolling="yes"
        title="YATRA 2026 Homepage"
      />
    </div>
  );
}
