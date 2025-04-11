import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import RecentBookings from "../components/RecentBookings";
import RecommendedHotels from "../components/RecommendedHotels";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest" };

  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionMessage, setPredictionMessage] = useState("");

  const today = new Date();
  today.setDate(today.getDate() + 7);
  const targetDate = today.toISOString().split("T")[0];

  const holidays = [
    {
      date: targetDate,
      warning: `📅 Based on recent travel trends and upcoming public holidays, we predict a surge in hotel bookings around ${targetDate}. Rooms in popular areas like Westlands and CBD may sell out fast. 🏨

To avoid last-minute inconvenience, we recommend securing your stay early. Early bookers also stand a chance to unlock limited-time discounts and free upgrades. 🎁`,
    },
    {
      date: "2025-05-01",
      warning:
        "🌍 Labour Day is approaching. Expect limited hotel availability and increased prices in Nairobi. Plan ahead for the best deals!",
    },
  ];



  useEffect(() => {
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + 7);
    console.log("📅 Target date:", target.toDateString());
    holidays.forEach((holiday) => {
      console.log(
        "📅 Checking holiday:",
        new Date(holiday.date).toDateString()
      );

      if (new Date(holiday.date).toDateString() === target.toDateString()) {
        setShowPrediction(true);
        setPredictionMessage(holiday.warning);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />

      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[#795548]">
          Welcome, {user.name}!
        </h1>

        {/* 🔔 AI Prediction Alert */}
        {showPrediction && (
          <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 rounded">
            <strong>📢 Upcoming Event:</strong> {predictionMessage}
          </div>
        )}

        {/* Recent Bookings Section */}
        <RecentBookings />

        {/* AI Hotel Recommendations */}
        <RecommendedHotels />

        {showPrediction && (
          <div className="mt-6 p-6 bg-yellow-50 border-l-4 border-yellow-400 shadow-md rounded text-yellow-800">
            <h2 className="font-bold text-lg mb-2">📢 AI Travel Alert</h2>
            <p className="whitespace-pre-line">{predictionMessage}</p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem("userToken");
            navigate("/");
          }}
          className="mt-6 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
