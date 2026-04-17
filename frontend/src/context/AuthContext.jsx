import { createContext, useContext, useEffect, useState } from "react";
import {
  clearStoredAuthToken,
  getCurrentUser,
  getStoredAuthToken,
  loginAccount,
  logoutAccount,
  registerAccount,
  resendVerificationEmail,
  storeAuthToken,
} from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    clearStoredAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
    return profile;
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const signIn = async (payload) => {
    const response = await loginAccount(payload);
    storeAuthToken(response.token);
    setUser(response.user);
    return response;
  };

  const signUp = async (payload) => {
    const response = await registerAccount(payload);
    storeAuthToken(response.token);
    setUser(response.user);
    return response;
  };

  const signOut = async () => {
    try {
      await logoutAccount();
    } catch {
      // Ignore API logout failures and clear the local session anyway.
    }
    clearSession();
  };

  const resendVerification = async () => resendVerificationEmail();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isVerified: Boolean(user?.is_verified),
        signIn,
        signUp,
        signOut,
        refreshUser,
        resendVerification,
        clearSession,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
