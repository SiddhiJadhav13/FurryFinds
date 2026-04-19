import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getAuthHeader = () => {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("verifies_sb_token") || localStorage.getItem("verifies_token");
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};
