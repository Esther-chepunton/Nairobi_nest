import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("authToken"); // Check login

  return isAuthenticated ? children : <Navigate to="/auth" />;
};

export default PrivateRoute;
