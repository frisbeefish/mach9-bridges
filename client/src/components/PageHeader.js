import React from "react";

import { Flex, Heading, Image } from "@chakra-ui/react";

import "./PageHeader.css";

export default function PageHeader() {
  return (
    <Flex className="page-header">
      <Heading as="h1">Bridge Inspector</Heading>
      <Image src="https://bit.ly/dan-abramov" alt="Dan Abramov" />
    </Flex>
  );
}
