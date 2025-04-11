import React from "react";

const bookings = [
  {
    hotelName: "🏖️ Ocean View Resort",
    location: "Miami Beach, FL",
    checkIn: "2025-04-15",
    checkOut: "2025-04-20",
    guests: 2,
    status: "Confirmed",
  },
  {
    hotelName: "🌆 Skyline Luxury Suites",
    location: "New York City, NY",
    checkIn: "2025-03-10",
    checkOut: "2025-03-15",
    guests: 1,
    status: "Pending",
  },
  {
    hotelName: "🏔️ Mountain Retreat Lodge",
    location: "Aspen, CO",
    checkIn: "2025-02-05",
    checkOut: "2025-02-10",
    guests: 4,
    status: "Completed",
  },
  {
    hotelName: "🌿 Green Valley Resort",
    location: "Napa Valley, CA",
    checkIn: "2025-05-20",
    checkOut: "2025-05-25",
    guests: 3,
    status: "Cancelled",
  },
  {
    hotelName: "🌊 Blue Lagoon Hotel",
    location: "Honolulu, HI",
    checkIn: "2025-06-01",
    checkOut: "2025-06-07",
    guests: 2,
    status: "Confirmed",
  },
];

const RecentBookings = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-6">
        <h2 className="text-2xl font-bold text-[#795548] mb-6">🏨 Your Recent Bookings</h2>

        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <div
              key={index}
              className="border p-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition transform hover:scale-105"
            >
              <h3 className="text-lg font-bold text-[#5D4037]">{booking.hotelName}</h3>
              <p className="text-gray-700"><strong>📍 Location:</strong> {booking.location}</p>
              <p className="text-gray-700"><strong>📅 Check-in:</strong> {booking.checkIn}</p>
              <p className="text-gray-700"><strong>🏁 Check-out:</strong> {booking.checkOut}</p>
              <p className="text-gray-700"><strong>👥 Guests:</strong> {booking.guests}</p>
              <p
                className={`font-bold ${
                  booking.status === "Confirmed"
                    ? "text-green-600"
                    : booking.status === "Pending"
                    ? "text-yellow-500"
                    : booking.status === "Cancelled"
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
              >
                Status: {booking.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentBookings;
