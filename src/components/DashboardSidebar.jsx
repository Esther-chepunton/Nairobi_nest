import React from "react";
import { FaHotel, FaUser, FaMoneyBill, FaReceipt, FaSearch, FaCog } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const DashboardSidebar = () => {
  return (
    <aside className="w-70 bg-[#5D4037] text-white p-8 shadow-lg rounded-r-lg sticky top-0 h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <nav className="space-y-4">
        <NavLink to="/search" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaSearch className="mr-2" /> Search Hotels
        </NavLink>
        <NavLink to="/results" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaHotel className="mr-2" /> View Results
        </NavLink>
        <NavLink to="/profile" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaUser className="mr-2" /> Profile
        </NavLink>
        <NavLink to="/payments" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaMoneyBill className="mr-2" /> Payment History
        </NavLink>
        <NavLink to="/receipts" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaReceipt className="mr-2" /> Receipts
        </NavLink>
        <NavLink to="/settings" className="flex items-center p-3 hover:bg-[#795548] rounded-lg text-white">
          <FaCog className="mr-2" /> Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
