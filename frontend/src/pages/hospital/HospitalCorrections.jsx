import BloodTypeCorrection from "../../components/BloodTypeCorrection";

export default function HospitalCorrections() {
  return (
    <div className="page">
      <h1>Blood type corrections</h1>
      <p>
        Donors cannot change their own blood type once it is set. If a lab result shows a
        different type, search for the donor by name or national ID and correct it here.
      </p>
      <BloodTypeCorrection />
    </div>
  );
}