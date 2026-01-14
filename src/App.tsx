import { useState, useEffect } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import Loader from "./components/Loader";
import { HomePage } from "./pages/HomePage";
import { ProshowPage } from "./pages/ProshowPage";
import { TicketsPage } from "./pages/TicketsPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { GalleryPage } from "./pages/GalleryPage";
import { TeamPage } from "./pages/TeamPage";
import { AdminPage } from "./pages/AdminPage";
import { useGLTF } from "@react-three/drei";
// Images
import leafImage from "./assets/leaf.jpeg?url";
import leaf2Image from "./assets/leaf2.jpeg?url";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload all critical assets for smooth experience
    const preloadAssets = async () => {
      const promises: Promise<void>[] = [];

      // Preload images
      const imageUrls = [
        leafImage,
        leaf2Image,
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
      }, 300);
    };

    // Fallback timer in case something goes wrong
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 8000); // Max 8 seconds for all assets

    initializeApp().then(() => {
      clearTimeout(fallbackTimer);
    });

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Temporary debug component to verify that the /events/:eventId route
  // is rendering correctly and that route params are available.
  function EventRouteDebug() {
    const { eventId } = useParams<{ eventId: string }>();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-lg font-semibold mb-2">Event route debug</p>
        <p className="text-sm text-white/70">eventId from URL:</p>
        <p className="mt-1 text-xl font-mono">{eventId ?? "(none)"}</p>
      </div>
    );
  }

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
      {/* TEMP: mount the real EventDetailPage outside SiteLayout/PageTransition
          to keep routing simple while we debug its rendering */}
      <Route path="/events/:eventId" element={<EventDetailPage />} />
    </Routes>
  );
}


