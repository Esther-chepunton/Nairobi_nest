import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FaBaby,
  FaBuilding,
  FaChalkboardTeacher,
  FaCocktail,
  FaCoffee,
  FaConciergeBell,
  FaDumbbell,
  FaMapMarkerAlt,
  FaParking,
  FaPaw,
  FaSnowflake,
  FaSpa,
  FaSwimmingPool,
  FaTshirt,
  FaUmbrellaBeach,
  FaUtensils,
  FaWifi,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import Modal from "../components/Modal";

const Results = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state || {};
  const { location, checkInDate, checkOutDate, adults, children, rooms } =
    locationState;

  const [searchResults, setSearchResults] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [sortBy, setSortBy] = useState("price");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [recommendedHotels, setRecommendedHotels] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const isAuthenticated = !!localStorage.getItem("userToken");

  const availableAmenities = [
    { name: "Wi-Fi", icon: <FaWifi /> },
    { name: "Pool", icon: <FaSwimmingPool /> },
    { name: "Gym", icon: <FaDumbbell /> },
    { name: "Restaurant", icon: <FaUtensils /> },
    { name: "Parking", icon: <FaParking /> },
    { name: "Spa", icon: <FaSpa /> },
    { name: "Bar", icon: <FaCocktail /> },
    { name: "Air Conditioning", icon: <FaSnowflake /> },
    { name: "Room Service", icon: <FaConciergeBell /> },
    { name: "Breakfast Included", icon: <FaCoffee /> },
    { name: "Pet-Friendly", icon: <FaPaw /> },
    { name: "Beach Access", icon: <FaUmbrellaBeach /> },
    { name: "Conference Room", icon: <FaChalkboardTeacher /> },
    { name: "Laundry Service", icon: <FaTshirt /> },
    { name: "Childcare", icon: <FaBaby /> },
    { name: "Elevator", icon: <FaBuilding /> },
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const response = await fetch("/hotel.json");
        if (!response.ok) throw new Error("Failed to fetch hotel data.");
        const data = await response.json();
        if (Array.isArray(data.hotels)) {
          setSearchResults(data.hotels);
          setFilteredHotels(data.hotels);
        } else {
          throw new Error("Invalid hotel JSON format.");
        }
      } catch (error) {
        console.error("🚨 Error loading hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [isAuthenticated]);

  useEffect(() => {
    setFilteredHotels((prevHotels) =>
      [...prevHotels].sort((a, b) => {
        if (sortBy === "price") return a.price - b.price;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "location") return a.location.localeCompare(b.location);
        return 0;
      })
    );
  }, [sortBy]);

  useEffect(() => {
    const filtered = searchResults.filter(
      (hotel) =>
        hotel.price >= priceRange[0] &&
        hotel.price <= priceRange[1] &&
        (selectedAmenities.length === 0 ||
          selectedAmenities.every((a) => hotel.amenities.includes(a)))
    );
    setFilteredHotels(filtered);
  }, [priceRange, selectedAmenities, searchResults]);

  const handleBooking = (hotel) => {
    if (!isAuthenticated) {
      setSelectedHotel(hotel);
      setIsModalOpen(true);
    } else {
      navigate("/booking", { state: { hotel } });
    }
  };

  const handleLoginRedirect = () => {
    setIsModalOpen(false);
    navigate("/auth");
  };

  const fetchRecommendations = async (latitude, longitude) => {
    try {
      setRecommendationsLoading(true);
      setRecommendationError(null);
      const response = await fetch(
        "http://localhost:5000/api/recommendations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      const data = await response.json();
      console.log("📦 Recommendation Response:", data); // Add debug log
      if (response.ok && data.status === "success") {
        setRecommendedHotels(data.data);
      } else {
        console.error(
          "Error fetching recommendations:",
          data.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("🚨 API Error:", error);
      setRecommendationError(error.message);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleHotelClick = (hotel) => {
    fetchRecommendations(hotel.latitude, hotel.longitude);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-80 bg-[#5D4037] text-white p-8 shadow-lg rounded-r-lg sticky top-0 h-screen overflow-y-auto"
      >
        <h3 className="text-xl font-bold mb-6 text-white">Filters</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 bg-[#795548] text-white rounded w-full mt-2 focus:ring-2 focus:ring-white transition"
          >
            <option value="price">Price (Low to High)</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="location">Location (A-Z)</option>
          </select>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">
            Price Range: ${priceRange[0]} - ${priceRange[1]}
          </label>
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([parseInt(e.target.value), priceRange[1]])
            }
            className="w-full my-2 accent-black"
          />
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], parseInt(e.target.value)])
            }
            className="w-full accent-black"
          />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4">Amenities</h4>
          <div className="grid grid-cols-2 gap-4">
            {availableAmenities.map(({ name, icon }) => (
              <motion.label
                key={name}
                whileHover={{ scale: 1.05 }}
                className="flex items-center bg-[#795548] p-3 rounded-lg cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedAmenities.includes(name)}
                  onChange={() =>
                    setSelectedAmenities((prev) =>
                      prev.includes(name)
                        ? prev.filter((a) => a !== name)
                        : [...prev, name]
                    )
                  }
                />
                {icon} <span className="ml-2">{name}</span>
              </motion.label>
            ))}
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 container mx-auto px-6 py-10 overflow-y-auto h-screen pl-20">
        {loading ? (
          <p className="text-center text-gray-800">Loading hotels...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHotels.map((hotel) => (
                <motion.div
                  key={hotel.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
                  onClick={() => handleHotelClick(hotel)} // ✅ Attach click here
                >
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-2xl font-semibold text-[#4E342E] mb-2">
                    {hotel.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {hotel.description}
                  </p>
                  <p>
                    <strong>Price:</strong> ${hotel.price}/night
                  </p>
                  {hotel.latitude && hotel.longitude && (
                    <MapComponent
                      latitude={hotel.latitude}
                      longitude={hotel.longitude}
                    />
                  )}
                  <button
                    onClick={() => handleBooking(hotel)}
                    className="w-full bg-[#795548] text-white p-3 rounded-lg hover:bg-[#5D4037] transition mt-4"
                  >
                    Book Now
                  </button>
                </motion.div>
              ))}
            </div>

            {recommendedHotels.length > 0 && (
              <div className="mt-10 p-6 bg-yellow-50 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">
                  🧭 Nearby Hotels You Might Like
                </h3>
                <ul className="space-y-3">
                  {recommendedHotels.map((hotel, index) => (
                    <li
                      key={index}
                      className="p-4 bg-white rounded shadow text-gray-800"
                    >
                      <h4 className="text-lg font-semibold">{hotel.name}</h4>
                      <p>Distance: {hotel.distance.toFixed(2)} km</p>
                      <p>Location: {hotel.address}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Right Sidebar for Recommendations */}
      <motion.aside
        initial={{ x: 100, opacity: 0 }}
        animate={{
          x: recommendedHotels.length > 0 ? 0 : 100,
          opacity: recommendedHotels.length > 0 ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className={`w-80 bg-white p-6 shadow-lg sticky top-0 h-screen overflow-y-auto border-l border-gray-200 ${
          recommendedHotels.length > 0 ? "block" : "hidden"
        }`}
      >
        <h3 className="text-xl font-bold text-[#5D4037] mb-4 flex items-center">
          <FaMapMarkerAlt className="mr-2" /> Nearby Recommendations
        </h3>

        {recommendationsLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5D4037]"></div>
          </div>
        ) : recommendationError ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg">
            {recommendationError}
          </div>
        ) : (
          <div className="space-y-4">
            {recommendedHotels.map((hotel) => (
              <motion.div
                key={hotel.id || hotel.name}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gray-50 rounded-lg shadow-sm cursor-pointer border border-gray-200"
                onClick={() => {
                  // Optional: scroll to this hotel in main view
                }}
              >
                <h4 className="font-semibold text-[#5D4037]">{hotel.name}</h4>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-1" />
                  <span>{hotel.distance?.toFixed(2)} km away</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-medium">${hotel.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBooking(hotel);
                    }}
                    className="px-3 py-1 bg-[#5D4037] text-white text-sm rounded hover:bg-[#795548]"
                  >
                    Book
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.aside>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLogin={handleLoginRedirect}
      />
    </div>
  );
};

export default Results;
