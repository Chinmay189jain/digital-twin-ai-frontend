import { TwinProvider } from "./TwinContext";
import { AuthProvider } from "./AuthContext";

// Accept children and pass them through both providers
const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <TwinProvider>
        {children}
      </TwinProvider>
    </AuthProvider>
  );
};

export default GlobalContextProvider;