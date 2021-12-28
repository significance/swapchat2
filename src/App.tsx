import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useLocation } from "react-router-dom";

import Chat from "./components/Chat";

const apiURL = "http://localhost:1633";
const debugURL = "http://localhost:1635";

function App() {
  const search = useLocation().search;
  const token = new URLSearchParams(search).get("token");
  const chatRole = token && token.length === 194 ? "respondent" : "initiator";

  return (
    <div className="App">
      <header className="App-header">SwapChat</header>
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
