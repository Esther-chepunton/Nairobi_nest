import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FaSearchLocation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import MapComponent from "../components/MapComponent";

const Search = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0); // Optional
  const [rooms, setRooms] = useState(1);
  const [hotels, setHotels] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [aiRecommendedHotels, setAiRecommendedHotels] = useState([]); // AI recommended hotels
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch("/hotel.json");
        const data = await response.json();

        if (data.hotels && Array.isArray(data.hotels)) {
          setHotels(data.hotels);
          setAiRecommendedHotels(
            [...data.hotels].sort(() => Math.random() - 0.5).slice(0, 3)
          );
          setAllLocations([
            ...new Set(data.hotels.map((hotel) => hotel.location)),
          ]);
        } else {
          throw new Error(
            "Invalid JSON format. Expected an object with 'hotels' key."
          );
        }
      } catch (error) {
        console.error("Error fetching hotels:", error);
      }
    };

    fetchHotels();
  }, []);

  // Search Logic
  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Filter hotels based on search input
      const filteredHotels = hotels.filter((hotel) =>
        hotel.location.toLowerCase().includes(location.toLowerCase())
      );

      localStorage.setItem(
        "searchResults",
        JSON.stringify({
          location,
          checkInDate,
          checkOutDate,
          adults,
          children,
          rooms,
          hotels: filteredHotels.length > 0 ? filteredHotels : hotels,
        })
      );

      navigate("/results");
    }, 1500);
  };

  // Autocomplete Feature for Locations
  const handleLocationChange = (e) => {
    const inputValue = e.target.value;
    setLocation(inputValue);
    setFilteredLocations(
      inputValue.length > 1
        ? allLocations.filter((loc) =>
            loc.toLowerCase().includes(inputValue.toLowerCase())
          )
        : []
    );
  };

  // Booking Logic
  const isAuthenticated = !!localStorage.getItem("userToken");

  const handleBooking = (hotel) => {
    if (!isAuthenticated) {
      setSelectedHotel(hotel); // Save the selected hotel for booking
      setIsModalOpen(true); // Open modal prompting login/signup
    } else {
      navigate("/booking", { state: { hotel } });
    }
  };

  // Handle Login from Modal
  const handleLoginRedirect = () => {
    setIsModalOpen(false);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Hero Section */}
      <div
        className="relative h-[50vh] flex items-center justify-center text-white bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/search.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6 py-10 flex-grow"
      >
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">
            Find your perfect stay!
          </h2>
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Location Input with Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-black">
                Location
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-100 relative">
                <FaSearchLocation className="text-gray-500 mr-2" />
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  className="w-full text-black bg-transparent focus:outline-none"
                  placeholder="Enter city or town"
                  required
                />
              </div>
              {/* Autocomplete dropdown */}
              {filteredLocations.length > 0 && (
                <ul className="absolute z-10 bg-gray-200 border border-gray-400 rounded-lg w-full mt-1">
                  {filteredLocations.map((loc, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setLocation(loc);
                        setFilteredLocations([]);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-300 text-black"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Other Fields */}
            {[
              {
                label: "Check-In Date",
                value: checkInDate,
                setValue: setCheckInDate,
              },
              {
                label: "Check-Out Date",
                value: checkOutDate,
                setValue: setCheckOutDate,
              },
            ].map((field, index) => (
              <div key={index} className="relative">
                <label className="block text-sm font-medium text-black">
                  {field.label}
                </label>
                <input
                  type="date"
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  required
                />
              </div>
            ))}

            {/* Adults, Children, Rooms */}
            {[
              { label: "Adults", value: adults, setValue: setAdults },
              {
                label: "Children (Optional)",
                value: children,
                setValue: setChildren,
              },
              { label: "Rooms", value: rooms, setValue: setRooms },
            ].map((field, index) => (
              <div key={index} className="relative">
                <label className="block text-sm font-medium text-black">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg text-black"
                />
              </div>
            ))}

            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search Hotels"}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* AI Recommended Hotels */}
      <div className="container mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">
          AI Recommended Hotels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiRecommendedHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold text-blue-700">{hotel.name}</h3>
              <p className="text-gray-700">{hotel.description}</p>
              <p className="text-gray-700 font-semibold mt-2">
                Price: ${hotel.price}/night
              </p>
              {hotel.latitude && hotel.longitude && (
      <MapComponent latitude={hotel.latitude} longitude={hotel.longitude} />
    )}

              {/* Book Now Button */}
              <button
                onClick={handleLoginRedirect} // ✅ Use the defined function
                className="w-full bg-[#795548] text-white p-3 rounded-lg hover:bg-[#5D4037] transition"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
        {/* Modal Component */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLogin={handleLoginRedirect}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Search;
