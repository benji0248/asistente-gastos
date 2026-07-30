import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.tsx'
import { AppDataProvider } from './context/AppDataProvider.tsx'
import { PrivacyAmountsProvider } from './context/PrivacyAmountsProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <PrivacyAmountsProvider>
            <Routes>
              <Route path='/*' element={<App/>} />
            </Routes>
          </PrivacyAmountsProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
