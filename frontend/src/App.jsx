import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { HOME } from "./navigation";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import DonorHome from "./pages/donor/DonorHome";
import DonorAlerts from "./pages/donor/DonorAlerts";
import DonorLocations from "./pages/donor/DonorLocations";
import DonorHistory from "./pages/donor/DonorHistory";
import DonorProfile from "./pages/donor/DonorProfile";
import HospitalRequests from "./pages/hospital/HospitalRequests";
import HospitalStock from "./pages/hospital/HospitalStock";
import HospitalCorrections from "./pages/hospital/HospitalCorrections";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Sends a signed-in person to the home page for their role.
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME[user.role] || "/login"} replace />;
}

// Keeps each role out of the other roles' pages.
function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (user.role !== role) {
    return <Navigate to={HOME[user.role] || "/login"} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomeRedirect />
            </PrivateRoute>
          }
        />
        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
                    <Route
            path="/donor"
            element={
              <RequireRole role="donor">
                <DonorHome />
              </RequireRole>
            }
          />
          <Route
            path="/donor/alerts"
            element={
              <RequireRole role="donor">
                <DonorAlerts />
              </RequireRole>
            }
          />
                    <Route
            path="/donor/locations"
            element={
              <RequireRole role="donor">
                <DonorLocations />
              </RequireRole>
            }
          />
                    <Route
            path="/donor/history"
            element={
              <RequireRole role="donor">
                <DonorHistory />
              </RequireRole>
            }
          />
          <Route
            path="/donor/profile"
            element={
              <RequireRole role="donor">
                <DonorProfile />
              </RequireRole>
            }
          />
          <Route
            path="/hospital"
            element={
              <RequireRole role="hospital_staff">
                <HospitalRequests />
              </RequireRole>
            }
          />
          <Route
            path="/hospital/stock"
            element={
              <RequireRole role="hospital_staff">
                <HospitalStock />
              </RequireRole>
            }
          />
          <Route
            path="/hospital/corrections"
            element={
              <RequireRole role="hospital_staff">
                <HospitalCorrections />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="knbts_admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;