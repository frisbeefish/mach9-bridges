import "./App.css";

import React from "react";

import { ChakraProvider } from "@chakra-ui/react";

import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax

import GlobalStateContextProvider from "./shared/global-state";

import Main from "./pages/Main";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZnJpc2JlZWZpc2htYW50YXJheSIsImEiOiJjbGc1a3dhbGkwNGVuM2tuOWRycTJkc2ptIn0.gB6gdS3aXBVkMoM0nCRmEQ";

function App() {
  return (
    <ChakraProvider>
      <GlobalStateContextProvider>
        <Main />
      </GlobalStateContextProvider>
    </ChakraProvider>
  );
}

export default App;
