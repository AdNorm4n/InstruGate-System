import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instruments"
          element={
            <ProtectedRoute>
              <InstrumentList />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instruments/:instrumentId/config"
          element={
            <ProtectedRoute>
              <Configurator />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instruments/:instrumentId/review"
          element={
            <ProtectedRoute>
              <Review />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/selected-instruments"
          element={
            <ProtectedRoute>
              <SelectedInstruments />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotation"
          element={
            <ProtectedRoute>
              <QuotationForm instruments={[]} />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/submitted/"
          element={
            <ProtectedRoute>
              <SubmittedQuotations />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UsersAdmin />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/instruments"
          element={
            <ProtectedRoute>
              <InstrumentsAdmin />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quotations"
          element={
            <ProtectedRoute>
              <QuotationsAdmin />
              <Footer />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
