import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import * as Network from "expo-network";
import EventEmitter from "eventemitter3";
import { AppState } from "react-native";

const firestoreEmitter = new EventEmitter();

interface NetworkContextType {
  isOnline: boolean;
  triggerFirestoreRefresh: () => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  triggerFirestoreRefresh: () => {},
});

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const previousOnlineStatus = useRef<boolean>(true);

  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    const isCurrentlyOnline = networkState.isConnected ?? false;

    setIsOnline(isCurrentlyOnline);

    if (!previousOnlineStatus.current && isCurrentlyOnline) {
      console.log("🔄 Internet reconnected! Triggering Firestore refresh...");
      firestoreEmitter.emit("refreshFirestore");
    }

    previousOnlineStatus.current = isCurrentlyOnline;
  };

  useEffect(() => {
    checkNetwork(); // Initial check

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkNetwork(); // Only check when app resumes
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        triggerFirestoreRefresh: () =>
          firestoreEmitter.emit("refreshFirestore"),
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
export { firestoreEmitter };
