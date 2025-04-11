import React, { useState } from "react";

const Settings = () => {
  const [user, setUser] = useState({
    fullName: "John Doe",
    email: "johndoe@example.com",
    password: "********",
    notifications: true,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
    <div className="p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-lg transition-all duration-500 ease-in-out transform hover:scale-105">
      <h2 className="text-2xl font-bold mb-4 text-black">⚙️ Settings</h2>

      {/* Profile Information */}
      <div className="mb-4">
        <label className="block font-semibold text-black">Full Name:</label>
        <input type="text" value={user.fullName} className="w-full border p-2 rounded-lg bg-gray-100 text-black" disabled />
      </div>

      <div className="mb-4">
        <label className="block font-semibold text-black">Email:</label>
        <input type="email" value={user.email} className="w-full border p-2 rounded-lg bg-gray-100 text-black" disabled />
      </div>

      {/* Change Password */}
      <div className="mb-4">
        <label className="block font-semibold text-black">Password:</label>
        <input type="password" value={user.password} className="w-full border p-2 rounded-lg bg-gray-100 text-black" disabled />
        <button className="mt-2 text-blue-600 hover:underline">Change Password</button>
      </div>

      {/* Notifications Toggle */}
      <div className="flex items-center mb-4">
        <label className="font-semibold text-black mr-2">🔔 Email Notifications:</label>
        <input
          type="checkbox"
          checked={user.notifications}
          onChange={() => setUser({ ...user, notifications: !user.notifications })}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      <button className="bg-blue-600 text-white p-2 rounded-lg w-full hover:bg-blue-700 transition">Save Changes</button>
    </div>
    </div>
  );
};

export default Settings;
