import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite does not resolve Leaflet's default marker images on its own.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NAIROBI = [-1.2864, 36.8172];

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15);
  }, [target, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, center = NAIROBI }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);

  const hasPin = lat !== "" && lat != null && lng !== "" && lng != null;
  const position = hasPin ? [Number(lat), Number(lng)] : null;

  function pick(la, ln) {
    onChange({ lat: la.toFixed(6), lng: ln.toFixed(6) });
  }

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setNote("");
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=" +
        encodeURIComponent(q);
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();
      if (!results.length) {
        setNote("No place found. Try a different name, or tap the map.");
        return;
      }
      const la = Number(results[0].lat);
      const ln = Number(results[0].lon);
      pick(la, ln);
      setFlyTarget([la, ln]);
    } catch {
      setNote("Search failed. Tap the map to place your pin instead.");
    } finally {
      setSearching(false);
    }
  }

  function handleUseMyLocation() {
    setNote("");
    if (!navigator.geolocation) {
      setNote("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick(pos.coords.latitude, pos.coords.longitude);
        setFlyTarget([pos.coords.latitude, pos.coords.longitude]);
      },
      () => setNote("Could not get your current location.")
    );
  }

  return (
    <div className="location-picker">
      <div className="location-picker-controls">
        <input
          type="text"
          value={query}
          placeholder="Search a place in Kenya (e.g. Kasarani)"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter must search, not submit the surrounding form.
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>
        <button type="button" onClick={handleUseMyLocation}>
          Use my current location
        </button>
      </div>

      <MapContainer
        center={position || center}
        zoom={13}
        scrollWheelZoom
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={pick} />
        <FlyTo target={flyTarget} />
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend(e) {
                const p = e.target.getLatLng();
                pick(p.lat, p.lng);
              },
            }}
          />
        )}
      </MapContainer>

      <p>{position ? `Pin at ${lat}, ${lng}` : "Tap the map to drop a pin."}</p>
      {note && <p className="auth-error">{note}</p>}
    </div>
  );
}