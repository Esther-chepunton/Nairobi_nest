import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoutes";
import Auth from "./pages/Auth";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import PaymentReceipt from "./pages/PaymentReceipt";
import Results from "./pages/Results";
import Search from "./pages/Search";
import PaymentHistory from "./components/PaymentHistory"; // ✅ Ensure Correct Import
import ReceiptDetails from "./pages/ReceiptDetails"; //
import Settings from "./pages/Settings";

const App = () => {
  return (
    <Router>
      {}
      <ToastContainer />
      {}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/results" element={<Results />} />
        <Route path="/payments" element={<PaymentHistory />} />  {/* ✅ FIXED */}
        <Route path="/receipts" element={<ReceiptDetails />} />
        <Route path="/settings" element={<Settings />} /> 
        
        
        
        
       
        

        {/* Protected Routes */}
        <Route
          path="/booking"
          element={
            <PrivateRoute>
              <Booking />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <PrivateRoute>
              <PaymentReceipt />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
};

export default App;
