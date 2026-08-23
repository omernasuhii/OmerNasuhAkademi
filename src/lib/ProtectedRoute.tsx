import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, userData, realUserData, isAdmin, systemSettings, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  // If real user is admin, allow full access to all panels and bypass registration/verification blocks
  if (isAdmin || realUserData?.role === "admin") {
    return children;
  }

  // If the user profile (userData) is null/missing or uninitialized, they must register or log in.
  if (!userData || !userData.role) {
    return <Navigate to="/giris" replace />;
  }

  // If the user has an incomplete registration or missing phone number, they must complete it first.
  if (
    userData &&
    userData.role === "student" &&
    (!userData.registrationStep || userData.registrationStep < 4 || !userData.phone)
  ) {
    if (location.pathname !== "/kayit-tamamla") {
      return <Navigate to="/kayit-tamamla" replace />;
    }
    return children;
  }

  // If phone verification is false (not verified) in database, demand verification unless admin or bypass enabled
  if (
    userData &&
    userData.role !== "admin" &&
    !systemSettings?.bypassVerification &&
    (userData.phoneVerified === false || !userData.phoneVerified) &&
    location.pathname !== "/dogrulama" &&
    location.pathname !== "/kayit-tamamla"
  ) {
    return <Navigate to="/dogrulama" replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  if (
    userData &&
    userData.role === "coach" &&
    (userData.approved === false || userData.approved === "rejected")
  ) {
    if (location.pathname !== "/koc-onay-bekliyor") {
      return <Navigate to="/koc-onay-bekliyor" replace />;
    }
  }

  return children;
}
