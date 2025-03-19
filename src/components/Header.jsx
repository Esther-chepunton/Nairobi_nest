import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-brown-800 text-white py-4 shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-white">
          <Link to="/" className="hover:text-brown-400 transition duration-300">
            Nairobi Nest
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {["Home", "About Us", "Services", "Testimonials"].map(
            (item, index) => (
              <a
                key={index}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="hover:text-brown-400 transition duration-300 text-lg font-medium text-white"
              >
                {item}
              </a>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            ></path>
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="md:hidden bg-brown-900 py-4">
          <ul className="flex flex-col space-y-4 text-center">
            {["Home", "About Us", "Services", "Testimonials"].map(
              (item, index) => (
                <li key={index}>
                  <a
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="block text-lg text-white hover:text-brown-400 transition duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    {item}
                  </a>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
