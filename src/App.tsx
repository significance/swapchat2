import "normalize.css";
import "./App.css";

import { useLocation } from "react-router-dom";

import Chat from "./components/Chat";

const apiURL = import.meta.env.VITE_BEE_API;
const gatewayMode = import.meta.env.VITE_BEE_GATEWAY_MODE === "true";
const stamp = import.meta.env.VITE_BEE_STAMP;

function App() {
  const search = useLocation().search;
  const token = new URLSearchParams(search).get("token");
  const chatRole = token && token.length === 1708 ? "respondent" : "initiator";

  return (
    <div className="Wrapper">
      <Chat
        chatRole={chatRole}
        token={token}
        apiURL={apiURL}
        gatewayMode={gatewayMode}
        stamp={stamp}
      />
    </div>
  );
}

export default App;
