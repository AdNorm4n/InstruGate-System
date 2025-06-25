import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import InstrumentList from "./pages/InstrumentList";
import Configurator from "./pages/Configurator";
import Review from "./pages/Review";
import SelectedInstruments from "./pages/SelectedInstruments";
import ProtectedRoute from "./components/ProtectedRoute";
import QuotationForm from "./pages/QuotationForm";
import SubmittedQuotations from "./pages/SubmittedQuotations";
import UserProfile from "./pages/UserProfile";
import Tools from "./pages/Tools";
import About from "./pages/About";
import AdminPanel from "./pages/AdminPanel";
import UsersAdmin from "./pages/UsersAdmin";
import InstrumentsAdmin from "./pages/InstrumentsAdmin";
import QuotationsAdmin from "./pages/QuotationsAdmin";
import Footer from "./components/Footer";
import ChatComponent from "./components/ChatComponent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { UserProvider } from "./contexts/UserContext";
import Appbar from "./components/Menubar";
import ToolbarMenu from "./components/ToolbarMenu";

const Layout = () => {
  return (
    <>
      <Menubar /> {/* was <Appbar /> */}
      <ToolbarMenu />
      <Outlet />
      <Footer />
      <ChatComponent />
    </>
  );
};

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instruments"
              element={
                <ProtectedRoute>
                  <InstrumentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instruments/:instrumentId/config"
              element={
                <ProtectedRoute>
                  <Configurator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instruments/:instrumentId/review"
              element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              }
            />
            <Route
              path="/selected-instruments"
              element={
                <ProtectedRoute>
                  <SelectedInstruments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotation"
              element={
                <ProtectedRoute>
                  <QuotationForm instruments={[]} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/submitted/"
              element={
                <ProtectedRoute>
                  <SubmittedQuotations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <Tools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-panel"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <UsersAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/instruments"
              element={
                <ProtectedRoute>
                  <InstrumentsAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quotations"
              element={
                <ProtectedRoute>
                  <QuotationsAdmin />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
