import React, { useState } from "react";
import Auth from "./Components/Auth";
import Main from './Components/Main'

const App = () => {
  const [isAuthenticated,setIsAuthenticated] = useState(false);

  return (
    <div>
      {isAuthenticated ? (
        <Main />
      ) : (
        <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
};

export default App;
