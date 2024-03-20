import React from "react";

import { Box } from "@chakra-ui/react";

import PageHeader from "../components/PageHeader";
import PageBody from "../components/PageBody/PageBody";

import "./Main.css";

export default function Main() {
  return (
    <Box className="main">
      <PageHeader />
      <PageBody />
    </Box>
  );
}
