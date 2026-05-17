import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { setupInterceptors } from './api/axios';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './hooks/useAuth';
import './App.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Component to setup axios interceptors with auth context
function AxiosInterceptorSetup() {
  const { getAccessToken, refreshAccessToken } = useAuth();

  useEffect(() => {
    // Setup interceptors with access to auth context
    setupInterceptors(getAccessToken, refreshAccessToken);
  }, [getAccessToken, refreshAccessToken]);

  return null;
}
const queryClient = new QueryClient();
function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AxiosInterceptorSetup />
            <Toaster />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}


export default App;