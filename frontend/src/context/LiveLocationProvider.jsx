import { useCallback, useEffect, useRef, useState } from "react";
import { LiveLocationContext } from "./liveLocation";
import { sendLiveLocation, stopLiveLocation } from "../api/donors";

const MIN_MOVE_METRES = 100;
const MIN_INTERVAL_MS = 30 * 1000;
const HEARTBEAT_MS = 4 * 60 * 1000;

function metres(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function readStored(key) {
  try {
    return localStorage.getItem(key) === "on";
  } catch {
    return false;
  }
}

function writeStored(key, on) {
  try {
    localStorage.setItem(key, on ? "on" : "off");
  } catch {
    // Storage can be blocked; sharing still works for this session.
  }
}

export default function LiveLocationProvider({ userKey, children }) {
  const storageKey = `live_location_sharing_${userKey}`;
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const [sharing, setSharing] = useState(() => supported && readStored(storageKey));
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState("");
  const lastSentRef = useRef({ lat: null, lng: null, at: 0 });
  const latestRef = useRef(null);

  const send = useCallback(async (lat, lng) => {
    try {
      await sendLiveLocation(lat, lng);
      lastSentRef.current = { lat, lng, at: Date.now() };
      setLastSent(new Date());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!sharing) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        latestRef.current = here;
        const last = lastSentRef.current;
        if (last.lat === null) {
          send(here.lat, here.lng);
          return;
        }
        const movedFar = metres(last, here) >= MIN_MOVE_METRES;
        const waitedLong = Date.now() - last.at >= MIN_INTERVAL_MS;
        if (movedFar && waitedLong) send(here.lat, here.lng);
      },
      (err) => {
        if (err.code === 1) {
          writeStored(storageKey, false);
          setSharing(false);
          setError("Location permission was blocked. Allow location for this site in your browser, then switch sharing on again.");
        } else {
          setError("Could not read your location right now. It will keep trying.");
        }
      },
      { enableHighAccuracy: false, maximumAge: 15000, timeout: 30000 }
    );

    // A donor who stays still sends no movement, so refresh now and then
    // to keep the location from going stale.
    const heartbeat = setInterval(() => {
      const here = latestRef.current;
      if (here && Date.now() - lastSentRef.current.at >= HEARTBEAT_MS) {
        send(here.lat, here.lng);
      }
    }, 60 * 1000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [sharing, send, storageKey]);

  const start = useCallback(() => {
    setError("");
    lastSentRef.current = { lat: null, lng: null, at: 0 };
    writeStored(storageKey, true);
    setSharing(true);
  }, [storageKey]);

  const stop = useCallback(async () => {
    writeStored(storageKey, false);
    setSharing(false);
    setLastSent(null);
    try {
      await stopLiveLocation();
    } catch (err) {
      setError(err.message);
    }
  }, [storageKey]);

  return (
    <LiveLocationContext.Provider value={{ supported, sharing, lastSent, error, start, stop }}>
      {children}
    </LiveLocationContext.Provider>
  );
}