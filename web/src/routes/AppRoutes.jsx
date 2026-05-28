import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '../layouts/AppLayout';

import Login from '../pages/auth/Login/Login';
import AcceptInvite from '../pages/auth/AcceptInvite/AcceptInvite';
import VerifyEmail from '../pages/auth/VerifyEmail/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword/ResetPassword';
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import Dashboard from '../pages/mentee/Dashboard/Dashboard';
import LearningWishlist from '../pages/mentee/LearningWishlist/LearningWishlist';
import MembersPage from '../pages/hr/MembersPage/MembersPage';
import InvitationsPage from '../pages/hr/invitations/InvitationsPage';
import ResourceHub from '../pages/common/ResourceHub/ResourceHub';
import Schedule from '../pages/common/Schedule/Schedule';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteForUser } from '../utils/authRoute';

const LegacyRegisterRedirect = () => {
    const location = useLocation();
    return <Navigate to={`/accept-invite${location.search}`} replace />;
};

const HomeRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return <Navigate to={getDefaultRouteForUser(user)} replace />;
};

const AppRoutes = () => (
    <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
            <PublicRoute>
                <Login />
            </PublicRoute>
        } />

        <Route path="/accept-invite" element={
            <PublicRoute>
                <AcceptInvite />
            </PublicRoute>
        } />

        <Route path="/register" element={<LegacyRegisterRedirect />} />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={
            <PublicRoute>
                <ForgotPassword />
            </PublicRoute>
        } />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Private Routes with AppLayout Wrapper */}
        <Route element={<AppLayout />}>
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

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

            <Route path="/members" element={
                <ProtectedRoute allowedRoles={['hr']}>
                    <MembersPage />
                </ProtectedRoute>
            } />

            <Route path="/invitations" element={
                <ProtectedRoute allowedRoles={['hr']}>
                    <InvitationsPage />
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

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default AppRoutes;
