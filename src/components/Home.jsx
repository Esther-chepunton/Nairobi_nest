import { motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans">
      {/* Header */}
      <header className="bg-white text-black py-4 shadow-md fixed w-full top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Nairobi Nest</h1>
          <nav>
            <ul className="flex space-x-6 text-lg">
              <li>
                <a href="#home" className="hover:text-brown-600">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-brown-600">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-brown-600">
                  Services
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative h-screen flex items-center justify-center text-white"
        style={{
          backgroundImage: "url('/images/hero1.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0  bg-opacity-10"></div>
        <motion.div
          className="relative text-center z-10"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">
            Find Your Perfect Stay. Home away from home!
          </h1>
          <p className="text-xl mb-6 drop-shadow-lg">
            Effortless Booking, Unmatched Comfort! ✨🏨
          </p>
          <motion.button
            onClick={() => navigate("/search")}
            className="bg-brown-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-brown-800 transition duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white text-black">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <img
            src="/images/about.webp"
            alt="About Us"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h2 className="text-4xl font-bold mb-4">About Nairobi Nest</h2>
            <p className="text-lg mb-4">
              Nairobi Nest is a premier hotel booking platform designed to
              simplify your travel experience by offering a wide range of
              hotels, easy search and booking, and secure payment options. Our
              goal is to connect travelers with the best accommodations in
              Nairobi and beyond, ensuring a seamless, hassle-free booking
              process.
            </p>
            <p className="text-lg">
              Whether you're looking for luxury, budget-friendly stays, or
              hidden gems, our AI-powered recommendations help you find the
              perfect match tailored to your preferences. At Nairobi Nest, we
              make hotel booking effortless, secure, and personalized for every
              traveler. 🌍🔍💳
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-brown-100 text-black">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-8">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                title: "Wide Range of Hotels",
                description:
                  "Choose from various hotels, from budget to luxury.",
                img: "/images/service1.webp",
              },
              {
                title: "Easy Booking",
                description: "Book your ideal stay in just a few clicks.",
                img: "/images/service2.webp",
              },
              {
                title: "Secure Payments",
                description:
                  "We ensure safe and reliable transactions for your bookings.",
                img: "/images/service3.webp",
              },
              {
                title: "AI Recommendations",
                description:
                  "Get AI-powered hotel suggestions based on your preferences.",
                img: "/images/service4.webp",
              },
            ].map((service, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <img
                  src={service.img}
                  alt={service.title}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p>{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
