import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Lab1App from './lab1/Lab1App'
import Lab2App from './lab2/Lab2App'
import './index.css'

function LabSelector() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Control Labs</h1>
        <p className="text-gray-600 text-sm mb-6">Choose a lab to start.</p>
        <div className="space-y-3">
          <Link
            to="/lab/1"
            className="block w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-center transition-colors"
          >
            Lab 1 — Unprotected Admin Panel
          </Link>
          <Link
            to="/lab/2"
            className="block w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 text-center transition-colors"
          >
            Lab 2 — IDOR &amp; My Account (Lab ID 6)
          </Link>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LabSelector />} />
        <Route path="/lab/1/*" element={<Lab1App />} />
        <Route path="/lab/2/post/:postId" element={<Lab2App />} />
        <Route path="/lab/2/*" element={<Lab2App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
