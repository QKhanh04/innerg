import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '../layouts/AppLayout';

import Login from '../pages/auth/Login/Login';
import Register from '../pages/auth/Register/Register';
import VerifyEmail from '../pages/auth/VerifyEmail/VerifyEmail';
import Dashboard from '../pages/mentee/Dashboard/Dashboard';
import LearningWishlist from '../pages/mentee/LearningWishlist/LearningWishlist';
import ResourceHub from '../pages/common/ResourceHub/ResourceHub';
import Schedule from '../pages/common/Schedule/Schedule';

const AppRoutes = () => (
    <Routes>
        {/* Public Routes */}
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

        {/* Private Routes with AppLayout Wrapper */}
        <Route element={<AppLayout />}>
            <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['mentee']}>
                    <Dashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/wishlist" element={
                <ProtectedRoute allowedRoles={['mentee', 'hr']}>
                    <LearningWishlist />
                </ProtectedRoute>
            } />

            <Route path="/schedule" element={
                <ProtectedRoute allowedRoles={['mentee', 'mentor']}>
                    <Schedule />
                </ProtectedRoute>
            } />

            <Route path="/resources" element={
                <ProtectedRoute allowedRoles={['mentee', 'mentor', 'hr', 'admin']}>
                    <ResourceHub />
                </ProtectedRoute>
            } />
            {/* You can add more protected routes here for other roles */}
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default AppRoutes;
