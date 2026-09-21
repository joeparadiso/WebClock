// =============================================================================
// MBTA Franklin / Foxboro Commuter Rail Line Live Tracker
// DETAILS:
//  Provides a real-time interactive schematic visualization of the Franklin/Foxboro
//  commuter rail line inside a dark glassmorphic modal.
//  - Displays all 13 stations with branch points to Forge Park/495 and Foxboro.
//  - Tracks active trains in real-time with 10s MBTA GPS polling and 60 FPS
//    smooth kinematic animation (dead reckoning interpolation).
//  - Station popovers for upcoming arrivals in both directions.
//  - Synchronized bottom active train cards shelf with live speed & countdowns.
//  - Off-peak handling with upcoming scheduled departures from Dedham.
// =============================================================================

(function () {
  const API_KEY = "72fa8ae012994df7b7f671c2c52c9ab2";
  const BASE_URL = "https://api-v3.mbta.com";
  const ROUTE_ID = "CR-Franklin";
  const TRACKED_ROUTES = "CR-Franklin,CR-Fairmount";
  const ALLOWED_ROUTES = new Set(["CR-Franklin", "CR-Fairmount"]);
  const DEDHAM_STOP_ID = "place-FB-0118";
  const POLL_INTERVAL_MS = 10000;

  // Station definitions along the Franklin / Foxboro line (All 24 GTFS Stations)
  // Coordinates mapped to SVG viewBox="-30 20 1420 340"
  const STATIONS = [
    // 1. South Station (Origin Terminal)
    { id: "place-sstat", name: "South Station", shortName: "South Station", x: 50, y: 200, branch: "trunk", isTerminal: true, order: 0, lat: 42.352271, lon: -71.055242 },

    // Upper Corridor: Southwest Corridor (via Back Bay, y = 120)
    { id: "place-bbsta", name: "Back Bay", shortName: "Back Bay", x: 130, y: 120, branch: "sw_corridor", order: 1, lat: 42.347350, lon: -71.075727 },
    { id: "place-rugg", name: "Ruggles", shortName: "Ruggles", x: 200, y: 120, branch: "sw_corridor", order: 2, lat: 42.336377, lon: -71.088961 },
    { id: "place-forhl", name: "Forest Hills", shortName: "Forest Hills", x: 270, y: 120, branch: "sw_corridor", order: 3, lat: 42.300646, lon: -71.113686 },
    { id: "place-NEC-2203", name: "Hyde Park", shortName: "Hyde Park", x: 340, y: 120, branch: "sw_corridor", order: 4, lat: 42.254800, lon: -71.127800 },

    // Lower Corridor: Fairmount Line (y = 280)
    { id: "place-DB-2265", name: "Newmarket", shortName: "Newmarket", x: 115, y: 280, branch: "fairmount", order: 1, lat: 42.3267, lon: -71.0664 },
    { id: "place-DB-2258", name: "Uphams Corner", shortName: "Uphams Corner", x: 165, y: 280, branch: "fairmount", order: 2, lat: 42.3160, lon: -71.0661 },
    { id: "place-DB-2249", name: "Four Corners/Geneva", shortName: "Four Corners", x: 215, y: 280, branch: "fairmount", order: 3, lat: 42.3045, lon: -71.0754 },
    { id: "place-DB-2240", name: "Talbot Avenue", shortName: "Talbot Ave", x: 265, y: 280, branch: "fairmount", order: 4, lat: 42.2925, lon: -71.0782 },
    { id: "place-DB-2230", name: "Morton Street", shortName: "Morton St", x: 315, y: 280, branch: "fairmount", order: 5, lat: 42.2809, lon: -71.0858 },
    { id: "place-DB-2222", name: "Blue Hill Avenue", shortName: "Blue Hill Ave", x: 365, y: 280, branch: "fairmount", order: 6, lat: 42.2709, lon: -71.0963 },
    { id: "place-DB-2205", name: "Fairmount", shortName: "Fairmount", x: 415, y: 280, branch: "fairmount", order: 7, lat: 42.2536, lon: -71.1194 },

    // Convergence Junction where both corridors join (y = 200)
    { id: "place-DB-0095", name: "Readville", shortName: "Readville", x: 480, y: 200, branch: "trunk", isJunction: true, order: 8, lat: 42.2384, lon: -71.1332 },

    // Mainline Trunk (y = 200)
    { id: "place-FB-0109", name: "Endicott", shortName: "Endicott", x: 550, y: 200, branch: "trunk", order: 9, lat: 42.2339, lon: -71.1578 },
    { id: "place-FB-0118", name: "Dedham Corporate Center", shortName: "Dedham Corp", x: 630, y: 200, branch: "trunk", order: 10, lat: 42.227079, lon: -71.174254 },
    { id: "place-FB-0125", name: "Islington", shortName: "Islington", x: 710, y: 200, branch: "trunk", order: 11, lat: 42.203648, lon: -71.189568 },
    { id: "place-FB-0143", name: "Norwood Depot", shortName: "Norwood Dep", x: 780, y: 200, branch: "trunk", order: 12, lat: 42.193260, lon: -71.199410 },
    { id: "place-FB-0148", name: "Norwood Central", shortName: "Norwood Ctr", x: 850, y: 200, branch: "trunk", order: 13, lat: 42.183422, lon: -71.207860 },
    { id: "place-FB-0166", name: "Windsor Gardens", shortName: "Windsor Gdns", x: 920, y: 200, branch: "trunk", order: 14, lat: 42.162796, lon: -71.229410 },
    { id: "place-FB-0191", name: "Walpole", shortName: "Walpole", x: 1000, y: 200, branch: "trunk", isJunction: true, order: 15, lat: 42.143288, lon: -71.250557 },

    // Forge Park / Franklin Branch (Upper fork, y = 110)
    { id: "place-FB-0230", name: "Norfolk", shortName: "Norfolk", x: 1095, y: 110, branch: "forge_park", order: 16, lat: 42.122395, lon: -71.325981 },
    { id: "place-FB-0275", name: "Franklin/Dean College", shortName: "Franklin", x: 1190, y: 110, branch: "forge_park", order: 17, lat: 42.086475, lon: -71.401917 },
    { id: "place-FB-0303", name: "Forge Park/495", shortName: "Forge Park/495", x: 1290, y: 110, branch: "forge_park", isTerminal: true, order: 18, lat: 42.091755, lon: -71.458694 },

    // Foxboro Branch (Lower fork, y = 290)
    { id: "place-FS-0049", name: "Foxboro", shortName: "Foxboro", x: 1230, y: 290, branch: "foxboro", isTerminal: true, order: 19, lat: 42.095100, lon: -71.261510 }
  ];

  // Route sequence lookups for kinematic interpolation
  const ROUTE_BACK_BAY = [
    "place-sstat", "place-bbsta", "place-rugg", "place-forhl", "place-NEC-2203",
    "place-DB-0095", "place-FB-0109", "place-FB-0118", "place-FB-0125",
    "place-FB-0143", "place-FB-0148", "place-FB-0166", "place-FB-0191"
  ];

  const ROUTE_FAIRMOUNT = [
    "place-sstat", "place-DB-2265", "place-DB-2258", "place-DB-2249",
    "place-DB-2240", "place-DB-2230", "place-DB-2222", "place-DB-2205",
    "place-DB-0095", "place-FB-0109", "place-FB-0118", "place-FB-0125",
    "place-FB-0143", "place-FB-0148", "place-FB-0166", "place-FB-0191"
  ];

  const BRANCH_FORGE_PARK = ["place-FB-0230", "place-FB-0275", "place-FB-0303"];
  const BRANCH_FOXBORO = ["place-FS-0049"];

  const FAIRMOUNT_STOP_IDS = new Set([
    "place-DB-2265", "place-DB-2258", "place-DB-2249", "place-DB-2240",
    "place-DB-2230", "place-DB-2222", "place-DB-2205", "DB-2265", "DB-2258",
    "DB-2249", "DB-2240", "DB-2230", "DB-2222", "DB-2205"
  ]);

  const ALLOWED_HEADSIGNS = [
    "south station", "boston", "forge park/495", "forge park",
    "franklin/dean college", "franklin", "foxboro", "walpole", "norwood central",
    "readville"
  ];

  const STATIONS_BY_ID = new Map(STATIONS.map(s => [s.id, s]));

  // Match stop ID fragments to genuine station definitions
  function resolveStationFromStopId(stopId, parentStationId) {
    if (parentStationId && STATIONS_BY_ID.has(parentStationId)) {
      return STATIONS_BY_ID.get(parentStationId);
    }
    if (!stopId) return null;
    if (STATIONS_BY_ID.has(stopId)) return STATIONS_BY_ID.get(stopId);

    // Exact core code matching (e.g. "FB-0118-01" -> "place-FB-0118")
    for (const station of STATIONS) {
      const coreCode = station.id.replace("place-", "");
      if (stopId.includes(coreCode)) return station;
    }

    // Aliases for multi-platform / legacy station codes
    if (stopId.includes("NEC-2287") || stopId.includes("sstat")) return STATIONS_BY_ID.get("place-sstat");
    if (stopId.includes("NEC-2276") || stopId.includes("bbsta")) return STATIONS_BY_ID.get("place-bbsta");
    if (stopId.includes("NEC-2265") || stopId.includes("rugg")) return STATIONS_BY_ID.get("place-rugg");
    if (stopId.includes("forhl")) return STATIONS_BY_ID.get("place-forhl");
    if (stopId.includes("NEC-2203")) return STATIONS_BY_ID.get("place-NEC-2203");
    if (stopId.includes("DB-0095") || stopId.includes("FB-0095")) return STATIONS_BY_ID.get("place-DB-0095");
    if (stopId.includes("FB-0109")) return STATIONS_BY_ID.get("place-FB-0109");
    if (stopId.includes("FB-0118")) return STATIONS_BY_ID.get("place-FB-0118");
    if (stopId.includes("FB-0125") || stopId.includes("FB-0128")) return STATIONS_BY_ID.get("place-FB-0125");
    if (stopId.includes("FB-0143")) return STATIONS_BY_ID.get("place-FB-0143");
    if (stopId.includes("FB-0148")) return STATIONS_BY_ID.get("place-FB-0148");
    if (stopId.includes("FB-0166")) return STATIONS_BY_ID.get("place-FB-0166");
    if (stopId.includes("FB-0191") || stopId.includes("FB-0190")) return STATIONS_BY_ID.get("place-FB-0191");
    if (stopId.includes("FB-0230")) return STATIONS_BY_ID.get("place-FB-0230");
    if (stopId.includes("FB-0275")) return STATIONS_BY_ID.get("place-FB-0275");
    if (stopId.includes("FB-0303")) return STATIONS_BY_ID.get("place-FB-0303");
    if (stopId.includes("FS-0049")) return STATIONS_BY_ID.get("place-FS-0049");

    // Fairmount line stops
    if (stopId.includes("DB-2265")) return STATIONS_BY_ID.get("place-DB-2265");
    if (stopId.includes("DB-2258")) return STATIONS_BY_ID.get("place-DB-2258");
    if (stopId.includes("DB-2249")) return STATIONS_BY_ID.get("place-DB-2249");
    if (stopId.includes("DB-2240")) return STATIONS_BY_ID.get("place-DB-2240");
    if (stopId.includes("DB-2230")) return STATIONS_BY_ID.get("place-DB-2230");
    if (stopId.includes("DB-2222")) return STATIONS_BY_ID.get("place-DB-2222");
    if (stopId.includes("DB-2205")) return STATIONS_BY_ID.get("place-DB-2205");

    return null;
  }

  // State management
  let isModalOpen = false;
  let pollIntervalId = null;
  let counterIntervalId = null;
  let secondsUntilRefresh = 10;
  let animFrameId = null;

  // Active tracking data
  let trackedTrains = new Map(); // vehicleId -> { vehicle, currentPos: {x,y}, targetPos: {x,y}, speed, nextStop, eta, ... }
  let lastPredictions = [];
  let lastTripsMap = new Map();
  let selectedTrainId = null;
  let hoveredTrainId = null;
  let selectedStationId = null;

  // Cached SVG Path elements for length and point calculations
  let svgPathForgePark = null;
  let svgPathFoxboro = null;
  let svgPathFairmount = null;

  // Helper to fetch JSON from the MBTA API with query parameters
  async function fetchJson(url, params) {
    const usp = new URLSearchParams(params);
    const resp = await fetch(`${url}?${usp.toString()}`);
    if (!resp.ok) throw new Error(`MBTA API error (${resp.status})`);
    return resp.json();
  }

  // Normalizes ISO time strings for older Safari / Date parser compatibility
  function normalizeIsoTime(str) {
    if (
      str &&
      str.length > 5 &&
      (str[str.length - 5] === "+" || str[str.length - 5] === "-") &&
      str[str.length - 3] !== ":"
    ) {
      return str.slice(0, -2) + ":" + str.slice(-2);
    }
    return str;
  }

  function formatTime(dt) {
    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  }

  function formatCountdown(targetDate) {
    const now = new Date();
    const diffMs = targetDate - now;
    if (diffMs <= 0) return "Arriving now";
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `in ${secs}s`;
    return `in ${mins}m ${secs}s`;
  }

  // Cubic Bezier polynomial evaluator for smooth curved rail tracks
  function evalBezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    };
  }

  // Calculates track coordinates along the schematic paths
  function getCoordinatesAlongRoute(targetStation, previousStation, fraction, branchName, isViaFairmount) {
    if (!targetStation) return { x: 500, y: 200, angle: 0 };
    if (!previousStation) return { x: targetStation.x, y: targetStation.y, angle: 0 };

    const clampedFraction = Math.max(0, Math.min(1, fraction));
    const id1 = previousStation.id;
    const id2 = targetStation.id;
    const pair = [id1, id2].sort().join("<->");

    // 1. South Station <-> Back Bay (y=200 to y=120)
    if (pair === "place-bbsta<->place-sstat") {
      const isForward = id1 === "place-sstat";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 50, y: 200 }, { x: 85, y: 200 }, { x: 95, y: 120 }, { x: 130, y: 120 }, t);
      return { ...pos, angle: isForward ? -40 : 140 };
    }

    // 2. South Station <-> Newmarket (y=200 to y=280)
    if (pair === "place-DB-2265<->place-sstat") {
      const isForward = id1 === "place-sstat";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 50, y: 200 }, { x: 80, y: 200 }, { x: 90, y: 280 }, { x: 115, y: 280 }, t);
      return { ...pos, angle: isForward ? 40 : -140 };
    }

    // 3. Hyde Park <-> Readville (y=120 to y=200)
    if (pair === "place-DB-0095<->place-NEC-2203") {
      const isForward = id1 === "place-NEC-2203";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 340, y: 120 }, { x: 410, y: 120 }, { x: 445, y: 200 }, { x: 480, y: 200 }, t);
      return { ...pos, angle: isForward ? 40 : -140 };
    }

    // 4. Fairmount <-> Readville (y=280 to y=200)
    if (pair === "place-DB-0095<->place-DB-2205") {
      const isForward = id1 === "place-DB-2205";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 415, y: 280 }, { x: 440, y: 280 }, { x: 455, y: 200 }, { x: 480, y: 200 }, t);
      return { ...pos, angle: isForward ? -40 : 140 };
    }

    // 5. Walpole <-> Norfolk (y=200 to y=110)
    if (pair === "place-FB-0191<->place-FB-0230") {
      const isForward = id1 === "place-FB-0191";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 1000, y: 200 }, { x: 1040, y: 200 }, { x: 1055, y: 110 }, { x: 1095, y: 110 }, t);
      return { ...pos, angle: isForward ? -40 : 140 };
    }

    // 6. Walpole <-> Foxboro (y=200 to y=290)
    if (pair === "place-FB-0191<->place-FS-0049") {
      const isForward = id1 === "place-FB-0191";
      const t = isForward ? clampedFraction : (1 - clampedFraction);
      const pos = evalBezier({ x: 1000, y: 200 }, { x: 1050, y: 200 }, { x: 1080, y: 290 }, { x: 1230, y: 290 }, t);
      return { ...pos, angle: isForward ? 40 : -140 };
    }

    // Linear straight horizontal track
    const currentX = previousStation.x + (targetStation.x - previousStation.x) * clampedFraction;
    const currentY = previousStation.y + (targetStation.y - previousStation.y) * clampedFraction;
    const angle = Math.atan2(targetStation.y - previousStation.y, targetStation.x - previousStation.x) * (180 / Math.PI);

    return { x: currentX, y: currentY, angle };
  }

  // ===========================================================================
  // API Fetching & Data Reconciliation
  // ===========================================================================

  async function fetchLiveTrackerData() {
    try {
      // 1. Query real-time vehicles on Franklin / Foxboro line
      const [vehiclesResp, predictionsResp] = await Promise.all([
        fetchJson(`${BASE_URL}/vehicles`, {
          "filter[route]": TRACKED_ROUTES,
          "include": "trip,stop",
          "api_key": API_KEY,
        }).catch(err => {
          console.warn("Error fetching vehicles:", err);
          return { data: [], included: [] };
        }),
        fetchJson(`${BASE_URL}/predictions`, {
          "filter[route]": TRACKED_ROUTES,
          "include": "trip,stop",
          "sort": "departure_time",
          "api_key": API_KEY,
        }).catch(err => {
          console.warn("Error fetching predictions:", err);
          return { data: [], included: [] };
        }),
      ]);

      // Index included resources for fast lookup
      const stopsMap = new Map(
        (vehiclesResp.included || []).concat(predictionsResp.included || [])
          .filter(x => x.type === "stop")
          .map(s => [s.id, s])
      );
      const tripsMap = new Map(
        (vehiclesResp.included || []).concat(predictionsResp.included || [])
          .filter(x => x.type === "trip")
          .map(t => [t.id, t])
      );
      lastTripsMap = tripsMap;
      lastPredictions = predictionsResp.data || [];

      processVehiclesData(vehiclesResp.data || [], tripsMap, stopsMap);
    } catch (e) {
      console.error("Error refreshing live tracker data:", e);
    }
  }

  // Processes MBTA vehicles and maps each vehicle to SVG track positions
  function processVehiclesData(vehicles, tripsMap, stopsMap) {
    const activeIds = new Set();
    const now = Date.now();

    for (const vehicle of vehicles) {
      const attrs = vehicle.attributes || {};
      const rels = vehicle.relationships || {};

      const tripId = rels.trip?.data?.id;
      const stopId = rels.stop?.data?.id;
      const tripObj = tripId ? tripsMap.get(tripId) : null;
      const stopObj = stopId ? stopsMap.get(stopId) : null;

      // 1. Strict Route Validation:
      // Allow genuine Franklin / Foxboro and Fairmount Line trains that travel along
      // this schematic corridor, while strictly blocking other lines (e.g. Providence/Stoughton).
      const vRoute = rels.route?.data?.id;
      const tripRoute = tripObj?.relationships?.route?.data?.id;
      const effectiveRoute = vRoute || tripRoute;
      const isValidRoute = (vRoute ? ALLOWED_ROUTES.has(vRoute) : true) &&
                           (tripRoute ? ALLOWED_ROUTES.has(tripRoute) : true) &&
                           ALLOWED_ROUTES.has(effectiveRoute);

      const directionId = attrs.direction_id; // 0 = Outbound, 1 = Inbound
      const isInbound = directionId === 1;
      const trainNumber = tripObj?.attributes?.name || attrs.label || "Commuter Rail";
      const headsign = (tripObj?.attributes?.headsign || (isInbound ? "South Station" : "Forge Park/495")).trim();
      const headsignLower = headsign.toLowerCase();

      // Ensure destination matches genuine Franklin / Foxboro line destinations
      const isAllowedHeadsign = ALLOWED_HEADSIGNS.some(h => headsignLower.includes(h));

      if (!isValidRoute || !isAllowedHeadsign) {
        continue;
      }

      const vId = vehicle.id;
      const status = attrs.current_status || "IN_TRANSIT_TO"; // IN_TRANSIT_TO, STOPPED_AT, INCOMING_AT
      const currentSeq = attrs.current_stop_sequence ?? 0;
      const speedMph = attrs.speed !== null && attrs.speed !== undefined ? Math.round(attrs.speed) : 0;

      // Identify destination branch
      const branchName = headsignLower.includes("foxboro") ? "foxboro" : "forge_park";

      // Match target station
      const parentStopId = stopObj?.relationships?.parent_station?.data?.id;
      const targetStation = resolveStationFromStopId(stopId, parentStopId) ||
        (headsignLower.includes("readville") ? STATIONS_BY_ID.get("place-DB-0095") :
        (isInbound ? STATIONS[0] : (branchName === "foxboro" ? STATIONS[STATIONS.length - 1] : STATIONS[STATIONS.length - 2])));

      // Match and sort predictions by stop sequence for this trip
      const tripPredictions = lastPredictions
        .filter(p => p.relationships?.trip?.data?.id === tripId)
        .sort((a, b) => (a.attributes?.stop_sequence ?? 0) - (b.attributes?.stop_sequence ?? 0));

      // Detect if this trip is scheduled via the Fairmount Line corridor
      const isViaFairmount = FAIRMOUNT_STOP_IDS.has(stopId) ||
                             FAIRMOUNT_STOP_IDS.has(parentStopId) ||
                             tripPredictions.some(p => {
                               const sId = p.relationships?.stop?.data?.id || "";
                               return FAIRMOUNT_STOP_IDS.has(sId) || sId.includes("DB-");
                             }) ||
                             headsignLower.includes("fairmount") ||
                             effectiveRoute === "CR-Fairmount";

      // Check current stop prediction & departure time
      const currentPred = tripPredictions.find(p => (p.attributes?.stop_sequence ?? 0) === currentSeq);
      const depTimeStr = currentPred?.attributes?.departure_time;
      const depTime = depTimeStr ? new Date(normalizeIsoTime(depTimeStr)).getTime() : null;

      // 2. Idle / Staged Train Filter:
      // If train is stopped at terminal origin (seq 0) but scheduled departure is > 35m in the future,
      // it is an idle train staged on tracks not yet in passenger service -> omit from active tracker.
      if (status === "STOPPED_AT" && currentSeq === 0 && depTime) {
        if (depTime - now > 35 * 60 * 1000) {
          continue;
        }
      }

      // Train passed all filters, mark as active
      activeIds.add(vId);

      // 3. Status Text, Next Stop & Downstream ETA Resolution:
      let statusText = "";
      let nextStationName = targetStation.name;
      let nextEta = null;

      if (status === "STOPPED_AT") {
        if (currentSeq === 0) {
          const minsToDep = depTime ? Math.max(0, Math.round((depTime - now) / 60000)) : null;
          statusText = minsToDep !== null
            ? (minsToDep <= 0 ? "Boarding (departs now)" : `Boarding (departs in ${minsToDep}m)`)
            : "Boarding";

          // Next stop is the downstream station (first stop after sequence 0)
          const downstreamPred = tripPredictions.find(p => (p.attributes?.stop_sequence ?? 0) > currentSeq);
          if (downstreamPred) {
            const dsStopId = downstreamPred.relationships?.stop?.data?.id;
            const dsStopObj = stopsMap.get(dsStopId);
            const dsMatched = resolveStationFromStopId(dsStopId);
            nextStationName = dsStopObj?.attributes?.name || dsMatched?.name || "Downstream Stop";
            const dsTime = downstreamPred.attributes?.arrival_time || downstreamPred.attributes?.departure_time;
            if (dsTime) nextEta = new Date(normalizeIsoTime(dsTime));
          } else {
            nextStationName = headsign;
          }
        } else {
          // Intermediate or final station stop
          const stationLabel = targetStation.shortName || targetStation.name;
          statusText = `Stopped at ${stationLabel}`;
          const downstreamPred = tripPredictions.find(p => (p.attributes?.stop_sequence ?? 0) > currentSeq);
          if (downstreamPred) {
            const dsStopId = downstreamPred.relationships?.stop?.data?.id;
            const dsStopObj = stopsMap.get(dsStopId);
            const dsMatched = resolveStationFromStopId(dsStopId);
            nextStationName = dsStopObj?.attributes?.name || dsMatched?.name || "Next Stop";
            const dsTime = downstreamPred.attributes?.arrival_time || downstreamPred.attributes?.departure_time;
            if (dsTime) nextEta = new Date(normalizeIsoTime(dsTime));
          } else {
            nextStationName = `Terminus (${headsign})`;
          }
        }
      } else {
        // IN_TRANSIT_TO or INCOMING_AT
        const targetPred = tripPredictions.find(p => (p.attributes?.stop_sequence ?? 0) >= currentSeq) || tripPredictions[0];
        const targetPredStopId = targetPred?.relationships?.stop?.data?.id || stopId;
        const targetPredStopObj = stopsMap.get(targetPredStopId);
        const targetPredMatched = resolveStationFromStopId(targetPredStopId);
        nextStationName = targetPredStopObj?.attributes?.name || targetPredMatched?.name || targetStation.name;

        const tTime = targetPred?.attributes?.arrival_time || targetPred?.attributes?.departure_time;
        if (tTime) nextEta = new Date(normalizeIsoTime(tTime));

        if (status === "INCOMING_AT") {
          const stationLabel = targetPredMatched?.shortName || targetStation.shortName || nextStationName;
          statusText = `Approaching ${stationLabel}`;
        } else {
          statusText = speedMph > 0 ? `In transit (${speedMph} mph)` : "In transit";
        }
      }

      // Determine previous station based on route sequence and direction
      const baseRoute = isViaFairmount ? ROUTE_FAIRMOUNT : ROUTE_BACK_BAY;
      const fullSeq = branchName === "foxboro" ? [...baseRoute, ...BRANCH_FOXBORO] : [...baseRoute, ...BRANCH_FORGE_PARK];

      const targetIdx = targetStation ? fullSeq.indexOf(targetStation.id) : -1;
      let previousStation = null;
      if (targetIdx !== -1) {
        if (isInbound) {
          // Heading toward South Station (decreasing indices) -> previous was higher index
          const prevId = fullSeq[targetIdx + 1];
          if (prevId) previousStation = STATIONS_BY_ID.get(prevId);
        } else {
          // Heading outbound (increasing indices) -> previous was lower index
          const prevId = fullSeq[targetIdx - 1];
          if (prevId) previousStation = STATIONS_BY_ID.get(prevId);
        }
      }

      // Calculate position fraction
      let fraction = 0.5;
      if (status === "STOPPED_AT") {
        fraction = 1.0;
      } else if (status === "INCOMING_AT") {
        fraction = 0.88;
      } else {
        // IN_TRANSIT_TO
        fraction = 0.5;
      }

      const targetCoords = getCoordinatesAlongRoute(targetStation, previousStation, fraction, branchName, isViaFairmount);

      if (!trackedTrains.has(vId)) {
        // First time seeing this train
        trackedTrains.set(vId, {
          id: vId,
          trainNumber,
          headsign,
          isInbound,
          isViaFairmount,
          speedMph,
          status,
          currentSeq,
          depTime,
          statusText,
          targetStation,
          previousStation,
          nextStationName,
          nextEta,
          currentPos: { x: targetCoords.x, y: targetCoords.y },
          targetPos: { x: targetCoords.x, y: targetCoords.y },
          angle: targetCoords.angle,
          lastUpdated: now,
        });
      } else {
        const existing = trackedTrains.get(vId);
        existing.trainNumber = trainNumber;
        existing.headsign = headsign;
        existing.isInbound = isInbound;
        existing.isViaFairmount = isViaFairmount;
        existing.speedMph = speedMph;
        existing.status = status;
        existing.currentSeq = currentSeq;
        existing.depTime = depTime;
        existing.statusText = statusText;
        existing.targetStation = targetStation;
        existing.previousStation = previousStation;
        existing.nextStationName = nextStationName;
        existing.nextEta = nextEta;
        existing.targetPos = { x: targetCoords.x, y: targetCoords.y };
        existing.angle = targetCoords.angle;
        existing.lastUpdated = now;
      }
    }

    // Remove trains that are no longer active
    for (const [id] of trackedTrains) {
      if (!activeIds.has(id)) {
        trackedTrains.delete(id);
      }
    }

    renderTrackerUI();
  }

  // ===========================================================================
  // Kinematic Real-Time Animation Loop (60 FPS)
  // ===========================================================================

  function startAnimationLoop() {
    if (animFrameId) return;

    function step() {
      if (!isModalOpen) return;

      // Smoothly interpolate currentPos towards targetPos for all trains
      let needsRerender = false;
      for (const [, train] of trackedTrains) {
        const dx = train.targetPos.x - train.currentPos.x;
        const dy = train.targetPos.y - train.currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.4) {
          // Smooth glide factor (0.05 per frame for natural train glide)
          train.currentPos.x += dx * 0.05;
          train.currentPos.y += dy * 0.05;
          needsRerender = true;
        } else {
          train.currentPos.x = train.targetPos.x;
          train.currentPos.y = train.targetPos.y;
        }
      }

      if (needsRerender) {
        updateTrainPositionsOnSvg();
      }

      // Update next-stop countdown timers in active badges every frame
      updateActiveCountdowns();

      animFrameId = requestAnimationFrame(step);
    }

    animFrameId = requestAnimationFrame(step);
  }

  function stopAnimationLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // ===========================================================================
  // SVG & UI Rendering
  // ===========================================================================

  function renderTrackerUI() {
    const statusBanner = document.getElementById("tracker-status-banner");
    const countElem = document.getElementById("active-trains-count");
    const gridElem = document.getElementById("active-trains-grid");

    const trainCount = trackedTrains.size;
    if (countElem) {
      countElem.textContent = `${trainCount} Active Train${trainCount === 1 ? "" : "s"}`;
    }

    if (trainCount === 0) {
      // Off-peak empty state: Show full map + status banner with upcoming scheduled departures
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.innerHTML = `
          <div class="off-peak-alert">
            <span class="off-peak-icon" aria-hidden="true">🌙</span>
            <div class="off-peak-content">
              <strong>No active trains currently on the line.</strong>
              <div class="off-peak-sub" id="off-peak-next-departures">Checking upcoming schedule from Dedham Corporate Center...</div>
            </div>
          </div>
        `;
      }
      loadOffPeakSchedule();
    } else {
      if (statusBanner) statusBanner.style.display = "none";
    }

    // Dynamic Fairmount Route Layer highlight toggle:
    // Illuminate track when at least one active Franklin train is using the Fairmount route
    const fairmountLayer = document.getElementById("fairmount-route-layer");
    if (fairmountLayer) {
      const hasFairmountTrain = Array.from(trackedTrains.values()).some(t => t.isViaFairmount);
      if (hasFairmountTrain) {
        fairmountLayer.classList.add("is-active");
      } else {
        fairmountLayer.classList.remove("is-active");
      }
    }

    renderTrainMarkersOnSvg();
    renderBottomTrainCards(gridElem);
  }

  // Fetches upcoming scheduled departures when no active vehicles are found
  async function loadOffPeakSchedule() {
    const container = document.getElementById("off-peak-next-departures");
    if (!container) return;

    try {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const minTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const sched = await fetchJson(`${BASE_URL}/schedules`, {
        "filter[stop]": DEDHAM_STOP_ID,
        "filter[route]": ROUTE_ID,
        "filter[min_time]": minTimeStr,
        "include": "trip,route",
        "sort": "departure_time",
        "page[limit]": "6",
        "api_key": API_KEY,
      });

      const tripsMap = new Map((sched.included || []).filter(x => x.type === "trip").map(t => [t.id, t]));
      const upcoming = (sched.data || [])
        .filter(item => {
          const tStr = item.attributes?.departure_time;
          if (!tStr || new Date(normalizeIsoTime(tStr)) <= now) return false;
          const trip = tripsMap.get(item.relationships?.trip?.data?.id);
          const tripRouteId = trip?.relationships?.route?.data?.id;
          if (tripRouteId && tripRouteId !== ROUTE_ID) return false;
          const headsign = (trip?.attributes?.headsign || "").toLowerCase().trim();
          return ALLOWED_HEADSIGNS.some(h => headsign.includes(h));
        })
        .slice(0, 3);

      if (upcoming.length > 0) {
        const itemsHtml = upcoming.map(item => {
          const dep = new Date(normalizeIsoTime(item.attributes.departure_time));
          const dir = item.attributes.direction_id === 1 ? "Inbound to South Station" : "Outbound";
          const trip = tripsMap.get(item.relationships?.trip?.data?.id);
          const headsign = trip?.attributes?.headsign || dir;
          return `<span class="sched-pill"><strong>${formatTime(dep)}</strong>: ${headsign}</span>`;
        }).join(" ");

        container.innerHTML = `Next upcoming departures: ${itemsHtml}`;
      } else {
        container.textContent = "No more scheduled departures for today. Service resumes tomorrow morning.";
      }
    } catch (e) {
      container.textContent = "Check timetable for tomorrow's scheduled departure times.";
    }
  }

  // Renders the train markers into the SVG overlay layer
  function renderTrainMarkersOnSvg() {
    let layer = document.getElementById("trains-svg-layer");
    if (!layer) {
      const svg = document.getElementById("schematic-track-svg");
      if (!svg) return;
      layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "trains-svg-layer");
      svg.appendChild(layer);
    }

    // Build or update markers
    layer.innerHTML = "";

    for (const [id, train] of trackedTrains) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `train-marker-group ${train.isInbound ? "inbound-train" : "outbound-train"} ${selectedTrainId === id ? "selected" : ""}`);
      g.setAttribute("id", `train-marker-${id}`);
      g.setAttribute("transform", `translate(${train.currentPos.x}, ${train.currentPos.y})`);
      g.style.cursor = "pointer";

      // Pulsing glow ring
      const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulseCircle.setAttribute("r", "16");
      pulseCircle.setAttribute("class", "train-pulse-ring");
      g.appendChild(pulseCircle);

      // Main train circle
      const mainCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      mainCircle.setAttribute("r", "11");
      mainCircle.setAttribute("class", "train-main-circle");
      g.appendChild(mainCircle);

      // Arrow indicator inside circle
      const arrowText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      arrowText.setAttribute("text-anchor", "middle");
      arrowText.setAttribute("dy", "4");
      arrowText.setAttribute("class", "train-arrow-icon");
      arrowText.textContent = train.isInbound ? "←" : "→";
      g.appendChild(arrowText);

      // Hover & click handlers for train marker
      g.addEventListener("mouseenter", function () {
        hoveredTrainId = id;
        updateTrainHoverSelection();
      });
      g.addEventListener("mouseleave", function () {
        if (hoveredTrainId === id) hoveredTrainId = null;
        updateTrainHoverSelection();
      });
      g.addEventListener("click", function (e) {
        e.stopPropagation();
        selectTrain(id);
      });

      layer.appendChild(g);
    }

    // Update floating HTML badges above SVG markers
    renderFloatingBadges();
  }

  // Quickly moves the SVG markers without recreating DOM nodes
  function updateTrainPositionsOnSvg() {
    for (const [id, train] of trackedTrains) {
      const g = document.getElementById(`train-marker-${id}`);
      if (g) {
        g.setAttribute("transform", `translate(${train.currentPos.x}, ${train.currentPos.y})`);
      }
      const badge = document.getElementById(`floating-badge-${id}`);
      if (badge) {
        positionFloatingBadge(badge, train.currentPos.x, train.currentPos.y);
      }
    }
  }

  // Positions floating HTML badge relative to SVG viewBox coordinates
  function positionFloatingBadge(badge, svgX, svgY) {
    const svg = document.getElementById("schematic-track-svg");
    const container = document.getElementById("track-map-container");
    if (!svg || !container) return;

    try {
      const pt = svg.createSVGPoint();
      pt.x = svgX;
      pt.y = svgY;
      const screenPt = pt.matrixTransform(svg.getScreenCTM());
      const containerRect = container.getBoundingClientRect();

      const pixelX = screenPt.x - containerRect.left;
      const pixelY = screenPt.y - containerRect.top - 20; // placed directly above marker

      badge.style.left = `${pixelX}px`;
      badge.style.top = `${pixelY}px`;
    } catch (e) {
      const rect = svg.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const vb = svg.viewBox ? svg.viewBox.baseVal : null;
      const minX = vb ? vb.x : -30;
      const width = vb ? vb.width : 1420;
      const minY = vb ? vb.y : 20;
      const height = vb ? vb.height : 340;
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      const pixelX = (rect.left - containerRect.left) + ((svgX - minX) * scaleX);
      const pixelY = (rect.top - containerRect.top) + ((svgY - minY) * scaleY) - 20;
      badge.style.left = `${pixelX}px`;
      badge.style.top = `${pixelY}px`;
    }
  }

  // Renders floating ETA badges hovering above each train
  function renderFloatingBadges() {
    let container = document.getElementById("floating-badges-container");
    if (!container) return;
    container.innerHTML = "";

    for (const [id, train] of trackedTrains) {
      const badge = document.createElement("div");
      const isVisible = (selectedTrainId === id || hoveredTrainId === id);
      badge.className = `floating-train-badge ${train.isInbound ? "badge-inbound" : "badge-outbound"} ${isVisible ? "visible" : ""} ${selectedTrainId === id ? "selected" : ""}`;
      badge.id = `floating-badge-${id}`;

      const etaStr = train.nextEta ? formatCountdown(train.nextEta) : "In Transit";
      badge.innerHTML = `
        <div class="badge-tooltip-header">
          <span class="badge-tooltip-dir ${train.isInbound ? "badge-in" : "badge-out"}">${train.isInbound ? "INBOUND" : "OUTBOUND"}</span>
          <span class="badge-tooltip-no">Train #${train.trainNumber}</span>
          ${train.statusText ? `<span class="badge-tooltip-speed">${train.statusText}</span>` : (train.speedMph ? `<span class="badge-tooltip-speed">${train.speedMph} mph</span>` : "")}
        </div>
        <div class="badge-tooltip-dest">To: <strong>${train.headsign}</strong>${train.isViaFairmount ? `<span class="badge-fairmount-tag">FAIRMOUNT</span>` : ""}</div>
        <div class="badge-tooltip-next" id="badge-eta-${id}">Next: <strong>${train.nextStationName}</strong> (${etaStr})</div>
      `;

      badge.addEventListener("mouseenter", function () {
        hoveredTrainId = id;
        updateTrainHoverSelection();
      });

      badge.addEventListener("mouseleave", function () {
        if (hoveredTrainId === id) hoveredTrainId = null;
        updateTrainHoverSelection();
      });

      badge.addEventListener("click", function (e) {
        e.stopPropagation();
        selectTrain(id);
      });

      container.appendChild(badge);
      positionFloatingBadge(badge, train.currentPos.x, train.currentPos.y);
    }
  }

  // Updates live arrival countdown text every animation frame
  function updateActiveCountdowns() {
    const now = Date.now();
    for (const [id, train] of trackedTrains) {
      if (train.status === "STOPPED_AT" && train.currentSeq === 0 && train.depTime) {
        const minsToDep = Math.max(0, Math.round((train.depTime - now) / 60000));
        train.statusText = minsToDep <= 0 ? "Boarding (departs now)" : `Boarding (departs in ${minsToDep}m)`;
        const badgeSpeed = document.querySelector(`#floating-badge-${id} .badge-tooltip-speed`);
        if (badgeSpeed) badgeSpeed.textContent = train.statusText;
        const cardSpeed = document.querySelector(`#active-card-${id} .card-speed`);
        if (cardSpeed) cardSpeed.textContent = train.statusText;
      }
      if (train.nextEta) {
        const etaText = formatCountdown(train.nextEta);
        const badgeEta = document.getElementById(`badge-eta-${id}`);
        if (badgeEta) {
          badgeEta.innerHTML = `Next: <strong>${train.nextStationName}</strong> (${etaText})`;
        }
        const cardEta = document.getElementById(`card-eta-${id}`);
        if (cardEta) {
          cardEta.textContent = `${train.nextStationName} (${etaText})`;
        }
      }
    }
  }

  // Renders the cards in the bottom shelf
  function renderBottomTrainCards(gridElem) {
    if (!gridElem) return;
    gridElem.innerHTML = "";

    if (trackedTrains.size === 0) {
      gridElem.innerHTML = `<div class="no-active-trains-card">No commuter rail trains currently running on this route.</div>`;
      return;
    }

    for (const [id, train] of trackedTrains) {
      const card = document.createElement("div");
      const isSelected = (selectedTrainId === id);
      const isHovered = (hoveredTrainId === id);
      card.className = `active-train-card ${train.isInbound ? "card-inbound" : "card-outbound"} ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`;
      card.id = `active-card-${id}`;

      const directionBadge = train.isInbound ? "INBOUND" : "OUTBOUND";
      const etaStr = train.nextEta ? formatCountdown(train.nextEta) : "En Route";

      card.innerHTML = `
        <div class="card-header-row">
          <div class="card-header-left">
            <span class="card-dir-badge">${directionBadge}</span>
            <span class="card-train-number">Train ${train.trainNumber}</span>
          </div>
          <span class="card-speed">${train.statusText || (train.speedMph + " MPH")}</span>
        </div>
        <div class="card-destination"><strong>Terminus:</strong> ${train.headsign}${train.isViaFairmount ? `<span class="badge-fairmount-tag">via Fairmount</span>` : ""}</div>
        <div class="card-next-stop"><strong>Next Stop:</strong> <span id="card-eta-${id}">${train.nextStationName} (${etaStr})</span></div>
      `;

      card.addEventListener("mouseenter", function () {
        hoveredTrainId = id;
        updateTrainHoverSelection();
      });

      card.addEventListener("mouseleave", function () {
        if (hoveredTrainId === id) hoveredTrainId = null;
        updateTrainHoverSelection();
      });

      card.addEventListener("click", function () {
        selectTrain(id);
      });

      gridElem.appendChild(card);
    }
  }

  // Synchronizes visual hover and selection state across SVG markers, tooltips, and shelf cards
  function updateTrainHoverSelection() {
    for (const [id] of trackedTrains) {
      const isHovered = (hoveredTrainId === id);
      const isSelected = (selectedTrainId === id);
      const isVisible = isHovered || isSelected;

      const badge = document.getElementById(`floating-badge-${id}`);
      if (badge) {
        badge.classList.toggle("visible", isVisible);
        badge.classList.toggle("selected", isSelected);
      }

      const marker = document.getElementById(`train-marker-${id}`);
      if (marker) {
        marker.classList.toggle("hovered", isHovered);
        marker.classList.toggle("selected", isSelected);
      }

      const card = document.getElementById(`active-card-${id}`);
      if (card) {
        card.classList.toggle("hovered", isHovered);
        card.classList.toggle("selected", isSelected);
      }
    }
  }

  // Selects and highlights a train on both the map and the shelf
  function selectTrain(trainId) {
    selectedTrainId = selectedTrainId === trainId ? null : trainId;
    updateTrainHoverSelection();

    if (selectedTrainId) {
      const card = document.getElementById(`active-card-${selectedTrainId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }

  // ===========================================================================
  // Station Node Interactivity & Popovers
  // ===========================================================================

  // Opens a popover when clicking a station node with upcoming arrival/departure times
  async function showStationPopover(station, event) {
    selectedStationId = station.id;
    const popover = document.getElementById("station-detail-popover");
    if (!popover) return;

    popover.style.display = "block";
    popover.innerHTML = `
      <div class="popover-header">
        <div class="popover-title">${station.name}</div>
        <button type="button" class="popover-close-btn" id="close-station-popover" aria-label="Close station info">✕</button>
      </div>
      <div class="popover-body" id="popover-station-body">
        <div class="popover-loading">Loading upcoming train times...</div>
      </div>
    `;

    document.getElementById("close-station-popover")?.addEventListener("click", function (e) {
      e.stopPropagation();
      closeStationPopover();
    });

    try {
      let filterStopId = station.id;
      if (filterStopId === "place-FB-0128") filterStopId = "place-FB-0125";
      if (filterStopId === "place-FB-0190") filterStopId = "place-FB-0191";

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      const minTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Query BOTH /predictions (for live active trains) and /schedules (with filter[min_time])
      const [predsResp, schedsResp] = await Promise.all([
        fetchJson(`${BASE_URL}/predictions`, {
          "filter[stop]": filterStopId,
          "filter[route]": TRACKED_ROUTES,
          "include": "trip,vehicle",
          "sort": "departure_time",
          "api_key": API_KEY,
        }).catch(() => ({ data: [], included: [] })),
        fetchJson(`${BASE_URL}/schedules`, {
          "filter[stop]": filterStopId,
          "filter[route]": TRACKED_ROUTES,
          "filter[min_time]": minTimeStr,
          "include": "trip,route",
          "sort": "departure_time",
          "page[limit]": "8",
          "api_key": API_KEY,
        }).catch(() => ({ data: [], included: [] })),
      ]);

      if (selectedStationId !== station.id) return; // User clicked another station while fetching

      const tripsMap = new Map(
        (predsResp.included || []).concat(schedsResp.included || [])
          .filter(x => x.type === "trip")
          .map(t => [t.id, t])
      );
      const vehiclesMap = new Map(
        (predsResp.included || [])
          .filter(x => x.type === "vehicle")
          .map(v => [v.id, v])
      );

      const merged = [];
      const seenTripIds = new Set();

      // 1. Process Real-Time Predictions first (active trains)
      for (const pred of predsResp.data || []) {
        const timeStr = pred.attributes?.departure_time || pred.attributes?.arrival_time;
        if (!timeStr) continue;
        const timeDate = new Date(normalizeIsoTime(timeStr));
        // Allow trains arriving up to 2 mins ago (e.g. currently boarding/at station)
        if (timeDate < new Date(now.getTime() - 2 * 60 * 1000)) continue;

        const tripId = pred.relationships?.trip?.data?.id;
        const trip = tripsMap.get(tripId);
        const tripRouteId = trip?.relationships?.route?.data?.id;
        if (tripRouteId && !ALLOWED_ROUTES.has(tripRouteId)) continue;

        const headsign = (trip?.attributes?.headsign || "").toLowerCase().trim();
        if (headsign && !ALLOWED_HEADSIGNS.some(h => headsign.includes(h))) continue;

        const vehicleId = pred.relationships?.vehicle?.data?.id;
        const vehicle = vehiclesMap.get(vehicleId);
        const trainNo = trip?.attributes?.name || vehicle?.attributes?.label || "Train";

        seenTripIds.add(tripId);
        merged.push({
          tripId,
          time: timeDate,
          isInbound: pred.attributes?.direction_id === 1,
          headsign: trip?.attributes?.headsign || (pred.attributes?.direction_id === 1 ? "South Station" : "Outbound"),
          trainNo,
          isRealtime: true,
          status: pred.attributes?.status || null
        });
      }

      // 2. Process Scheduled departures (for upcoming trips not already in predictions)
      for (const sched of schedsResp.data || []) {
        const tripId = sched.relationships?.trip?.data?.id;
        if (seenTripIds.has(tripId)) continue;

        const trip = tripsMap.get(tripId);
        const tripRouteId = trip?.relationships?.route?.data?.id;
        if (tripRouteId && !ALLOWED_ROUTES.has(tripRouteId)) continue;

        const timeStr = sched.attributes?.departure_time || sched.attributes?.arrival_time;
        if (!timeStr) continue;
        const timeDate = new Date(normalizeIsoTime(timeStr));
        if (timeDate <= now) continue;

        const headsign = (trip?.attributes?.headsign || "").toLowerCase().trim();
        if (headsign && !ALLOWED_HEADSIGNS.some(h => headsign.includes(h))) continue;

        const trainNo = trip?.attributes?.name || "Train";

        seenTripIds.add(tripId);
        merged.push({
          tripId,
          time: timeDate,
          isInbound: sched.attributes?.direction_id === 1,
          headsign: trip?.attributes?.headsign || (sched.attributes?.direction_id === 1 ? "South Station" : "Outbound"),
          trainNo,
          isRealtime: false,
          status: null
        });
      }

      merged.sort((a, b) => a.time - b.time);
      const future = merged.slice(0, 5);

      const body = document.getElementById("popover-station-body");
      if (!body) return;

      if (future.length === 0) {
        body.innerHTML = `<div class="popover-empty">No upcoming train stops scheduled for today.</div>`;
        return;
      }

      const listHtml = future.map(item => {
        const timeStr = formatTime(item.time);
        const diffMins = Math.round((item.time - now) / 60000);
        let liveBadge = "";
        if (item.isRealtime) {
          const countdown = diffMins <= 0 ? "Arriving" : `${diffMins}m`;
          liveBadge = `<span class="popover-live-tag">● LIVE ${countdown}</span>`;
        }

        return `
          <div class="popover-time-row">
            <span class="popover-badge ${item.isInbound ? "badge-in" : "badge-out"}">${item.isInbound ? "IN" : "OUT"}</span>
            <div class="popover-train-info">
              <span class="popover-train-no">${item.trainNo} (${item.headsign})</span>
              ${liveBadge}
            </div>
            <span class="popover-dep-time">${timeStr}</span>
          </div>
        `;
      }).join("");

      body.innerHTML = `
        <div class="popover-times-label">Upcoming Departures:</div>
        <div class="popover-times-list">${listHtml}</div>
      `;
    } catch (e) {
      const body = document.getElementById("popover-station-body");
      if (body) body.innerHTML = `<div class="popover-error">Could not fetch station departures.</div>`;
    }
  }

  function closeStationPopover() {
    selectedStationId = null;
    const popover = document.getElementById("station-detail-popover");
    if (popover) popover.style.display = "none";
  }

  // ===========================================================================
  // Modal Lifecycle & Polling Controller
  // ===========================================================================

  function openTrackerModal() {
    const overlay = document.getElementById("train-tracker-modal-overlay");
    if (!overlay) return;

    isModalOpen = true;
    overlay.classList.add("modal-open");
    overlay.setAttribute("aria-hidden", "false");

    // Reset countdown counter
    secondsUntilRefresh = 10;
    const counterElem = document.getElementById("tracker-refresh-counter");
    if (counterElem) counterElem.textContent = "10s";

    // Immediate initial fetch
    fetchLiveTrackerData();

    // Start 10-second polling
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(function () {
      secondsUntilRefresh = 10;
      fetchLiveTrackerData();
    }, POLL_INTERVAL_MS);

    // 1-second interval for countdown counter display
    if (counterIntervalId) clearInterval(counterIntervalId);
    counterIntervalId = setInterval(function () {
      secondsUntilRefresh = Math.max(0, secondsUntilRefresh - 1);
      const c = document.getElementById("tracker-refresh-counter");
      if (c) c.textContent = `${secondsUntilRefresh}s`;
    }, 1000);

    // Start smooth 60 FPS animation loop
    startAnimationLoop();
  }

  function closeTrackerModal() {
    const overlay = document.getElementById("train-tracker-modal-overlay");
    if (!overlay) return;

    isModalOpen = false;
    overlay.classList.remove("modal-open");
    overlay.setAttribute("aria-hidden", "true");

    const helpDialog = document.getElementById("tracker-help-dialog");
    if (helpDialog) helpDialog.style.display = "none";

    // Pause all timers & animation to avoid background battery/network drain
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
    if (counterIntervalId) {
      clearInterval(counterIntervalId);
      counterIntervalId = null;
    }
    stopAnimationLoop();
    closeStationPopover();
    selectedTrainId = null;
  }

  // Attach event listeners to station SVG nodes
  function initStationEventListeners() {
    STATIONS.forEach(station => {
      const nodeElem = document.getElementById(`station-node-${station.id}`);
      if (nodeElem) {
        nodeElem.style.cursor = "pointer";
        nodeElem.addEventListener("click", function (e) {
          e.stopPropagation();
          showStationPopover(station, e);
        });
      }
    });

    // Close popover when clicking anywhere else on track canvas
    const container = document.getElementById("track-map-container");
    if (container) {
      container.addEventListener("click", function () {
        closeStationPopover();
        selectTrain(null);
      });
    }

    // Recalculate floating badge positions on window resize
    window.addEventListener("resize", function () {
      if (isModalOpen) {
        updateTrainPositionsOnSvg();
      }
    });
  }

  // ===========================================================================
  // Initialization & Event Binding
  // ===========================================================================

  function initLiveTrainTracker() {
    const inboundRow = document.getElementById("transitInboundRow");
    const outboundRow = document.getElementById("transitOutboundRow");
    const closeBtn = document.getElementById("close-train-tracker-modal");
    const overlay = document.getElementById("train-tracker-modal-overlay");

    // Help Guide dialog controls
    const helpBtn = document.getElementById("train-tracker-help-btn");
    const helpCloseBtn = document.getElementById("close-tracker-help-btn");
    const helpDialog = document.getElementById("tracker-help-dialog");

    function openHelpDialog() {
      if (helpDialog) helpDialog.style.display = "flex";
    }

    function closeHelpDialog() {
      if (helpDialog) helpDialog.style.display = "none";
    }

    if (helpBtn) helpBtn.addEventListener("click", openHelpDialog);
    if (helpCloseBtn) helpCloseBtn.addEventListener("click", closeHelpDialog);
    if (helpDialog) {
      helpDialog.addEventListener("click", function (e) {
        if (e.target === helpDialog) closeHelpDialog();
      });
    }

    // Open modal when clicking either transit row on the main clock card
    if (inboundRow) {
      inboundRow.addEventListener("click", openTrackerModal);
      inboundRow.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTrackerModal();
        }
      });
    }

    if (outboundRow) {
      outboundRow.addEventListener("click", openTrackerModal);
      outboundRow.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTrackerModal();
        }
      });
    }

    // Modal close controls
    if (closeBtn) closeBtn.addEventListener("click", closeTrackerModal);

    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeTrackerModal();
      });
    }

    // Escape key listener
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (helpDialog && helpDialog.style.display === "flex") {
          closeHelpDialog();
          return;
        }
        if (isModalOpen) {
          closeTrackerModal();
        }
      }
    });

    initStationEventListeners();
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveTrainTracker);
  } else {
    initLiveTrainTracker();
  }
})();
