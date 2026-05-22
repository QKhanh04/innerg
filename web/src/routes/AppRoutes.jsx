import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '../layouts/AppLayout';

import Login from '../pages/auth/Login/Login';
import Register from '../pages/auth/Register/Register';
import VerifyEmail from '../pages/auth/VerifyEmail/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword/ResetPassword';
import Dashboard from '../pages/mentee/Dashboard/Dashboard';
import LearningWishlist from '../pages/mentee/LearningWishlist/LearningWishlist';
import ResourceHub from '../pages/common/ResourceHub/ResourceHub';

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
        <Route path="/forgot-password" element={
            <PublicRoute>
                <ForgotPassword />
            </PublicRoute>
        } />
        <Route path="/reset-password" element={<ResetPassword />} />

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
