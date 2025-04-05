import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { posthog } from "@/constants/posthogConfig";

const useSessionTracking = () => {
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const now = Date.now();
        sessionStartRef.current = now;
        posthog.capture("session_start");
      } else if (nextAppState === "background") {
        if (sessionStartRef.current) {
          const now = Date.now();
          const sessionLength = (now - sessionStartRef.current) / 1000;
          posthog.capture("session_end", { session_length: sessionLength });
          sessionStartRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    if (AppState.currentState === "active") {
      handleAppStateChange("active");
    }

    return () => {
      subscription.remove();
    };
  }, []);
};

export default useSessionTracking;
