import { useLiveLocation } from "../context/liveLocation";

function timeText(date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default function LiveLocationPanel() {
  const { supported, sharing, lastSent, error, start, stop } = useLiveLocation();

  let status = "Off. Hospitals use your saved places only.";
  if (!supported) status = "This browser cannot share location.";
  else if (sharing && lastSent) status = `Sharing. Last update sent at ${timeText(lastSent)}.`;
  else if (sharing) status = "Sharing. Waiting for your first position...";

  return (
    <section className="page-panel live-panel">
      <div className="live-panel-head">
        <h2>Share my live location</h2>
        <button
          type="button"
          role="switch"
          aria-checked={sharing}
          aria-label="Share my live location"
          className="switch"
          disabled={!supported}
          onClick={sharing ? stop : start}
        >
          <span className="switch-knob" />
        </button>
      </div>
      <p>
        While this is on and the app is open in your browser, your position updates
        automatically, so hospitals near where you are can alert you. It stops when you switch
        it off or close the app, and your live position is removed when you switch it off.
      </p>
      <p className="live-status">{status}</p>
      {error && <p className="auth-error">{error}</p>}
    </section>
  );
}