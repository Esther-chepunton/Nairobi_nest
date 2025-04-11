import React from "react";

const ReceiptDetails = () => {
  const receipts = [
    { id: "INV-001", date: "2024-03-20", amount: "$150.00", items: ["Room Booking", "Breakfast"] },
    { id: "INV-002", date: "2024-03-18", amount: "$85.00", items: ["Conference Hall"] },
    { id: "INV-003", date: "2024-03-10", amount: "$200.00", items: ["Luxury Suite"] },
    { id: "INV-004", date: "2024-02-25", amount: "$300.00", items: ["Presidential Suite", "Dinner"] },
    { id: "INV-005", date: "2024-02-15", amount: "$50.00", items: ["Gym Membership"] },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-6">
        <h2 className="text-3xl font-bold mb-6 text-black">📜 Receipt Details</h2>

        <div className="space-y-4">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="border p-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition transform hover:scale-105">
              <p className="text-black"><strong>Invoice ID:</strong> {receipt.id}</p>
              <p className="text-black"><strong>Date:</strong> {receipt.date}</p>
              <p className="text-black"><strong>Amount:</strong> {receipt.amount}</p>
              <p className="text-black"><strong>Items:</strong> {receipt.items.join(", ")}</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Download Receipt
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetails;
