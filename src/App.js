import React, { useState, useEffect } from "react";
import Auth from "./Components/Auth";
import Main from "./Components/Main";
import { UpdateModeProvider } from "./updateModContext";
import Updating from "./Components/Updating";
import axios from "axios";

const App = () => {
  const isAuthenticatedFromStorage = sessionStorage.getItem("isAuthenticated");
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAuthenticatedFromStorage === "true"
  );

  return (
    <div>
      <React.StrictMode>
        <UpdateModeProvider>
          {isAuthenticated ? (
            <Main />
          ) : (
            <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
          )}
        </UpdateModeProvider>
      </React.StrictMode>
    </div>
  );
};

export default App;
