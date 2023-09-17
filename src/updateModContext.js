import React, { createContext, useContext, useState } from "react";

// Create the context
const UpdateModeContext = createContext();

// Create a provider component
export function UpdateModeProvider({ children }) {
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  return (
    <UpdateModeContext.Provider value={{ isUpdateMode, setIsUpdateMode }}>
      {children}
    </UpdateModeContext.Provider>
  );
}

// Create a custom hook to access the context
export function useUpdateMode() {
  const context = useContext(UpdateModeContext);
  if (!context) {
    throw new Error("useUpdateMode must be used within an UpdateModeProvider");
  }
  return context;
}
