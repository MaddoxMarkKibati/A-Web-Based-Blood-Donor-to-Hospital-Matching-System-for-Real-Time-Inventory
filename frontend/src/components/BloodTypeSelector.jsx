import BloodTypeTag from "./BloodTypeTag";
import { BLOOD_TYPES } from "../utils/stock";

export default function BloodTypeSelector({ value, onChange, label = "Blood type" }) {
  return (
    <div role="radiogroup" aria-label={label} className="type-selector">
      {BLOOD_TYPES.map((bt) => (
        <button
          key={bt}
          type="button"
          role="radio"
          aria-checked={value === bt}
          className="type-option"
          onClick={() => onChange(bt)}
        >
          <BloodTypeTag type={bt} size="md" />
        </button>
      ))}
    </div>
  );
}