import React, { useEffect } from "react";

import {
  Box,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
} from "@chakra-ui/react";

import CountryMap from "./CountryMap";
import MainMap from "./MainMap";

import { useGlobalState } from "../../shared/global-state";

import "./PageBody.css";

export default function PageBody() {
  /////////////////////////////////////////////
  //
  // REACTIVE HOOKS AND SUCH
  //
  /////////////////////////////////////////////

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();
  const { selectedBridge, setSelectedBridge } = useGlobalState();

  /////////////////////////////////////////////
  //
  // (SIDE) EFFECTS
  //
  /////////////////////////////////////////////

  //
  // Open/close the drawer that contains details of a clicked-on bridge.
  //
  useEffect(() => {
    if (selectedBridge) {
      onOpen();
    } else {
      onClose();
    }
  }, [selectedBridge]);

  /////////////////////////////////////////////
  //
  // PRIVATE UI HANDLERS/METHODS
  //
  /////////////////////////////////////////////

  function closeDrawer() {
    setSelectedBridge(null);
  }

  /**
   * In the future, this could make an API call in order to retrieve images/videos/etc. that correspond to the
   * currently selected bridge.
   */
  function randomBridgePhoto() {
    const photos = [
      "https://www.worldatlas.com/r/w768/upload/fb/fb/aa/shutterstock-1313547197.jpg",
      "https://diaryofdennis.files.wordpress.com/2019/04/old-bridge.jpg",
      "https://www.news10.com/wp-content/uploads/sites/64/2022/12/covered-bridge-g76c2917cb_1920.jpg?strip=1",
      "https://garverusa.blob.core.windows.net/images/project-photos/transportation/judsonia-bridge/old-bridge-new-life-cover.jpg",
    ];

    const index = Math.floor(Math.random() * photos.length);

    return photos[index];
  }

  /////////////////////////////////////////////
  //
  // DYNAMICALLY GENERATED UI CONTENT
  //
  /////////////////////////////////////////////

  let tableRows;
  if (selectedBridge) {
    const properties = [
      {
        name: "structureNumber",
        label: "Structure Number",
      },
      {
        name: "routeNumber",
        label: "Route Number",
      },
      {
        name: "highwayDistrict002",
        label: "Highway District",
      },

      {
        name: "featuresDesc006A",
        label: "Feature Description",
      },
      {
        name: "locationDetails",
        label: "Location Details",
      },
      {
        name: "countyName",
        label: "County Name",
      },
      {
        name: "countyPopulation",
        label: "County Population",
      },
    ];
    tableRows = properties.map((prop) => {
      const label = prop.label;
      const value = selectedBridge.properties[prop.name];
      return (
        <Tr>
          <Td>{label}</Td>
          <Td>{value}</Td>
        </Tr>
      );
    });
    const [lon, lat, _] = selectedBridge.geometry.coordinates;
    tableRows.push(
      <Tr>
        <Td>Latitude</Td>
        <Td>{lat}</Td>
      </Tr>
    );
    tableRows.push(
      <Tr>
        <Td>Longitude</Td>
        <Td>{lon}</Td>
      </Tr>
    );
  }

  return (
    <Box className="page-body" display="flex">
      <CountryMap />
      <MainMap width="100%" />
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={closeDrawer}
        finalFocusRef={btnRef}
        size="lg"
      >
        <DrawerOverlay background="rgba(0,0,0,.15)" />

        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader></DrawerHeader>
          <DrawerBody>
            <TableContainer>
              <Table variant="simple">
                <Tbody>{tableRows}</Tbody>
              </Table>
            </TableContainer>
            <Image
              visibility={selectedBridge ? "visible" : "hidden"}
              width="100%"
              objectFit="cover"
              src={randomBridgePhoto()}
              alt="Dan Abramov"
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
