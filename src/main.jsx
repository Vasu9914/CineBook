import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clean up any legacy or stale entity data from localStorage
// Only auth tokens (cinebook_jwt_token, cinebook_user_data) are preserved
const legacyKeys = [
  'cinebook_movies',
  'cinebook_theatres',
  'cinebook_screens',
  'cinebook_shows',
  'cinebook_bookings',
  'cinebook_notifications',
  'cinebook_holds',
  'cinebook_payments'
];
legacyKeys.forEach((key) => localStorage.removeItem(key));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
