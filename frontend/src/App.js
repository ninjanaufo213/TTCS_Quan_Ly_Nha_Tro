import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import TenantLayout from './components/TenantLayout';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import RoomApproval from './pages/admin/RoomApproval';
import UserManagement from './pages/admin/UserManagement';
import AreaStats from './pages/admin/AreaStats';
import TenantRoomInfo from './pages/tenant/TenantRoomInfo';
import TenantContractInfo from './pages/tenant/TenantContractInfo';
import TenantServicesInfo from './pages/tenant/TenantServicesInfo';
import TenantAssetsInfo from './pages/tenant/TenantAssetsInfo';
import authService from './services/authService';

// Landlord Route Component (block TENANT)
const LandlordRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    const role = authService.getUserRole();
    if (role === 'tenant' || role === 'TENANT') {
        return <Navigate to="/tenant/my-rental" replace />;
    }
    if (role === 'admin' || role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
    }
    return children;
};

// Tenant Route Component (only TENANT)
const TenantRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    const role = authService.getUserRole();
    if (role !== 'tenant' && role !== 'TENANT') {
        return <Navigate to="/app/dashboard" replace />;
    }
    return children;
};

// Admin Route Component (only ADMIN role)
const AdminRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    const role = authService.getUserRole();
    if (role !== 'admin' && role !== 'ADMIN') {
        if (role === 'tenant' || role === 'TENANT') return <Navigate to="/tenant/my-rental" replace />;
        return <Navigate to="/app/dashboard" replace />;
    }
    return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
    if (authService.isAuthenticated()) {
        const role = authService.getUserRole();
        if (role === 'admin' || role === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (role === 'tenant' || role === 'TENANT') {
            return <Navigate to="/tenant/my-rental" replace />;
        } else {
            return <Navigate to="/app/dashboard" replace />;
        }
    }
    return children;
};

const LandlordAppIndexRedirect = () => {
    const role = authService.getUserRole();
    if (role === 'tenant' || role === 'TENANT') {
        return <Navigate to="/tenant/my-rental" replace />;
    }
    return <Navigate to="/app/dashboard" replace />;
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

                        {/* Landlord / Tenant routes */}
                        <Route
                            path="/app"
                            element={
                                <LandlordRoute>
                                    <Layout />
                                </LandlordRoute>
                            }
                        >
                            <Route index element={<LandlordAppIndexRedirect />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="houses" element={<Houses />} />
                            <Route path="rooms" element={<Rooms />} />
                            <Route path="contracts" element={<Contracts />} />
                            <Route path="invoices" element={<Invoices />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="profile" element={<Profile />} />
                        </Route>

                        {/* Tenant routes */}
                        <Route
                            path="/tenant"
                            element={
                                <TenantRoute>
                                    <TenantLayout />
                                </TenantRoute>
                            }
                        >
                            <Route index element={<Navigate to="/tenant/room-info" replace />} />
                            <Route path="room-info" element={<TenantRoomInfo />} />
                            <Route path="contract" element={<TenantContractInfo />} />
                            <Route path="services" element={<TenantServicesInfo />} />
                            <Route path="assets" element={<TenantAssetsInfo />} />
                        </Route>

                        {/* Admin routes */}
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute>
                                    <AdminLayout />
                                </AdminRoute>
                            }
                        >
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="room-approval" element={<RoomApproval />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="area-stats" element={<AreaStats />} />
                        </Route>
                    </Routes>
                </Router>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;
