import { createContext, useContext, useState } from "react";

const initialState = {
  selectedState: null,
  setSelectedState: (stateAbbrev) => {},
  selectedBridge: null,
  setSelectedBridge: (bridge) => {},
};

export const GlobalStateContext = createContext(initialState);

export default function GlobalStateContextProvider({ children }) {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedBridge, setSelectedBridge] = useState(null);

  return (
    <GlobalStateContext.Provider
      value={{
        selectedState,
        setSelectedState,
        selectedBridge,
        setSelectedBridge,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

export const useGlobalState = () => {
  return useContext(GlobalStateContext);
};
