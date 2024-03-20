/**
 * Run this script from the root of the "server" directory in order to create the database and populate it with
 * data we have.
 *
 * NOTE: Currently this only loads the database with data from Pennsylvania. But you can see how this could be
 * extended to load the data for all the states for which we have bridges data.
 */

var fs = require("fs");

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("data/bridges.db"); //":memory:");

/////////////////////////////////////////////
//
// DATABASE DATA DEFINITION
//
/////////////////////////////////////////////

const CREATE_HIGHWAY_DISTRICT_TABLE = `
CREATE TABLE highway_district (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
)
`;

const CREATE_STATE_TABLE = `
CREATE TABLE state (
  id TEXT NOT NULL,
  abbreviation TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bridges_geojson TEXT
)
`;

const CREATE_ROUTE_TABLE = `
CREATE TABLE route (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT "Missing Name"
)
`;

const CREATE_COUNTY_TABLE = `
CREATE TABLE county (
  id TEXT PRIMARY KEY,
  state_abbreviation TEXT NOT NULL,
  name TEXT NOT NULL,
  population NUMERIC  NULL,

  FOREIGN KEY (state_abbreviation) REFERENCES state (abbreviation)
)
`;

const CREATE_BRIDGE_TABLE = `
  CREATE TABLE bridge (
    id TEXT PRIMARY KEY,
    highway_district_id TEXT NOT NULL,
    state_abbreviation TEXT NOT NULL,
    route_id TEXT NOT NULL,
    county_id NUMERIC NOT NULL,

    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location_details TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    bridge_geojson TEXT NULL,

    FOREIGN KEY (highway_district_id) REFERENCES highway_district (id),
    FOREIGN KEY (state_abbreviation) REFERENCES state (abbreviation),
    FOREIGN KEY (route_id) REFERENCES route (id),
    FOREIGN KEY (county_id) REFERENCES county (id)
  )
`;

/////////////////////////////////////////////
//
// DO ALL THE WORK HERE
//
/////////////////////////////////////////////

db.serialize(() => {
  //
  // Drop the tables if we have previously created the database.
  //
  db.run("DROP TABLE IF EXISTS bridge");
  db.run("DROP TABLE IF EXISTS county");
  db.run("DROP TABLE IF EXISTS route");
  db.run("DROP TABLE IF EXISTS state");
  db.run("DROP TABLE IF EXISTS highway_district");

  console.log("Creating highway_district table");
  db.run(CREATE_HIGHWAY_DISTRICT_TABLE);

  console.log("Creating state table");
  db.run(CREATE_STATE_TABLE);

  console.log("Creating route table");
  db.run(CREATE_ROUTE_TABLE);

  console.log("Creating county table");
  db.run(CREATE_COUNTY_TABLE);

  console.log("Creating bridge table");
  db.run(CREATE_BRIDGE_TABLE);

  //
  // Read the geojson (that we created via the "csv-to-json.js script"). We'll use this data to
  // populate the database.
  //
  // NOTE: If we were to be populating the databse from data for all of the states, we'd be
  // doing these steps (see below), once for each ".json" file of bridges we have for each state.
  //
  const filePath = `./data/pa_bridges.json`;
  const data = fs.readFileSync(filePath, {
    encoding: "utf8",
    flag: "r",
  });
  const geojson = JSON.parse(data);

  //
  // Hard-coded for now to just contain an entry for Pennsylvania.
  //
  const states = [
    {
      id: "42", // This number came from the NBI data set of bridges in Pennsylvania.
      name: "Pennsylvania",
      abbreviation: "PA",
      geojson: null,
    },
  ];

  //
  // We'll iterate through all of the bridges in the JSON file and populate the structures below with data.
  // After that, we'll use the data to INSERT rows into the database.
  //
  const highwayDistricts = {};
  const routes = {};
  const counties = {};

  for (let feature of geojson.features) {
    highwayDistricts[feature.properties.highwayDistrict002] = highwayDistricts[
      feature.properties.highwayDistrict002
    ] || {
      id: feature.properties.highwayDistrict002,
    };

    routes[feature.properties.routeNumber] = routes[
      feature.properties.routeNumber
    ] || {
      id: feature.properties.routeNumber,
    };

    counties[feature.properties.countyFIPS] = counties[
      feature.properties.countyFIPS
    ] || {
      id: feature.properties.countyFIPS,
      name: feature.properties.countyName,
      state_abbreviation: "PA",
    };
  }

  //
  // INSERT DATA INTO "state" TABLE
  //
  let stmt = db.prepare("INSERT INTO state VALUES (?,?,?,?)");
  for (let state of states) {
    stmt.run(state.id, state.abbreviation, state.name, data);
  }
  stmt.finalize();

  //
  // INSERT DATA INTO "county" TABLE
  //
  stmt = db.prepare("INSERT INTO county VALUES (?,?,?,0)");
  for (let countyId of Object.keys(counties)) {
    const county = counties[countyId];
    stmt.run(county.id, county.state_abbreviation, county.name);
  }
  stmt.finalize();

  //
  // INSERT DATA INTO "highway_district" TABLE
  //
  stmt = db.prepare("INSERT INTO highway_district VALUES (?,?)");
  for (let highwayDistrictId of Object.keys(highwayDistricts)) {
    const highwayDistrict = highwayDistricts[highwayDistrictId];

    stmt.run(
      highwayDistrict.id,
      `${highwayDistrict.id} - Hwy District Name Missing`
    );
  }
  stmt.finalize();

  //
  // INSERT DATA INTO "route" TABLE
  //
  stmt = db.prepare("INSERT INTO route VALUES (?,?)");
  for (let routeId of Object.keys(routes)) {
    const route = routes[routeId];
    stmt.run(route.id, `${route.id} - Route Name Missing`);
  }
  stmt.finalize();

  //
  // INSERT DATA INTO "bridge" TABLE
  //
  let rowNumber = 0;
  stmt = db.prepare("INSERT INTO bridge VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  for (let feature of geojson.features) {
    rowNumber += 1;
    console.log("ROW " + rowNumber);
    stmt.run(
      feature.properties.structureNumber,
      feature.properties.highwayDistrict002 || "missing",
      "PA",
      feature.properties.routeNumber || "missing",
      feature.properties.countyCode003 || "missing",
      feature.properties.featuresDesc006A || "missing name",
      feature.properties.featuresDesc006A || "missing description",
      feature.properties.locationDetails || "missing details",
      feature.properties.lat,
      feature.properties.lon,
      JSON.stringify(feature, null, 3)
    );
  }
  stmt.finalize();
});

db.close();
