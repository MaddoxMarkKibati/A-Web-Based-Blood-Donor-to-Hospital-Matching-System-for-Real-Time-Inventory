import { BLOOD_TYPES, stockLevel } from "../utils/stock";

const LEVEL_LABEL = { ok: "OK", low: "Low", critical: "Critical" };

export default function StockOverview({ centers, inventory, thresholds }) {
  const minimumFor = (bloodType) =>
    thresholds.find((t) => t.blood_type === bloodType)?.minimum_units ?? 10;

  const totals = Object.fromEntries(BLOOD_TYPES.map((bt) => [bt, 0]));
  const cells = {};
  for (const item of inventory) {
    totals[item.blood_type] += item.units_available;
    cells[`${item.regional_storage_center}-${item.blood_type}`] = item.units_available;
  }

  return (
    <>
      <section>
        <h2>National Stock</h2>
        <p>
          Each bar shows national units for a blood type. The line marks its reserve
          minimum, and the bar is scaled to twice that minimum.
        </p>
        <div className="stock-bars">
          {BLOOD_TYPES.map((bt) => {
            const minimum = minimumFor(bt);
            const total = totals[bt];
            const level = stockLevel(total, minimum);
            const percent = Math.min(100, (total / (2 * Math.max(minimum, 1))) * 100);
            return (
              <div className="stock-bar-row" key={bt}>
                <span className="stock-bar-label">{bt}</span>
                <div className="stock-bar-track">
                  <div className={`stock-bar-fill level-${level}`} style={{ width: `${percent}%` }} />
                  <div className="stock-bar-marker" />
                </div>
                <span className="stock-bar-value">
                  {total} / min {minimum} — {LEVEL_LABEL[level]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Stock Matrix</h2>
        <div className="stock-matrix-wrap">
          <table className="stock-matrix">
            <thead>
              <tr>
                <th>Region</th>
                {BLOOD_TYPES.map((bt) => (
                  <th key={bt}>{bt}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {centers.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.region_name}</th>
                  {BLOOD_TYPES.map((bt) => {
                    const units = cells[`${c.id}-${bt}`] ?? 0;
                    return (
                      <td key={bt} className={units === 0 ? "stock-cell-empty" : ""}>
                        {units}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}