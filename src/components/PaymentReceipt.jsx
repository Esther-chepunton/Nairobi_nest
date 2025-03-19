import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
  FaCcVisa,
  FaCcMastercard,
  FaPaypal,
  FaMobileAlt,
} from "react-icons/fa";

const PaymentReceipt = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "",
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    billingAddress: "",
    paypalUsername: "",
    paypalEmail: "",
    paypalCurrency: "",
    paypalAmount: "",
    mpesaBusinessNumber: "",
    mpesaTillNumber: "",
    mpesaPhoneNumber: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: "mpesa",
      name: "M-Pesa",
      icon: <FaMobileAlt className="text-green-600" />,
    },
    { id: "visa", name: "Visa", icon: <FaCcVisa className="text-blue-600" /> },
    {
      id: "paypal",
      name: "PayPal",
      icon: <FaPaypal className="text-blue-500" />,
    },
    {
      id: "mastercard",
      name: "MasterCard",
      icon: <FaCcMastercard className="text-red-600" />,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentMethodSelect = (method) => {
    setFormData({ ...formData, paymentMethod: method });
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (!formData.paymentMethod) {
      toast.error("Please select a payment method.", {
        position: "top-center",
      });
      return;
    }

    toast.info("Processing payment...", { position: "top-center" });

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const receiptContent = `
        Hotel Booking Receipt
        ---------------------
        Name: ${formData.fullName}
        Email: ${formData.email}
        Phone: ${formData.phone || "N/A"}
        Payment Method: ${formData.paymentMethod.toUpperCase()}
        Amount: $200
        Status: Paid
        Date & Time: ${new Date().toLocaleString()}
        Transaction ID: ${Math.random().toString(36).substring(2, 15)}
      `;
      setReceipt(receiptContent);
      toast.success("Payment successful! Receipt generated.", {
        position: "top-center",
      });
    }, 2000);
  };

  const downloadReceipt = () => {
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "receipt.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <ToastContainer />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl"
      >
        <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
          Payment Details
        </h2>

        {/* Payment Method Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Select Payment Method
          </h3>
          <div className="flex space-x-4">
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                onClick={() => handlePaymentMethodSelect(method.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  formData.paymentMethod === method.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-blue-600"
                }`}
              >
                {method.icon}
                <span className="text-sm font-medium text-gray-700 mt-2">
                  {method.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Form (Dynamic Fields) */}
        <form onSubmit={handlePayment} className="space-y-6">
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />

          {formData.paymentMethod === "mpesa" && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Business/Till Number
              </label>
              <input
                type="text"
                name="mpesaBusinessNumber"
                value={formData.mpesaBusinessNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="mpesaPhoneNumber"
                value={formData.mpesaPhoneNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </>
          )}

          {formData.paymentMethod === "visa" ||
          formData.paymentMethod === "mastercard" ? (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="month"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </>
          ) : null}

          {formData.paymentMethod === "paypal" && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                PayPal Email
              </label>
              <input
                type="email"
                name="paypalEmail"
                value={formData.paypalEmail}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <input
                type="text"
                name="paypalCurrency"
                value={formData.paypalCurrency}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg"
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </motion.button>
        </form>

        {/* Receipt Section */}
        {receipt && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-700 mb-4">
              Payment Receipt
            </h3>
            <pre className="text-gray-700 whitespace-pre-wrap">{receipt}</pre>
            <button
              onClick={downloadReceipt}
              className="w-full bg-green-600 text-white p-3 rounded-lg mt-4"
            >
              Download Receipt
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentReceipt;
