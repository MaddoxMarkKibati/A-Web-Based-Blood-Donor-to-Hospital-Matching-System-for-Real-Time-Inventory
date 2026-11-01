import { useEffect, useState } from "react";
import { savePushSubscription, removePushSubscription } from "../api/donors";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// The browser wants the public key as bytes, not a base64url string.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function PushToggle() {
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // On load, work out whether this device is already subscribed.
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => setEnabled(Boolean(sub)))
      .catch(() => {});
  }, [supported]);

  async function enable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!VAPID_PUBLIC_KEY) {
        throw new Error("Push is not configured (missing VITE_VAPID_PUBLIC_KEY).");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(
          "Notifications are blocked. Allow them in your browser's site settings, then try again."
        );
      }
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await savePushSubscription(subscription.toJSON());
      setEnabled(true);
      setMessage("Alerts enabled on this device.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage("Alerts disabled on this device.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Device Alerts</h2>
      {!supported ? (
        <p>This browser does not support push alerts.</p>
      ) : (
        <>
          <p>
            {enabled
              ? "Alerts are on for this device."
              : "Get a notification on this device when a hospital needs your blood."}
          </p>
          <button type="button" disabled={busy} onClick={enabled ? disable : enable}>
            {busy ? "Working..." : enabled ? "Disable alerts" : "Enable alerts"}
          </button>
        </>
      )}
      {message && <p className="auth-success">{message}</p>}
      {error && <p className="auth-error">{error}</p>}
    </section>
  );
}