import React from "react";
import "normalize.css";
import "./App.css";

import { useLocation } from "react-router-dom";

import Chat from "./components/Chat";

const apiURL = process.env.REACT_APP_BEE_API;
const debugURL = process.env.REACT_APP_BEE_DEBUG_API;
const gatewayMode = process.env.REACT_APP_BEE_GATEWAY_MODE === "true";

function App() {
  const search = useLocation().search;
  const token = new URLSearchParams(search).get("token");
  const chatRole = token && token.length === 194 ? "respondent" : "initiator";

  return (
    <div className="Wrapper">
      <Chat
        chatRole={chatRole}
        token={token}
        apiURL={apiURL}
        debugURL={debugURL}
        gatewayMode={gatewayMode}
      />
    </div>
  );
}

export default App;
