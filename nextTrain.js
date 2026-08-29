// =============================================================================
// MBTA Next Inbound & Outbound Train Display
// DETAILS:
//  Fetches and displays the next inbound train (Dedham Corporate Center -> South Station)
//  and next outbound train (Dedham Corporate Center -> Forge Park/495) using the
//  MBTA v3 API. Updates automatically every 60 seconds.
// =============================================================================

(function () {
  const API_KEY = "72fa8ae012994df7b7f671c2c52c9ab2";
  const BASE_URL = "https://api-v3.mbta.com";
  const DEDHAM_STOP_ID = "place-FB-0118";
  const SOUTH_STATION_STOP_ID = "place-sstat";
  const FORGE_PARK_STOP_ID = "place-FB-0303";
  const INBOUND_DIRECTION_ID = 1;
  const OUTBOUND_DIRECTION_ID = 0;

  let firstLoad = true;

  // Formats a Date object into a 12-hour string (e.g., "09:05 am")
  function formatTime(dt) {
    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
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

  // Extracts train number from trip attributes or falls back to parsing the trip ID
  function getTrainNumber(trip, tripId, predictionId) {
    // 1. Direct official MBTA public train number from trip attributes
    if (trip && trip.attributes && trip.attributes.name) {
      return trip.attributes.name;
    }

    // 2. Fallback: Parse the last number segment from the trip ID (e.g., "SouthBase-830450-5768" -> "5768")
    const idToParse = tripId || predictionId || "";
    const match = idToParse.match(/-(\d{3,5})(?:-|$)/);
    if (match) {
      // Find all digit segments and take the train number (last 3-5 digit segment in trip ID)
      const allMatches = [...idToParse.matchAll(/-(\d{3,5})/g)];
      if (allMatches.length > 0) {
        return allMatches[allMatches.length - 1][1];
      }
      return match[1];
    }

    return "Commuter Rail";
  }

  // Helper to fetch JSON from the MBTA API with query parameters
  async function fetchJson(url, params) {
    const usp = new URLSearchParams(params);
    const resp = await fetch(`${url}?${usp.toString()}`);
    if (!resp.ok) throw new Error(`MBTA API error (${resp.status})`);
    return resp.json();
  }

  // Fetches real-time train predictions for a given stop (including trip & route details)
  async function getPredictions(stopId) {
    return fetchJson(`${BASE_URL}/predictions`, {
      "filter[stop]": stopId,
      "include": "trip,route",
      "sort": "departure_time",
      "api_key": API_KEY,
    });
  }

  // Fetches scheduled train times for a given stop (including trip & route details)
  async function getSchedules(stopId) {
    return fetchJson(`${BASE_URL}/schedules`, {
      "filter[stop]": stopId,
      "include": "trip,route",
      "sort": "departure_time",
      "api_key": API_KEY,
    });
  }

  // Filters trains list to future trains in the requested direction
  function filterFutureTrains(data, directionId) {
    const now = new Date();
    const future = [];

    for (const item of (data && data.data) || []) {
      const attrs = item.attributes;
      const dep = attrs.departure_time;
      const dir = attrs.direction_id;

      if (dep && dir === directionId) {
        const depTime = new Date(normalizeIsoTime(dep));
        if (depTime > now) {
          future.push({ time: depTime, item });
        }
      }
    }

    future.sort((a, b) => a.time - b.time);
    return future;
  }

  // Queries arrival time for a specific trip at a destination station
  async function getArrivalTimeAtStation(tripId, stopId) {
    try {
      // 1. Try real-time predictions for this trip at destination station
      const pred = await fetchJson(`${BASE_URL}/predictions`, {
        "filter[trip]": tripId,
        "filter[stop]": stopId,
        "api_key": API_KEY,
      });

      if (pred.data && pred.data.length) {
        for (const item of pred.data) {
          if (item.attributes && item.attributes.arrival_time) {
            return new Date(normalizeIsoTime(item.attributes.arrival_time));
          }
        }
      }

      // 2. Fallback to schedule for this trip at destination station
      const sched = await fetchJson(`${BASE_URL}/schedules`, {
        "filter[trip]": tripId,
        "filter[stop]": stopId,
        "api_key": API_KEY,
      });

      if (sched.data && sched.data.length) {
        for (const item of sched.data) {
          if (item.attributes && item.attributes.arrival_time) {
            return new Date(normalizeIsoTime(item.attributes.arrival_time));
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch arrival time for trip:", tripId, e);
    }
    return null;
  }

  // Processes and displays train info for a specific direction and destination
  async function processTrainDirection(
    predictionsData,
    schedulesData,
    directionId,
    destStopId,
    elements,
    directionLabel
  ) {
    const { departureElem, routeElem, arrivalElem } = elements;

    try {
      // Step 1: Filter predictions for Dedham in this direction
      let future = filterFutureTrains(predictionsData, directionId);
      let dataSource = predictionsData;

      // Step 2: Fallback to scheduled trains if no future predictions found
      if (!future.length) {
        if (!schedulesData) {
          try {
            schedulesData = await getSchedules(DEDHAM_STOP_ID);
          } catch (e) {
            console.warn("Could not fetch schedules for fallback:", e);
            schedulesData = { data: [], included: [] };
          }
        }
        dataSource = schedulesData;
        future = filterFutureTrains(schedulesData, directionId);
      }

      // Step 3: Handle no trains remaining today
      if (!future.length) {
        if (departureElem) departureElem.textContent = "-";
        if (arrivalElem) arrivalElem.innerHTML = `<span class="error">No ${directionLabel} trains</span>`;
        if (routeElem) routeElem.textContent = "-";
        return;
      }

      // Index included trips and routes for fast lookup
      const tripsMap = new Map(
        (dataSource.included || []).filter(x => x.type === "trip").map(t => [t.id, t])
      );
      const routesMap = new Map(
        (dataSource.included || []).filter(x => x.type === "route").map(r => [r.id, r])
      );

      // Step 4: Find the first future train that serves the destination station
      let selectedTrain = null;
      let selectedDepTime = null;
      let selectedTripObj = null;
      let selectedRouteObj = null;
      let selectedTripId = null;
      let selectedRouteId = null;
      let selectedArrTime = null;

      for (const entry of future) {
        const item = entry.item;
        const depTime = entry.time;

        let tripId = null;
        if (item.relationships && item.relationships.trip && item.relationships.trip.data) {
          tripId = item.relationships.trip.data.id;
        } else if (item.attributes && item.attributes.trip_id) {
          tripId = item.attributes.trip_id;
        }

        let routeId = null;
        if (item.relationships && item.relationships.route && item.relationships.route.data) {
          routeId = item.relationships.route.data.id;
        } else if (item.attributes && item.attributes.route_id) {
          routeId = item.attributes.route_id;
        }

        let arrTime = null;
        if (tripId && destStopId) {
          arrTime = await getArrivalTimeAtStation(tripId, destStopId);
          // If destination stop was specified and this trip does not stop there, try next train
          if (!arrTime && future.length > 1) {
            continue;
          }
        }

        selectedTrain = item;
        selectedDepTime = depTime;
        selectedTripId = tripId;
        selectedRouteId = routeId;
        selectedTripObj = tripId ? tripsMap.get(tripId) : null;
        selectedRouteObj = routeId ? routesMap.get(routeId) : null;
        selectedArrTime = arrTime;
        break;
      }

      if (!selectedTrain) {
        const first = future[0];
        selectedTrain = first.item;
        selectedDepTime = first.time;
        selectedTripId = selectedTrain.relationships?.trip?.data?.id || selectedTrain.attributes?.trip_id;
        selectedRouteId = selectedTrain.relationships?.route?.data?.id || selectedTrain.attributes?.route_id;
        selectedTripObj = selectedTripId ? tripsMap.get(selectedTripId) : null;
        selectedRouteObj = selectedRouteId ? routesMap.get(selectedRouteId) : null;
      }

      // Extract real train number (e.g. "5768")
      const trainNumber = getTrainNumber(selectedTripObj, selectedTripId, selectedTrain.id);

      // Format route label (e.g. "Franklin" or "Fairmount")
      let routeLabel = "";
      if (selectedRouteObj && selectedRouteObj.attributes && selectedRouteObj.attributes.long_name) {
        routeLabel = selectedRouteObj.attributes.long_name.replace(" Line", "");
      } else if (selectedRouteId) {
        routeLabel = selectedRouteId.replace("CR-", "");
      }

      const displayTrainInfo = routeLabel ? `${trainNumber} (${routeLabel})` : trainNumber;

      // Update DOM
      const depStr = formatTime(selectedDepTime);
      if (departureElem) departureElem.textContent = depStr;

      if (arrivalElem) {
        if (selectedArrTime) {
          arrivalElem.textContent = formatTime(selectedArrTime);
        } else {
          arrivalElem.textContent = "N/A";
        }
      }

      if (routeElem) routeElem.textContent = displayTrainInfo;
    } catch (e) {
      console.error(`Error updating MBTA ${directionLabel} train status:`, e);
      if (departureElem) departureElem.textContent = "-";
      if (arrivalElem) arrivalElem.innerHTML = `<span class="error">Data Unavailable</span>`;
      if (routeElem) routeElem.textContent = "-";
    }
  }

  // Main function to fetch and display both inbound and outbound trains
  async function showNextTrains() {
    const inboundElements = {
      departureElem: document.getElementById("departure-time"),
      arrivalElem: document.getElementById("arrival-time"),
      routeElem: document.getElementById("train-route"),
    };

    const outboundElements = {
      departureElem: document.getElementById("outbound-departure-time"),
      arrivalElem: document.getElementById("outbound-arrival-time"),
      routeElem: document.getElementById("outbound-train-route"),
    };

    if (firstLoad) {
      Object.values(inboundElements).forEach(el => {
        if (el) el.textContent = "Loading...";
      });
      Object.values(outboundElements).forEach(el => {
        if (el) el.textContent = "Loading...";
      });
    }

    try {
      // Step 1: Query predictions for Dedham (includes all directions)
      let predictions = null;
      let schedules = null;

      try {
        predictions = await getPredictions(DEDHAM_STOP_ID);
      } catch (e) {
        console.warn("Could not fetch predictions from MBTA API:", e);
        predictions = { data: [], included: [] };
      }

      // Check if we need schedules fallback for either direction
      const hasInboundPred = filterFutureTrains(predictions, INBOUND_DIRECTION_ID).length > 0;
      const hasOutboundPred = filterFutureTrains(predictions, OUTBOUND_DIRECTION_ID).length > 0;

      if (!hasInboundPred || !hasOutboundPred) {
        try {
          schedules = await getSchedules(DEDHAM_STOP_ID);
        } catch (e) {
          console.warn("Could not fetch schedules from MBTA API:", e);
          schedules = { data: [], included: [] };
        }
      }

      // Step 2: Process Inbound and Outbound in parallel
      await Promise.all([
        processTrainDirection(
          predictions,
          schedules,
          INBOUND_DIRECTION_ID,
          SOUTH_STATION_STOP_ID,
          inboundElements,
          "inbound"
        ),
        processTrainDirection(
          predictions,
          schedules,
          OUTBOUND_DIRECTION_ID,
          FORGE_PARK_STOP_ID,
          outboundElements,
          "outbound"
        ),
      ]);

      firstLoad = false;
    } catch (e) {
      console.error("Error updating MBTA train status:", e);
      firstLoad = false;
    }
  }

  // Initialize on DOM ready, then refresh every 60 seconds
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      showNextTrains();
      setInterval(showNextTrains, 60000);
    });
  } else {
    showNextTrains();
    setInterval(showNextTrains, 60000);
  }
})();

