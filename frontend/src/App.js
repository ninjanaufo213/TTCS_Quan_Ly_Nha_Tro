import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import Login from './pages/public/Login';
import HomePage from './pages/public/HomePage';
import Dashboard from './pages/landlord/Dashboard';
import Houses from './pages/landlord/Houses';
import Rooms from './pages/landlord/Rooms';
import Contracts from './pages/landlord/Contracts';
import Invoices from './pages/landlord/Invoices';
import Reports from './pages/landlord/Reports';
import Register from './pages/public/Register';
import Profile from './pages/Profile';
import authService from './services/authService';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
    if (authService.isAuthenticated()) {
        return <Navigate to="/app/dashboard" replace />;
    }
    return children;
};

function App() {
    return (
        <ConfigProvider locale={viVN}>
            <AntdApp>
                <Router>
                    <Routes>
                        {/* HomePage as default home page */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/app"
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="/app/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />

                            <Route path="houses" element={<Houses />} />
                            <Route path="rooms" element={<Rooms />} />
                            <Route path="contracts" element={<Contracts />} />
                            <Route path="invoices" element={<Invoices />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </Router>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;