// ===============================
// MBTA Next Inbound Train Display
// ===============================
// This script fetches and displays the next inbound train from Dedham Corporate Center to South Station using the MBTA API.
// It updates the display every minute, showing departure time, arrival time, and train/route info.

// -------------------------------
// API and Stop Configuration
// -------------------------------
// MBTA API key for authentication
const API_KEY = '72fa8ae012994df7b7f671c2c52c9ab2';
// Base URL for MBTA API requests
const BASE_URL = 'https://api-v3.mbta.com';
// Stop ID for Dedham Corporate Center (origin)
const DEDHAM_STOP_ID = 'place-FB-0118';
// Stop ID for South Station (destination)
const SOUTH_STATION_STOP_ID = 'place-sstat';
// MBTA uses 1 for inbound direction (toward Boston)
const INBOUND_DIRECTION_ID = 1;

// -------------------------------
// Utility Functions
// -------------------------------

// Pads a single digit number with a leading zero (e.g., 7 -> '07')
function pad(n) {
    // If n is less than 10, add a leading zero, otherwise return n as a string
    return n < 10 ? '0' + n : n;
}

// Formats a JavaScript Date object as a 12-hour time string with am/pm (e.g., 09:05 am)
function formatTime(dt) {
    // Get the hour (0-23)
    let hours = dt.getHours();
    // Get the minutes (0-59)
    let minutes = dt.getMinutes();
    // Determine if it's am or pm
    let ampm = hours >= 12 ? 'pm' : 'am';
    // Convert 24-hour time to 12-hour time
    hours = hours % 12;
    // 0 should be shown as 12
    if (hours === 0) hours = 12;
    // Pad hours and minutes with leading zero if less than 10
    return `${pad(hours)}:${pad(minutes)} ${ampm}`;
}

// Normalizes ISO time strings to ensure compatibility with JavaScript Date
// Some ISO strings have timezone offsets like -0400 instead of -04:00
function normalizeIsoTime(str) {
    if (str && str.length > 5 && (str[str.length - 5] === '+' || str[str.length - 5] === '-') && str[str.length - 3] !== ':') {
        return str.slice(0, -2) + ':' + str.slice(-2);
    }
    return str;
}

// Attempts to extract a train number and route from a trainId and routeId string
function extractTrainNumberAndRoute(trainId, routeId) {
    // Try to match a 4-digit or any digit train number in the trainId string
    let match = trainId.match(/-(\d{4})-/);
    if (match) return routeId ? `${match[1]} ${routeId}` : match[1];
    match = trainId.match(/-(\d+)-/);
    if (match) return routeId ? `${match[1]} ${routeId}` : match[1];
    // If no match, just return the trainId
    return trainId;
}

// -------------------------------
// API Fetch Functions
// -------------------------------

// Fetches JSON data from a URL with query parameters
async function fetchJson(url, params) {
    const usp = new URLSearchParams(params); // Convert params object to query string
    const resp = await fetch(url + '?' + usp.toString()); // Fetch the data from the API
    if (!resp.ok) throw new Error('API error: ' + resp.status); // Throw error if not OK
    return resp.json(); // Parse and return JSON
}

// Gets train predictions (real-time estimates) for a stop
async function getPredictions(stopId) {
    // Call the MBTA predictions endpoint for the given stop
    return fetchJson(`${BASE_URL}/predictions`, {
        'filter[stop]': stopId, // Only predictions for this stop
        'sort': 'departure_time', // Sort by soonest departure
        'api_key': API_KEY // API key for authentication
    });
}

// Gets scheduled train times for a stop (fallback if no predictions)
async function getSchedules(stopId) {
    // Call the MBTA schedules endpoint for the given stop
    return fetchJson(`${BASE_URL}/schedules`, {
        'filter[stop]': stopId, // Only schedules for this stop
        'sort': 'departure_time', // Sort by soonest departure
        'api_key': API_KEY // API key for authentication
    });
}

// -------------------------------
// Data Processing Functions
// -------------------------------

// Filters a list of train data to only future inbound trains
function filterFutureTrains(data, directionId) {
    const now = new Date(); // Current time
    let future = [];
    // Loop through each train prediction or schedule
    for (const item of (data.data || [])) {
        const attrs = item.attributes;
        const dep = attrs.departure_time; // Departure time as a string
        const dir = attrs.direction_id;   // Direction (0 = outbound, 1 = inbound)
        // Only consider trains with a departure time in the future and correct direction
        if (dep && dir === directionId) {
            let depTime = new Date(normalizeIsoTime(dep));
            if (depTime > now) future.push({ time: depTime, item });
        }
    }
    // Sort the trains by soonest departure
    future.sort((a, b) => a.time - b.time);
    return future;
}

// Gets the arrival time at a specific stop for a given trip
// Tries predictions first, then falls back to scheduled times
async function getArrivalTimeAtStation(tripId, stopId, preferPred = true) {
    let data;
    if (preferPred) data = await getPredictions(stopId); // Try to get predictions (real-time)
    else data = await getSchedules(stopId); // Fallback to schedules
    for (const item of (data.data || [])) {
        let itemTripId = null;
        // Get the trip ID from the relationships or attributes
        if (item.relationships && item.relationships.trip && item.relationships.trip.data)
            itemTripId = item.relationships.trip.data.id;
        else if (item.attributes && item.attributes.trip_id)
            itemTripId = item.attributes.trip_id;
        // If this is the correct trip, get the arrival time
        if (itemTripId === tripId) {
            let arr = item.attributes.arrival_time;
            if (arr) {
                try {
                    return new Date(normalizeIsoTime(arr)); // Return as a Date object
                } catch { }
            }
        }
    }
    // If not found and we tried predictions, try schedules
    if (preferPred) return getArrivalTimeAtStation(tripId, stopId, false);
    // If still not found, return null
    return null;
}

