import CryptoSpliter from "./components/CryptoSplitter";
import { ThirdwebProvider } from "thirdweb/react";

import "./App.css";

function App() {
  return (
    <ThirdwebProvider>
      <CryptoSpliter />
    </ThirdwebProvider>
  );
}

export default App;