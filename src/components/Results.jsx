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
  FaParking,
  FaPaw,
  FaSnowflake,
  FaSpa,
  FaSwimmingPool,
  FaTshirt,
  FaUmbrellaBeach,
  FaUtensils,
  FaWifi,
} from "react-icons/fa"; // Icons for amenities
import { useLocation, useNavigate } from "react-router-dom";

const Results = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state || {};
  const { location, checkInDate, checkOutDate, adults, children, rooms } =
    locationState || {};

  const [searchResults, setSearchResults] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [sortBy, setSortBy] = useState("price");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [loading, setLoading] = useState(true);

  // ✅ Define Amenities with Icons
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

  // ✅ Fetch Hotels from JSON
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
  }, []);

  // ✅ Sorting Logic
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

  // ✅ Filtering Logic
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sticky Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-96 bg-[#5D4037] text-white p-8 shadow-lg rounded-r-lg sticky top-0 h-screen overflow-y-auto"
      >
        <h3 className="text-xl font-bold mb-6 text-white">Filters</h3>

        {/* Sorting Options */}
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

        {/* Price Range Filter */}
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

        {/* Amenities Filter */}
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

      {/* Scrollable Main Content */}
      <div className="flex-1 container mx-auto px-6 py-10 overflow-y-auto h-screen pl-20">
        {loading ? (
          <p className="text-center text-gray-800">Loading hotels...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <motion.div
                  key={hotel.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
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
                  <button
                    onClick={() => navigate(`/booking/${hotel.id}`)}
                    className="w-full bg-[#795548] text-white p-3 rounded-lg hover:bg-[#5D4037] transition"
                  >
                    Book Now
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-800">
                No hotels match your filters.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
