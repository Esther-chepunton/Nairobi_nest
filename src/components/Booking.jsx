import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaStar,
  FaCheckCircle,
  FaUser,
  FaBed,
  FaCalendarAlt,
} from "react-icons/fa";

const Booking = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const hotel = state?.hotel || {
    name: "Unknown Hotel",
    location: "Unknown Location",
    price: 0,
    images: [],
    description: "",
    amenities: [],
    nearbyFacilities: [],
    rating: 0,
    reviews: 0,
    reviewsList: [],
  };

  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    rooms: 1,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.checkInDate ||
      !formData.checkOutDate ||
      formData.guests < 1 ||
      formData.rooms < 1
    ) {
      alert("Please fill out all required fields correctly.");
      return;
    }

    navigate("/payment", { state: { hotel, ...formData } });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full"
      >
        {/* Hotel Details */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            {hotel.name}
          </h2>
          <p className="text-gray-600 text-center flex items-center justify-center mt-2">
            <FaMapMarkerAlt className="text-red-500 mr-2" /> {hotel.location}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-2 text-center">
            ${hotel.price} <span className="text-gray-500 text-sm">/night</span>
          </p>

          {/* Hotel Images */}
          {hotel.images && hotel.images.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.images.map((image, index) => (
                <motion.img
                  key={index}
                  src={image}
                  alt={`Hotel ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-700 mt-6 text-center">
              No images available.
            </p>
          )}

          {/* Hotel Description */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              About the Hotel
            </h3>
            <p className="text-gray-600">
              {hotel.description || "No description available."}
            </p>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Amenities
            </h3>
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No amenities listed.</p>
            )}
          </div>

          {/* Nearby Facilities */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nearby Facilities
            </h3>
            {hotel.nearbyFacilities && hotel.nearbyFacilities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.nearbyFacilities.map((facility, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-red-500" />
                    <span className="text-gray-700">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No nearby facilities listed.</p>
            )}
          </div>

          {/* Ratings and Reviews */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ratings & Reviews
            </h3>
            <div className="flex items-center space-x-2">
              <FaStar className="text-yellow-500 text-2xl" />
              <span className="text-gray-700">
                {hotel.rating} ({hotel.reviews} reviews)
              </span>
            </div>
            {hotel.reviewsList && hotel.reviewsList.length > 0 ? (
              <div className="mt-2">
                {hotel.reviewsList.map((review, index) => (
                  <div
                    key={index}
                    className="mt-4 border-l-4 border-gray-300 pl-4"
                  >
                    <p className="text-gray-800 font-semibold">{review.user}</p>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mt-2">No reviews available.</p>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Book Your Stay
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-In Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-600" /> Check-In Date
              </label>
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Check-Out Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FaCalendarAlt className="mr-2 text-red-600" /> Check-Out Date
              </label>
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Proceed to Payment Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Proceed to Payment
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Booking;
