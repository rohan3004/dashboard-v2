import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Notification Overlay Component
const NotificationContainer = () => {
  const { notifications } = useAuth();
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 pointer-events-auto ${
            n.type === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' : 
            n.type === 'info' ? 'bg-blue-950/80 border-blue-500 text-blue-200' :
            'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {n.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{n.message}</span>
        </div>
      ))}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    // 1. AuthProvider MUST wrap everything
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
          <NotificationContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/complete-registration" element={<Register />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;