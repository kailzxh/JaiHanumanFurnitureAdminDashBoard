import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Assuming you're using an AuthContext to track login state

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // Access the user from the AuthContext

  // If the user is not logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children; // Render the protected route if the user is logged in
};

export default ProtectedRoute;
