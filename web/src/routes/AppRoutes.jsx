
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import VerifyEmail from '../pages/VerifyEmail/VerifyEmail';
import Dashboard from '../pages/Dashboard/Dashboard';

const AppRoutes = () => (
    <Routes>
        <Route path="/login" element={
            <PublicRoute>
                <Login />
            </PublicRoute>
        } />

        <Route path="/register" element={
            <PublicRoute>
                <Register />
            </PublicRoute>
        } />

        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/dashboard" element={
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default AppRoutes;
