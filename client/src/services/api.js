import axios from 'axios';

const API_URL = 'http://localhost:3000/api';   // Adjust according to your backend

// ✅ OTP APIs
export const requestOtp = (email) => axios.post(`${API_URL}/auth/request-otp`, { email });
export const loginUser = (data) => axios.post(`${API_URL}/auth/login`, data);

// ✅ Notes APIs
export const getNotes = (token) => axios.get(`${API_URL}/notes`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const createNote = (data, token) => axios.post(`${API_URL}/notes`, data, {
  headers: { Authorization: `Bearer ${token}` }
});

// ✅ Add the missing `deleteNote` function
export const deleteNote = (id, token) => axios.delete(`${API_URL}/notes/${id}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// ✅ Add the missing `registerUser` function
export const registerUser = (userData) => axios.post(`${API_URL}/auth/register`, userData);
