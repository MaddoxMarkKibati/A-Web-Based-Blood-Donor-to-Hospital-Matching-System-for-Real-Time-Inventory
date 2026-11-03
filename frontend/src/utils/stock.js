export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Below the minimum is "low"; below half of it is "critical".
export function stockLevel(units, minimum) {
  if (units < minimum / 2) return "critical";
  if (units < minimum) return "low";
  return "ok";
}