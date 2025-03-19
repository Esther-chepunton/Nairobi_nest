import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Auth from "./components/Auth";
import Booking from "./components/Booking";
import Home from "./components/Home";
import PaymentReceipt from "./components/PaymentReceipt";
import Results from "./components/Results";
import Search from "./components/Search";

const App = () => {
  return (
    <Router>
      {}
      <ToastContainer />
      {}
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/results" element={<Results />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/payment" element={<PaymentReceipt />} />
      </Routes>
    </Router>
  );
};

export default App;
