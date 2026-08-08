import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CryptoSpliter from "./pages/CryptoSplitter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import DonateSection from "./pages/DonateSection";
import SplitLandingPage from "./pages/SplitLandingPage";
import { ThirdwebProvider } from "thirdweb/react";

import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThirdwebProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CryptoSpliter />} />
          <Route path="/split-:slug" element={<SplitLandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/donate" element={<DonateSection />} />
        </Routes>
      </BrowserRouter>
    </ThirdwebProvider>
  );
}

export default App;