// -------------------------------
// Main Display Logic
// -------------------------------

// Tracks if this is the first time loading the data
let firstLoad = true;

// Main function to display the next inbound train info on the page
async function showNextInboundTrain() {
    // Get references to the HTML elements where info will be displayed
    const departureElem = document.getElementById('departure-time');
    const arrivalElem = document.getElementById('arrival-time');
    const routeElem = document.getElementById('train-route');
    const info = document.getElementById('train-info');

    // Only show 'Loading...' on first load
    if (firstLoad) {
        if (departureElem && arrivalElem && routeElem) {
            departureElem.textContent = 'Loading...';
            arrivalElem.textContent = 'Loading...';
            routeElem.textContent = 'Loading...';
        } else if (info) {
            info.textContent = 'Loading...';
        }
    }
    try {
        // Try to get real-time predictions for Dedham
        let predictions = await getPredictions(DEDHAM_STOP_ID);
        // Filter to only future inbound trains
        let future = filterFutureTrains(predictions, INBOUND_DIRECTION_ID);
        // If no predictions, fall back to scheduled times
        if (!future.length) {
            let schedules = await getSchedules(DEDHAM_STOP_ID);
            future = filterFutureTrains(schedules, INBOUND_DIRECTION_ID);
        }
        // If still no trains, show a message
        if (!future.length) {
            if (departureElem && arrivalElem && routeElem) {
                if (firstLoad || departureElem.textContent !== '-') departureElem.textContent = '-';
                if (firstLoad || arrivalElem.innerHTML !== '<span class="error">No inbound trains found.</span>') arrivalElem.innerHTML = '<span class="error">No inbound trains found.</span>';
                if (firstLoad || routeElem.textContent !== '-') routeElem.textContent = '-';
            } else if (info) {
                if (firstLoad || info.innerHTML !== '<span class="error">No inbound trains found.</span>') info.innerHTML = '<span class="error">No inbound trains found.</span>';
            }
            firstLoad = false;
            return;
        }
        // Get the soonest train
        const next = future[0].item;
        // Get its departure time as a Date object
        const depTime = future[0].time;
        // Extract the trip ID (unique for each train run)
        let tripId = null;
        if (next.relationships && next.relationships.trip && next.relationships.trip.data)
            tripId = next.relationships.trip.data.id;
        else if (next.attributes && next.attributes.trip_id)
            tripId = next.attributes.trip_id;
        // Extract the route ID (e.g., "CR-Needham")
        let routeId = null;
        if (next.relationships && next.relationships.route && next.relationships.route.data)
            routeId = next.relationships.route.data.id;
        else if (next.attributes && next.attributes.route_id)
            routeId = next.attributes.route_id;
        // Try to get a human-readable train number or label
        let trainNumber = next.attributes.label || next.attributes.name || extractTrainNumberAndRoute(next.id || 'N/A', routeId) || tripId || 'N/A';
        // Try to get the arrival time at South Station for this trip
        let arrTime = null;
        if (tripId) arrTime = await getArrivalTimeAtStation(tripId, SOUTH_STATION_STOP_ID);
        // Always update on first load, otherwise only if changed
        const depStr = formatTime(depTime);
        const arrStr = arrTime ? formatTime(arrTime) : '<span class="error">Not available</span>';
        if (departureElem && (firstLoad || departureElem.textContent !== depStr)) departureElem.textContent = depStr;
        if (arrivalElem) {
            if (arrTime) {
                if (firstLoad || arrivalElem.textContent !== formatTime(arrTime)) {
                    arrivalElem.textContent = formatTime(arrTime);
                    arrivalElem.classList.remove('error');
                }
            } else {
                if (firstLoad || arrivalElem.innerHTML !== arrStr) arrivalElem.innerHTML = arrStr;
            }
        }
        if (routeElem && (firstLoad || routeElem.textContent !== trainNumber)) routeElem.textContent = trainNumber;
        firstLoad = false;
    } catch (e) {
        // If there was an error (e.g., network), show an error message
        if (departureElem && arrivalElem && routeElem) {
            if (firstLoad || departureElem.textContent !== '-') departureElem.textContent = '-';
            const errStr = `<span class=\"error\">Error: ${e.message}</span>`;
            if (firstLoad || arrivalElem.innerHTML !== errStr) arrivalElem.innerHTML = errStr;
            if (firstLoad || routeElem.textContent !== '-') routeElem.textContent = '-';
        } else if (info) {
            const errStr = `<span class=\"error\">Error: ${e.message}</span>`;
            if (firstLoad || info.innerHTML !== errStr) info.innerHTML = errStr;
        }
        firstLoad = false;
    }
}

// -------------------------------
// Initialization
// -------------------------------

// Call the main function once when the page loads
showNextInboundTrain();
// Set up a timer to refresh the info every 60 seconds (60000 ms)
setInterval(showNextInboundTrain, 60000);
