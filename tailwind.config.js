/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',        // Deep corporate blue
        primaryHover: '#1D4ED8',
        secondary: '#2563EB',
        background: '#F9FAFB',     // Light neutral background
        card: '#FFFFFF',           // White for panels/cards
        border: '#E5E7EB',         // Subtle border gray
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
}
