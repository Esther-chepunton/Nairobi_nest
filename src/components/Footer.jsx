import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#3E2723] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#D7CCC8]">Company</h3>
            <ul className="text-[#FFECB3]">
              <li>About Us</li>
              <li>Careers</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#D7CCC8]">Support</h3>
            <ul className="text-[#FFECB3]">
              <li>Help Center</li>
              <li>FAQs</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#D7CCC8]">Services</h3>
            <ul className="text-[#FFECB3]">
              <li>Hotel Search</li>
              <li>AI Recommendations</li>
              <li>Booking</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#D7CCC8]">Follow Us</h3>
            <ul className="text-[#FFECB3]">
              <li>Facebook</li>
              <li>Twitter</li>
              <li>Instagram</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
