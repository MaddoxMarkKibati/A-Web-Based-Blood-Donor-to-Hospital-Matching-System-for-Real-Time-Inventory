import RequestMonitor from "../../components/RequestMonitor";

export default function AdminRequests() {
  return (
    <div className="page">
      <h1>Requests</h1>
      <p>
        Blood requests posted by hospital staff, with how many donors were alerted and how
        they responded. Show open requests only, or all requests including fulfilled and
        cancelled ones.
      </p>
      <RequestMonitor />
    </div>
  );
}