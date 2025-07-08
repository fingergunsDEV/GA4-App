// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './App.css';

function LoginPage() {
    return (
        <div className="login-container">
            <h1>Analytics Dashboard</h1>
            <p>Please log in with your Google Account to view your analytics data.</p>
            {/* This link will hit our backend's auth endpoint */}
            <a href="http://localhost:5000/auth/google" className="login-button">
                Login with Google
            </a>
        </div>
    );
}

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
