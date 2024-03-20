var fs = require("fs");
var express = require("express");
var router = express.Router();

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("data/bridges.db"); //":memory:");

/**
 * Return the geojson object containing all of the individual "features" representing each
 * bridge in the state specified by the passed-in state abbreviation.
 */
router.get("/:stateAbbreviation", function (req, res, next) {
  //
  // This is an empty set of features. If we don't yet have the data in the DB for the passed-in state,
  // this will ensure that the UI still works smoothly (no breaking!).
  //
  let data = {
    type: "FeatureCollection",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features: [],
  };

  //
  // TODO: Make all database access from within a "data services" layer.
  //
  const stmt = db.prepare(
    "SELECT id, abbreviation, name, bridges_geojson FROM state WHERE abbreviation=?"
  );
  stmt.each(
    req.params.stateAbbreviation,
    function (err, row) {
      console.log(row.id, row.name);
      data = JSON.parse(row.bridges_geojson);
    },
    function (error, count) {
      if (error) {
        console.error(error);
      }
      console.log("COUNT " + count);
      stmt.finalize();

      res.json(data);
    }
  );
});

module.exports = router;
