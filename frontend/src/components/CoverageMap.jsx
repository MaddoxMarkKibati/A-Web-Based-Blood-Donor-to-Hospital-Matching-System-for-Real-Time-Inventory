import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BLOOD_TYPES, stockLevel } from "../utils/stock";

const LEVEL_LABEL = { ok: "OK", low: "Low", critical: "Critical" };
const LEVEL_COLOR = { ok: "#1d7a46", low: "#b7791f", critical: "#8e1119" };
const LEVEL_RANK = { ok: 0, low: 1, critical: 2 };
const ALERT_RADIUS_M = 25000;

export default function CoverageMap({ centers, inventory, thresholds }) {
  const minimumFor = (bt) => thresholds.find((t) => t.blood_type === bt)?.minimum_units ?? 10;
  const share = (bt) => minimumFor(bt) / Math.max(centers.length, 1);

  const units = {};
  for (const item of inventory) {
    units[`${item.regional_storage_center}-${item.blood_type}`] = item.units_available;
  }

  const located = centers.filter((c) => c.location?.coordinates);
  const hidden = centers.length - located.length;

  const rows = located.map((c) => {
    const [lng, lat] = c.location.coordinates;
    let worst = "ok";
    const problems = [];
    for (const bt of BLOOD_TYPES) {
      const level = stockLevel(units[`${c.id}-${bt}`] ?? 0, share(bt));
      if (level !== "ok") problems.push(`${bt} (${LEVEL_LABEL[level].toLowerCase()})`);
      if (LEVEL_RANK[level] > LEVEL_RANK[worst]) worst = level;
    }
    return { center: c, lat, lng, worst, problems };
  });

  return (
    <section className="coverage">
      <h2>Coverage</h2>
      <p>
        Each ring marks the 25 km area from which donors are alerted for that centre. Marker
        colour shows the centre's worst blood type against its share of the national reserve
        minimum.
      </p>

      <div className="coverage-map">
        <MapContainer center={[0.3, 37.9]} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {rows.map(({ center, lat, lng, worst, problems }) => (
            <span key={center.id}>
              <Circle
                center={[lat, lng]}
                radius={ALERT_RADIUS_M}
                pathOptions={{ color: LEVEL_COLOR[worst], weight: 1, fillOpacity: 0.06 }}
              />
              <CircleMarker
                center={[lat, lng]}
                radius={9}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: LEVEL_COLOR[worst], fillOpacity: 1 }}
              >
                <Popup>
                  <strong>{center.region_name}</strong>
                  <br />
                  {center.county}
                  <br />
                  Status: {LEVEL_LABEL[worst]}
                  {problems.length > 0 && (
                    <>
                      <br />
                      Below share: {problems.join(", ")}
                    </>
                  )}
                </Popup>
              </CircleMarker>
            </span>
          ))}
        </MapContainer>
      </div>

      <ul className="coverage-legend">
        {Object.keys(LEVEL_LABEL).map((level) => (
          <li key={level}>
            <span className="coverage-dot" style={{ background: LEVEL_COLOR[level] }} />
            {LEVEL_LABEL[level]}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p>
          {hidden} {hidden === 1 ? "centre has" : "centres have"} no location set and {hidden === 1 ? "is" : "are"} not shown.
        </p>
      )}
    </section>
  );
}