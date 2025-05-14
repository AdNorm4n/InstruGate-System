// src/App.jsx
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
              <QuotationForm instruments={[]} /> {}
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
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
