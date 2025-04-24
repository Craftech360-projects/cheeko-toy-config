import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthForm } from './components/AuthForm';
import { ToyList } from './components/ToyList';
import { AddToy } from './components/AddToy';
import { ToySettings } from './components/ToySettings';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (error) {
        toast.error(errorDescription || 'Authentication failed');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  return null;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-center" />
      <HashRouter>
        <AuthCallback />
        <Routes>
          <Route
            path="/"
            element={
              session ? <ToyList /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={
              !session ? <AuthForm /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/add-toy"
            element={
              session ? <AddToy /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/toy/:id/settings"
            element={
              session ? <ToySettings /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/admin"
            element={
              session ? <AdminDashboard /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </HashRouter>
    </>
  );
}