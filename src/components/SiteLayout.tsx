import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import ClickSpark from "./ClickSpark";

export function SiteLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <ClickSpark
      className="min-h-screen"
      sparkColor="#6a5cff"
      sparkCount={10}
      sparkRadius={18}
      sparkSize={12}
      duration={520}
    >
      <div className="min-h-screen">
        {!isHomePage && <Navbar />}
        <ScrollToTop />
        <main className={isHomePage ? "" : "pt-16 sm:pt-20 md:pt-24"}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </ClickSpark>
  );
}


