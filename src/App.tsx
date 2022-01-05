import React from "react";
import logo from "./logo.svg";
import "normalize.css";
import "./App.css";

import { useLocation } from "react-router-dom";

import Chat from "./components/Chat";

// const apiURL = "https://bee-9.gateway.ethswarm.org";
// const debugURL = "https://bee-9.gateway.ethswarm.org";

const apiURL = "http://localhost:1633";
const debugURL = "http://localhost:1635";

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
      />
    </div>
  );
}

export default App;
