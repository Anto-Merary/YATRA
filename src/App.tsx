import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { ProshowPage } from "./pages/ProshowPage";
import { TicketsPage } from "./pages/TicketsPage";
import { EventsPage } from "./pages/EventsPage";
import { GalleryPage } from "./pages/GalleryPage";
import { TeamPage } from "./pages/TeamPage";

export default function App() {
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
    </Routes>
  );
}


