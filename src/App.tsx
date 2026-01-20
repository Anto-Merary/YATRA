import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Loader from "./components/Loader";
import { HomePage } from "./pages/HomePage";
import { EventsPage } from "./pages/EventsPage";
import { ProEventsPage } from "./pages/ProEventsPage";
import { YatraEventsPage } from "./pages/YatraEventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { MrMsYatraPage } from "./pages/MrMsYatraPage";
import { ProDanceBattlePage } from "./pages/ProDanceBattlePage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useGLTF } from "@react-three/drei";
// Images
import ritLogoImage from "./assets/RIT WHITE LOGO.png";
import logoImage from "./assets/LOGO .png";
import artistImage from "./assets/artist.png?url";
import christopherImage from "./assets/christopher.png?url";
import antomeraryImage from "./assets/antomerary.png?url";
// Video
import yatraVideo from "./assets/video.mp4?url";
// 3D Model
import glbModel from "../YATRA 3D ELEMENT.glb?url";
// Font
import fontFile from "./assets/fonts/BaseNeueTrial-ExtBdObliq.ttf";

// Preload the 3D model at module level
try {
  useGLTF.preload(glbModel);
} catch (e) {
  // Silently fail if GLB preload fails (might not be available in all contexts)
  console.warn("GLB preload failed:", e);
}

export default function App() {
  // Check if this is the first load in this session
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    const hasLoadedBefore = sessionStorage.getItem('yatra-initial-load-complete');
    return !hasLoadedBefore;
  });
  const [isLoading, setIsLoading] = useState(isInitialLoad);

  useEffect(() => {
    // Only show loading screen on initial site load
    if (!isInitialLoad) {
      return;
    }

    // Preload all critical assets for smooth experience
    const preloadAssets = async () => {
      const promises: Promise<void>[] = [];

      // Preload images
      const imageUrls = [
        ritLogoImage,
        logoImage,
        artistImage,
        christopherImage,
        antomeraryImage,
      ];

      imageUrls.forEach((url) => {
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = url;
          })
        );
      });

      // Preload video (load metadata to ensure it's ready)
      promises.push(
        new Promise<void>((resolve) => {
          const video = document.createElement("video");
          video.preload = "auto";
          video.muted = true;
          video.onloadedmetadata = () => resolve();
          video.onerror = () => resolve(); // Continue even if video fails
          video.src = yatraVideo;
        })
      );

      // Preload 3D model (GLB file) - fetch to cache it
      promises.push(
        new Promise<void>((resolve) => {
          fetch(glbModel, { method: 'HEAD' })
            .then(() => resolve())
            .catch(() => {
              // If HEAD fails, try full fetch
              fetch(glbModel)
                .then(() => resolve())
                .catch(() => resolve()); // Continue even if GLB fails
            });
        })
      );

      // Preload font (font is already loaded via CSS @font-face, but we ensure it's ready)
      promises.push(
        new Promise<void>((resolve) => {
          // Check if font is already loaded
          if (document.fonts.check('1em "Base Neue ExtBd Obl"')) {
            resolve();
            return;
          }
          
          const font = new FontFace(
            "Base Neue ExtBd Obl",
            `url(${fontFile})`
          );
          font
            .load()
            .then(() => {
              document.fonts.add(font);
              resolve();
            })
            .catch(() => {
              // Font might already be loaded via CSS, check again
              setTimeout(() => {
                if (document.fonts.check('1em "Base Neue ExtBd Obl"')) {
                  resolve();
                } else {
                  resolve(); // Continue anyway
                }
              }, 100);
            });
        })
      );

      // Wait for all assets to load (or timeout individually)
      await Promise.allSettled(
        promises.map((p) =>
          Promise.race([
            p,
            new Promise<void>((resolve) =>
              setTimeout(() => resolve(), 5000)
            ), // 5s timeout per asset
          ])
        )
      );
    };

    // Wait for both page load and asset preloading
    const initializeApp = async () => {
      // Wait for DOM to be ready
      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) => {
          const handleLoad = () => {
            window.removeEventListener("load", handleLoad);
            resolve();
          };
          window.addEventListener("load", handleLoad);
        });
      }

      // Preload all assets
      await preloadAssets();

      // Small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
        // Mark that initial load is complete for this session
        sessionStorage.setItem('yatra-initial-load-complete', 'true');
      }, 300);
    };

    // Fallback timer in case something goes wrong
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('yatra-initial-load-complete', 'true');
    }, 8000); // Max 8 seconds for all assets

    initializeApp().then(() => {
      clearTimeout(fallbackTimer);
    });

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [isInitialLoad]);

  // Show loading screen only on initial site load
  if (isLoading && isInitialLoad) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/proevents" element={<ProEventsPage />} />
        <Route path="/yatraevents" element={<YatraEventsPage />} />
        <Route path="/events/mr-ms-yatra" element={<MrMsYatraPage />} />
        <Route path="/pro-dance-battle" element={<ProDanceBattlePage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      {/* Admin route - separate from SiteLayout, no navigation links */}
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}


