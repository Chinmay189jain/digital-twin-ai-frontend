import { TwinProvider } from "./TwinContext";
import { AuthProvider } from "./AuthContext";
import { WebSocketProvider } from "./WebSocketContext";

// Accept children and pass them through all providers
// WebSocketProvider - depends on AuthProvider for user state
const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <WebSocketProvider> 
        <TwinProvider>
          {children}
        </TwinProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default GlobalContextProvider;