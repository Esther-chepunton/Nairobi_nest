import React from "react";



const PaymentHistory = () => {
  const payments = [
    { id: 1, date: "2024-03-20", amount: "$150.00", method: "Credit Card", status: "Completed" },
    { id: 2, date: "2024-03-18", amount: "$85.00", method: "PayPal", status: "Completed" },
    { id: 3, date: "2024-03-10", amount: "$200.00", method: "Bank Transfer", status: "Pending" },
    { id: 4, date: "2024-02-25", amount: "$300.00", method: "Credit Card", status: "Failed" },
    { id: 5, date: "2024-02-15", amount: "$50.00", method: "Cash", status: "Completed" },
  ];

  return (
    
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="p-8 mt-6 bg-white shadow-lg rounded-lg mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold mb-6 text-black">💰 Payment History</h2>

        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border p-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition transform hover:scale-105"
            >
              <p className="text-black"><strong>Date:</strong> {payment.date}</p>
              <p className="text-black"><strong>Amount:</strong> {payment.amount}</p>
              <p className="text-black"><strong>Method:</strong> {payment.method}</p>
              <p className={`font-bold ${payment.status === "Completed" ? "text-green-600" : payment.status === "Pending" ? "text-yellow-500" : "text-red-500"}`}>
                Status: {payment.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    
  );
};

export default PaymentHistory;
