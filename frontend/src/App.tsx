import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CryptoSpliter from "./pages/CryptoSplitter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import DonateSection from "./pages/DonateSection";
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
          <Route path="/split-eth" element={<CryptoSpliter />} />
          <Route path="/split-usdc" element={<CryptoSpliter />} />
          <Route path="/split-link" element={<CryptoSpliter />} />
          <Route path="/split-arb" element={<CryptoSpliter />} />
          <Route path="/split-usdt" element={<CryptoSpliter />} />
          <Route path="/split-matic" element={<CryptoSpliter />} />
          <Route path="/split-base" element={<CryptoSpliter />} />
          <Route path="/split-arbitrum" element={<CryptoSpliter />} />
          <Route path="/split-ethereum" element={<CryptoSpliter />} />
          <Route path="/split-polygon" element={<CryptoSpliter />} />
          <Route path="/split-BNB" element={<CryptoSpliter />} />
          <Route path="/split-splitwise-crypto-alternative" element={<CryptoSpliter />} />
          <Route path="/split-vacation" element={<CryptoSpliter />} />
          <Route path="/split-roommates" element={<CryptoSpliter />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/donate" element={<DonateSection />} />
        </Routes>
      </BrowserRouter>
    </ThirdwebProvider>
  );
}

export default App;