import React, { useRef, useEffect, useState } from "react";

import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax

import { useGlobalState } from "../../shared/global-state";

import { STATE_LAT_LON } from "../../shared/constants";

import "./MainMap.css";

export default function MainMap() {
  /////////////////////////////////////////////
  //
  // REACTIVE HOOKS AND SUCH
  //
  /////////////////////////////////////////////

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-103.5917);
  const [lat, setLat] = useState(40.6699);
  const [zoom, setZoom] = useState(9);
  const isFlying = useRef(false);
  const { selectedState, setSelectedState, setSelectedBridge } =
    useGlobalState();

  //
  // This is required because in React a context (like "useGlobalState()")
  // with reactive state is not updated correctly for the code executed in the MapBox event
  // handlers. But "refs" to work within those handlers. So we keep this ref in sync with the
  // "selectedState" reactive data from the  "useGlobalState()" context.
  //
  const selectedStateRef = useRef(null);

  /////////////////////////////////////////////
  //
  // (SIDE) EFFECTS
  //
  /////////////////////////////////////////////

  /**
   * Set up the MapBox map.
   */
  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    //
    // Once the map "lands" on a state, we'll retrieve the bridges data for that state.
    //
    map.current.on("moveend", () => {
      if (isFlying.current) {
        isFlying.current = false;
        addDataForSelectedState();
      }
    });

    //
    // Set up the interaction handlers for the map.
    //
    map.current.on("load", () => {
      /**
       * Handle when the user clicks on a cluster of bridges.
       */
      map.current.on("click", "clusters", (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current
          .getSource("bridges")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      /**
       * Handle when the user clicks on an individual bridge.
       */
      map.current.on("click", "unclustered-point", (e) => {
        setSelectedBridge(e.features[0]);
      });

      /**
       * Make the mouse pointer show when the user hovers over clusters of points or an indiviual point - that represents
       * a bridge.
       */
      map.current.on("mouseenter", ["clusters", "unclustered-point"], () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", ["clusters", "unclustered-point"], () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  });

  /**
   * If the user selects a new state from the map of the US, handle that here.
   */
  useEffect(() => {
    selectedStateRef.current = selectedState;

    if (!selectedState) {
      return;
    }

    //
    // We'll get the map to animate to the selected state.
    //
    const latLon = STATE_LAT_LON[selectedState];

    //
    // Do this in the next "tick" of the JavaScript event loop.
    //
    setTimeout(() => {
      isFlying.current = true;
    });

    map.current.setZoom(5);
    map.current.flyTo({
      maxDuration: 5000,
      center: [latLon.lon, latLon.lat],
    });
  }, [selectedState]);

  /////////////////////////////////////////////
  //
  // PRIVATE UI HANDLERS/METHODS
  //
  /////////////////////////////////////////////

  /**
   * This is invoked from within a MapBox callback. It *CAN* reference React "refs" correctly
   * but cannot reference reactive state from contexts correctly.
   */
  function addDataForSelectedState() {
    if (map.current.getLayer("clusters")) {
      map.current.removeLayer("clusters");
      map.current.removeLayer("cluster-count");
      map.current.removeLayer("unclustered-point");
    }

    if (map.current.getSource("bridges")) {
      map.current.removeSource("bridges");
    }

    //
    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
    //
    map.current.addSource("bridges", {
      type: "geojson",
      data: `http://localhost:3001/bridges/${selectedStateRef.current}`,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    });

    //
    // This layer shows the circles representing each cluster of 2 or more bridges/points.
    //
    map.current.addLayer({
      id: "clusters",
      type: "circle",
      source: "bridges",
      filter: ["has", "point_count"],
      paint: {
        //
        // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
        // with three steps to implement three types of circles:
        //   * #C09CF8, 20px circles when point count is less than 100
        //   * #FF3399, 30px circles when point count is between 100 and 750
        //   * #FF3399, 40px circles when point count is greater than or equal to 750
        //
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#C09CF8",
          100,
          "#FF3399",
          750,
          "#FF3399",
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#7526F0",
      },
    });

    //
    // This layer shows the text labels in the centers of the "cluster" circles.
    //
    map.current.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "bridges",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
    });

    //
    // This layer shows each indivual bridge/point (if we have drilled down into a cluster to the point
    // where a single bridge can be seen).
    //
    map.current.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "bridges",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#FF7733",
        "circle-radius": 10,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });
  }

  return <div className="main-map" ref={mapContainer} />;
}
