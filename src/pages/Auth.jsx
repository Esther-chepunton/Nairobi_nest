import { motion } from "framer-motion";
import React, { useState } from "react";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulate user authentication (Replace with real API call if available)
    const user = {
      name: "Esther",
      email: "estherchepunton@gmail.com",
      token: "user12345", // Example token
    };

    // Save user data in localStorage
    localStorage.setItem("userToken", user.token);
    localStorage.setItem("userData", JSON.stringify(user));

    // Redirect to the dashboard
    navigate("/dashboard");
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* 🔹 Title */}
        <motion.h2
          key={isLogin ? "login-title" : "signup-title"}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold mb-6 text-center text-blue-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </motion.h2>

        {/* 🔹 Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              key="name-field"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                <FaUser className="text-gray-500 mr-2" />
                <input
                  type="text"
                  className="w-full bg-transparent focus:outline-none text-gray-900"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </motion.div>
          )}

          <motion.div
            key="email-field"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <FaEnvelope className="text-gray-500 mr-2" />
              <input
                type="email"
                className="w-full bg-transparent focus:outline-none text-gray-900"
                placeholder="Enter your email"
                required
              />
            </div>
          </motion.div>

          <motion.div
            key="password-field"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
              <FaLock className="text-gray-500 mr-2" />
              <input
                type="password"
                className="w-full bg-transparent focus:outline-none text-gray-900"
                placeholder="Enter your password"
                required
              />
            </div>
          </motion.div>

          {/* 🔹 Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            {isLogin ? "Login" : "Sign Up"}
          </motion.button>
        </form>

        {/* 🔹 Toggle Button */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-center text-gray-600"
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline focus:outline-none"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
