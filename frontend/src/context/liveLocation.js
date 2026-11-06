import { createContext, useContext } from "react";

export const LiveLocationContext = createContext(null);

export function useLiveLocation() {
  return useContext(LiveLocationContext);
}