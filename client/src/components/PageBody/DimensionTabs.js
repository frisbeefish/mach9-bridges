import React, { useRef, useEffect, useState, PureComponent } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Rectangle,
} from "recharts";

import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import { useGlobalState } from "../../shared/global-state";

import "./DimensionTabs.css";

/**
 * Not a PURE function. This updates the passed-in "chartSvg" element.
 */
function updateSvgViewBoxToReduceMargin(chartSvg) {
  let viewBox = chartSvg.getAttribute("viewBox");
  const values = viewBox.split(/\s+/);
  values[0] = "40";
  viewBox = values.join(" ");
  chartSvg.setAttribute("viewBox", viewBox);
}

function YearBuiltGraph() {
  /////////////////////////////////////////////
  //
  // (SIDE) EFFECTS
  //
  /////////////////////////////////////////////

  useEffect(() => {
    const chartSvg = document.querySelector(".year-built-graph-container svg");
    updateSvgViewBoxToReduceMargin(chartSvg);
  }, []);

  /////////////////////////////////////////////
  //
  // FAKE DATA
  //
  /////////////////////////////////////////////

  const data = [
    {
      name: "1900-1920",
      pv: 20,
      fill: "#FFD233",
    },
    {
      name: "1921-1940",
      pv: 33,
      fill: "#FFBB33",
    },
    {
      name: "1941-1960",
      pv: 28,
      fill: "#FFA433",
    },
    {
      name: "1961-1980",
      pv: 10,
      fill: "#FF8E33",
    },
    {
      name: "1981-2024",
      pv: 80,
      fill: "#FF7733",
    },
  ];

  return (
    <BarChart
      className="year-built-graph-container"
      width={500}
      height={200}
      data={data}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" interval={0} style={{ fontSize: "11px" }} />
      <YAxis />
      <Bar
        dataKey="pv"
        fill="#8884d8"
        activeBar={<Rectangle fill="pink" stroke="blue" />}
      />
    </BarChart>
  );
}

function PopulationGraph() {
  /////////////////////////////////////////////
  //
  // (SIDE) EFFECTS
  //
  /////////////////////////////////////////////

  useEffect(() => {
    const chartSvg = document.querySelector(".population-graph-container svg");
    updateSvgViewBoxToReduceMargin(chartSvg);
  }, []);

  /////////////////////////////////////////////
  //
  // FAKE DATA
  //
  /////////////////////////////////////////////

  const data = [
    {
      name: "< 200",
      pv: 7,
      fill: "#FFD233",
    },
    {
      name: "200-1000",
      pv: 12,
      fill: "#FFBB33",
    },
    {
      name: "1000-10,000",
      pv: 33,
      fill: "#FFA433",
    },
    {
      name: "10,001-50,000",
      pv: 18,
      fill: "#FF8E33",
    },
    {
      name: "> 50,000",
      pv: 11,
      fill: "#FF7733",
    },
  ];

  return (
    <BarChart
      className="population-graph-container"
      width={500}
      height={200}
      data={data}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" interval={0} style={{ fontSize: "11px" }} />
      <YAxis />
      <Bar
        dataKey="pv"
        fill="#8884d8"
        activeBar={<Rectangle fill="pink" stroke="blue" />}
      />
    </BarChart>
  );
}

function LastYearMaintenanceGraph() {
  /////////////////////////////////////////////
  //
  // (SIDE) EFFECTS
  //
  /////////////////////////////////////////////
  useEffect(() => {
    const chartSvg = document.querySelector(
      ".last-year-maintenance-graph-container svg"
    );
    updateSvgViewBoxToReduceMargin(chartSvg);
  }, []);

  /////////////////////////////////////////////
  //
  // FAKE DATA
  //
  /////////////////////////////////////////////

  const data = [
    {
      name: "1900-1920",
      pv: 32,
      fill: "#FFD233",
    },
    {
      name: "1921-1940",
      pv: 11,
      fill: "#FFBB33",
    },
    {
      name: "1941-1960",
      pv: 6,
      fill: "#FFA433",
    },
    {
      name: "1961-1980",
      pv: 30,
      fill: "#FF8E33",
    },
    {
      name: "1981-2024",
      pv: 49,
      fill: "#FF7733",
    },
  ];

  return (
    <BarChart
      className="last-year-maintenance-graph-container"
      width={500}
      height={200}
      data={data}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" interval={0} style={{ fontSize: "11px" }} />
      <YAxis />
      <Bar
        dataKey="pv"
        fill="#8884d8"
        activeBar={<Rectangle fill="pink" stroke="blue" />}
      />
    </BarChart>
  );
}

export default function DimensionTabs() {
  /////////////////////////////////////////////
  //
  // REACTIVE HOOKS AND SUCH
  //
  /////////////////////////////////////////////

  const { selectedState } = useGlobalState();

  return (
    <Tabs className="dimension-tabs">
      <TabList>
        <Tab>Year Built</Tab>
        <Tab>Last Maintenance Year</Tab>
        <Tab>County Populations</Tab>
      </TabList>

      <TabPanels>
        <TabPanel paddingLeft="0px">
          <YearBuiltGraph />
        </TabPanel>
        <TabPanel paddingLeft="0px">
          <LastYearMaintenanceGraph />
        </TabPanel>
        <TabPanel paddingLeft="0px">
          <PopulationGraph />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
