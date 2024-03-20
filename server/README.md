# mach9-bridges/server

## How To

install dependencies:
$ npm install

run the app:
$ DEBUG=server:\* npm start

## Data Sources

### The primary data set of bridges comes from:

You can access the NBI dataset at https://www.fhwa.dot.gov/bridge/nbi/ascii2022.cfm . For
concreteness and ease of import, we recommend that you use the Delimited Pennsylvania file
(https://www.fhwa.dot.gov/bridge/nbi/2022/delimited/PA22.txt), which is a text CSV.

### Where the lat/lon => County data comes from:

County from lat/lon => https://geo.fcc.gov/api/census/#!/area/get_area
Example: https://geo.fcc.gov/api/census/area?lat=39.74305833333334&lon=-77.27988055555555&censusYear=2020&format=json
