/**
 * Read the file into memory, parse it into objects, add "county" info into each bridge object, and
 * finally create a JSON object in GeoJSON format and save that out to disc.
 *
 * Once this has been created, we can run the "create-database" script in order to create the database used by the
 * API server and the MapBox based UI.
 */

const fs = require("fs");
const { parse } = require("csv-parse");
const https = require("https");

/**
 * This returns a "lat/lon" pair derived from the passed-in data for lat and lon but based on the
 * data format used in the NBI data set.
 *
 * Inspired by code from: https://gis.stackexchange.com/questions/90431/
 *
 * Read about format of lat/lon in these fields here: https://www.fhwa.dot.gov/bridge/mtguide.pdf
 *
 * Needed to fix some logic bugs!
 *
 * The LAT value comes from the "LAT_016" column of the data file.
 *
 * The LON value comes from the "LONG_017" column of the data file.
 */
function nbiLocationToLatLon(latDegMinSecs, lonDegMinSecs) {
  const latDeg = latDegMinSecs.substring(0, 2);
  const latMin = latDegMinSecs.substring(2, 4);
  const latSec = `${latDegMinSecs.substring(4, 6)}.${latDegMinSecs.substring(
    6,
    8
  )}`;
  const lat =
    parseFloat(latDeg) +
    parseFloat(latMin / 60.0) +
    parseFloat(latSec / 3600.0);

  const lonDeg = lonDegMinSecs.substring(0, 2);
  const lonMin = lonDegMinSecs.substring(2, 4);
  const lonSec = `${lonDegMinSecs.substring(4, 6)}.${lonDegMinSecs.substring(
    6,
    8
  )}`;
  const lon =
    -1 *
    (parseFloat(lonDeg) +
      parseFloat(lonMin / 60.0) +
      parseFloat(lonSec / 3600.0));

  return {
    lat,
    lon,
  };
}

/**
 * HACK! This method can only currently handle spread sheet column ids of one or two "digits"
 * (like "A" or "L" or "AK"). It converts a passed-in spread sheet column id into a zero-based index.
 *
 * We need this because when we parse the CSV file, the parsing code returns an array of strings for each
 * row in the spread sheet. We have a map of the spread sheet column ids whose data we want to access. But we
 * need the 0-based index equivelents of these ids in order to access the data in the array for each row.
 */
function spreadsheetColToArrayIndex(colName) {
  const letterACode = "A".charCodeAt(0);
  let arrayIndex = 0;
  let multiplyBy = 0;

  //
  // Process last character to first
  //
  colName
    .toUpperCase()
    .split("")
    .reverse()
    .forEach((char, index) => {
      const asciiCode = char.charCodeAt(0);
      if (index === 0) {
        arrayIndex = asciiCode - letterACode;
      } else {
        arrayIndex += 26 * (asciiCode - letterACode + 1);
      }
    });

  return arrayIndex;
}

/**
 * Pass in an almost complete "bridge" object, use a free .gov API that returns a county code and name that contains
 * the passed-in LAT/LON. Add that county info into the passed-in bridge object and return the object.
 */
function addCountyFieldsForLatLon(obj) {
  return new Promise((resolve, reject) => {
    //
    // Make the API call.
    //
    const url = `https://geo.fcc.gov/api/census/block/find?latitude=${obj.lat}&longitude=${obj.lon}&censusYear=2020&showall=true&format=json`;
    https
      .get(url, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        //
        // We've got the entire payload back from the API...
        //
        res.on("end", () => {
          try {
            let json = JSON.parse(body);
            const {
              County: { name: countyName, FIPS: countyFIPS },
            } = json;
            obj = Object.assign(obj, {
              countyName,
              countyFIPS,
              countyPopulation: 1000, // Fake population!. TODO: Add the real data into all of our geojson and the db later.
            });
            resolve(obj);
          } catch (error) {
            console.error(error.message);
            reject(error);
          }
        });
      })
      .on("error", (error) => {
        console.error(error.message);
      });
  });
}

