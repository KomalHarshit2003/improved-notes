import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the authentication context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any
// child component that calls useAuth().
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for the authentication token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token validity with the server
      fetch('http://localhost:5001/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setCurrentUser(data.user);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error verifying token:', error);
        localStorage.removeItem('authToken');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = (token, user) => {
    localStorage.setItem('authToken', token);
    setCurrentUser(user);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}