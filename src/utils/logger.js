// src/utils/logger.js

const isDev = import.meta.env.MODE === "development"; // for Vite
// If using Create React App instead, use: process.env.NODE_ENV === "development"

export const log = (...args) => {
  if (isDev) console.log(...args);
};

export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

export const error = (...args) => {
  if (isDev) console.error(...args);
};
