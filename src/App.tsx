import "normalize.css";
import "./App.css";

import { useLocation } from "react-router-dom";

import Chat from "./components/Chat";

const apiURL = import.meta.env.VITE_BEE_API;
const gatewayMode = import.meta.env.VITE_BEE_GATEWAY_MODE === "true";
const stamp = import.meta.env.VITE_BEE_STAMP;
const signerKey = import.meta.env.VITE_BEE_SIGNER_KEY;
const stampDepth = parseInt(import.meta.env.VITE_BEE_STAMP_DEPTH || "20");

function App() {
  const search = useLocation().search;
  const token = new URLSearchParams(search).get("token");
  const chatRole = token && token.length > 100 ? "respondent" : "initiator";

  return (
    <div className="Wrapper">
      <Chat
        chatRole={chatRole}
        token={token}
        apiURL={apiURL}
        gatewayMode={gatewayMode}
        stamp={stamp}
        signerKey={signerKey}
        stampDepth={stampDepth}
      />
    </div>
  );
}

export default App;
