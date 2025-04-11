import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ isOpen, onClose, onLogin }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }} // Start invisible
          animate={{ opacity: 1 }} // Fade in
          exit={{ opacity: 0 }} // Fade out when closing
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
            initial={{ scale: 0.8, opacity: 0 }} // Start smaller and invisible
            animate={{ scale: 1, opacity: 1 }} // Scale up and fade in
            exit={{ scale: 0.8, opacity: 0 }} // Scale down and fade out
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Login Required
            </h2>
            <p className="text-gray-700 mb-4">
              You need to log in or sign up to book a hotel.
            </p>

            {/* Buttons */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg mr-2 hover:bg-gray-500 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Login / Sign Up
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
