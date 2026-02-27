import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';

function AuthRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-[#5B2D8E]">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/register" element={<Auth type="register" />} />

        {/* Protected Routes */}
        <Route element={<AuthRoute><Layout /></AuthRoute>}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreatePost />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
