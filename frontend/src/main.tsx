import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.tsx'
import { HouseholdProvider } from './context/HouseholdProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
          <Routes>
            <Route path='/*' element={<App/>} />
          </Routes>
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