//
// For logging to the console. Each time you run this script, it can take several minutes. This allows us to know
// how far along we are.
//
let recordNumber = 0;

/**
 * This is a long-running method. For each bridge, it will go out to an API that tells us which county the
 * bridge is in based on the LAT/LON of the bridge. We'll add that county info into each bridge object.
 */
async function addCountiesToBridges(bridges) {
  const bridgesWithCounties = [];
  for (let bridge of bridges) {
    recordNumber += 1;
    console.log("row  " + recordNumber);
    bridge = await addCountyFieldsForLatLon(bridge);
    bridgesWithCounties.push(bridge);
  }
  return bridgesWithCounties;
}

/**
 * Take as input a "row" that was extracted from the spreadsheet of bridges. The row is an array. We'll
 * reach into this "row" and use its data to create a JavaScript object containing the data we care about.
 */
function rowToObject(row) {
  //
  // These are the CSV columns we care about. Currently these are the data we'll extract from the NBI data
  // for each bridge in a state.
  //
  const properties = [
    {
      name: "stateCode",
      column: "A",
    },
    {
      name: "structureNumber",
      column: "B",
      isNumeric: true,
    },
    {
      name: "routeNumber",
      column: "F",
      isNumeric: true,
    },
    {
      name: "highwayDistrict002",
      column: "H",
      isNumeric: true,
    },
    {
      name: "countyCode003",
      column: "I",
    },
    {
      name: "featuresDesc006A",
      column: "K",
    },
    {
      name: "facilityCarried007",
      column: "M",
    },
    {
      name: "locationDetails",
      column: "N",
    },
    {
      name: "minVertClear010",
      column: "O",
    },
    {
      name: "kiloPoint011",
      column: "P",
    },
    {
      name: "lrsInvRoute013A",
      column: "R",
    },
    {
      name: "lat016",
      column: "T",
    },
    {
      name: "long017",
      column: "U",
    },
  ];

  let obj = {};
  for (let prop of properties) {
    const index = spreadsheetColToArrayIndex(prop.column);
    let value = row[index];
    if (prop.isNumeric) {
      if (!isNaN(value)) {
        value = parseFloat(value).toString();
      } else {
        value = value.trim();
      }
    }
    obj[prop.name] = value;
  }

  obj = Object.assign(
    obj,
    //
    // Add legit "lat" and "lon" properties into the object. We calculate these values based on the
    // "degrees+minutes+seconds" values we obtain from the raw CSV data.
    nbiLocationToLatLon(
      parseInt(obj.lat016).toString(),
      parseInt(obj.long017).toString()
    )
  );

  return obj;
}

//
// This is our accumulator of bridge objects that were created based on CSV data.
//
const jsonRows = [];

//
// NOTE: This is the path to the Pennsylvania data that we downloaded from
// here: https://www.fhwa.dot.gov/bridge/nbi/2022/delimited/PA22.txt
//
const FILE_PATH = "data/pennsylvania.csv";

//
// Read the file into memory, parse it into objects, add "county" info into each bridge object, and
// finally create a JSON object in GeoJSON format and save that out to disc.
//
const stream = fs
  .createReadStream(FILE_PATH, { emitClose: true })
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    const obj = rowToObject(row);
    jsonRows.push(obj);
  })
  .on("close", () => {
    addCountiesToBridges(jsonRows).then((bridges) => {
      const features = bridges.map((bridge) => {
        return {
          type: "Feature",
          properties: bridge,
          geometry: {
            type: "Point",
            coordinates: [bridge.lon, bridge.lat, 0.0],
          },
        };
      });

      const geojson = {
        type: "FeatureCollection",
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
        },
        features,
      };

      //
      // Save this out to disc. Once this has been created, we can
      // run the "create-database" script in order to create the database used by the API server and
      // the MapBox based UI.
      //
      fs.writeFileSync(
        "data/pa_bridges.json",
        JSON.stringify(geojson, null, 3)
      );
    });
  });
