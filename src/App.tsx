import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Loader from "./components/Loader";
import { HomePage } from "./pages/HomePage";
import { ProshowPage } from "./pages/ProshowPage";
import { TicketsPage } from "./pages/TicketsPage";
import { EventsPage } from "./pages/EventsPage";
import { GalleryPage } from "./pages/GalleryPage";
import { TeamPage } from "./pages/TeamPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loader for 2 seconds

    // Also hide loader when page is fully loaded
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/proshow" element={<ProshowPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/team" element={<TeamPage />} />
      </Route>
      {/* Admin route - separate from SiteLayout, no navigation links */}
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}


