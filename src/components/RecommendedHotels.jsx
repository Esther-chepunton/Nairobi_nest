import React, { useEffect, useState } from "react";

const RecommendedHotels = () => {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    // Fetch hotel data from JSON file
    fetch("/hotel.json")
      .then((response) => response.json())
      .then((data) => {
        // Randomly select 3-4 hotels
        const randomHotels = [...data.hotels]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        setRecommended(randomHotels);
      })
      .catch((error) => console.error("Error fetching hotels:", error));
  }, []);

  return (
    <div className="mt-6 bg-gray-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-[#795548] mb-4">🏨 Recommended Hotels</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommended.map((hotel, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-full h-40 object-cover rounded"
            />
            <h3 className="text-lg font-semibold mt-3 text-[#5D4037]">{hotel.name}</h3>
            <p className="text-sm text-gray-600">📍 {hotel.location}</p>
            <p className="font-bold mt-2 text-green-600">${hotel.price}/night</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedHotels;
