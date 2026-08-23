// =============================================================================
// MBTA Next Inbound Train Display
// DETAILS:
//  Fetches and displays the next inbound train from Dedham Corporate Center
//  to South Station using the MBTA v3 API. Updates every 60 seconds.
// =============================================================================

(function () {
  const API_KEY = "72fa8ae012994df7b7f671c2c52c9ab2";
  const BASE_URL = "https://api-v3.mbta.com";
  const DEDHAM_STOP_ID = "place-FB-0118";
  const SOUTH_STATION_STOP_ID = "place-sstat";
  const INBOUND_DIRECTION_ID = 1;

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

    for (const item of data.data || []) {
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

  // Optimized: Queries only the specific trip at South Station instead of the entire terminal
  async function getArrivalTimeAtStation(tripId, stopId) {
    try {
      // 1. Try real-time predictions for this trip at South Station
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

      // 2. Fallback to schedule for this trip at South Station
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

  // Main function to fetch and display the next inbound train
  async function showNextInboundTrain() {
    const departureElem = document.getElementById("departure-time");
    const arrivalElem = document.getElementById("arrival-time");
    const routeElem = document.getElementById("train-route");

    if (firstLoad) {
      if (departureElem) departureElem.textContent = "Loading...";
      if (arrivalElem) arrivalElem.textContent = "Loading...";
      if (routeElem) routeElem.textContent = "Loading...";
    }

    try {
      // Step 1: Query predictions for Dedham
      let response = await getPredictions(DEDHAM_STOP_ID);
      let future = filterFutureTrains(response, INBOUND_DIRECTION_ID);

      // Step 2: Fallback to scheduled trains if no predictions found
      if (!future.length) {
        response = await getSchedules(DEDHAM_STOP_ID);
        future = filterFutureTrains(response, INBOUND_DIRECTION_ID);
      }

      // Step 3: Handle no trains remaining today
      if (!future.length) {
        if (departureElem) departureElem.textContent = "-";
        if (arrivalElem) arrivalElem.innerHTML = '<span class="error">No inbound trains</span>';
        if (routeElem) routeElem.textContent = "-";
        firstLoad = false;
        return;
      }

      // Index included trips and routes for fast lookup
      const tripsMap = new Map(
        (response.included || []).filter(x => x.type === "trip").map(t => [t.id, t])
      );
      const routesMap = new Map(
        (response.included || []).filter(x => x.type === "route").map(r => [r.id, r])
      );

      // Step 4: Extract info for soonest train
      const next = future[0].item;
      const depTime = future[0].time;

      let tripId = null;
      if (next.relationships && next.relationships.trip && next.relationships.trip.data) {
        tripId = next.relationships.trip.data.id;
      } else if (next.attributes && next.attributes.trip_id) {
        tripId = next.attributes.trip_id;
      }

      let routeId = null;
      if (next.relationships && next.relationships.route && next.relationships.route.data) {
        routeId = next.relationships.route.data.id;
      } else if (next.attributes && next.attributes.route_id) {
        routeId = next.attributes.route_id;
      }

      const tripObj = tripId ? tripsMap.get(tripId) : null;
      const routeObj = routeId ? routesMap.get(routeId) : null;

      // Extract real train number (e.g. "5768")
      const trainNumber = getTrainNumber(tripObj, tripId, next.id);

      // Format route label (e.g. "Franklin" or "Fairmount")
      let routeLabel = "";
      if (routeObj && routeObj.attributes && routeObj.attributes.long_name) {
        routeLabel = routeObj.attributes.long_name.replace(" Line", "");
      } else if (routeId) {
        routeLabel = routeId.replace("CR-", "");
      }

      const displayTrainInfo = routeLabel ? `${trainNumber} (${routeLabel})` : trainNumber;

      // Step 5: Query estimated arrival at South Station
      let arrTime = null;
      if (tripId) {
        arrTime = await getArrivalTimeAtStation(tripId, SOUTH_STATION_STOP_ID);
      }

      // Step 6: Update DOM
      const depStr = formatTime(depTime);
      if (departureElem) departureElem.textContent = depStr;

      if (arrivalElem) {
        if (arrTime) {
          arrivalElem.textContent = formatTime(arrTime);
        } else {
          arrivalElem.textContent = "N/A";
        }
      }

      if (routeElem) routeElem.textContent = displayTrainInfo;
      firstLoad = false;
    } catch (e) {
      console.error("Error updating MBTA train status:", e);
      if (departureElem) departureElem.textContent = "-";
      if (arrivalElem) arrivalElem.innerHTML = `<span class="error">Data Unavailable</span>`;
      if (routeElem) routeElem.textContent = "-";
      firstLoad = false;
    }
  }

  // Initialize on DOM ready, then refresh every 60 seconds
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      showNextInboundTrain();
      setInterval(showNextInboundTrain, 60000);
    });
  } else {
    showNextInboundTrain();
    setInterval(showNextInboundTrain, 60000);
  }
})();

