import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Tracks from "@/pages/Tracks";
import TrackDetail from "@/pages/TrackDetail";
import Lesson from "@/pages/Lesson";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Assessment from "@/pages/Assessment";
import Studio from "@/pages/Studio";
import NotFound from "@/pages/NotFound";
import Review from "@/pages/Review";
import Glossary from "@/pages/Glossary";
import Leaderboard from "@/pages/Leaderboard";
import Certificate from "@/pages/Certificate";
import Admin from "@/pages/Admin";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-12 soa-mono text-sm">LOADING…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/tracks/:trackId" element={<TrackDetail />} />
          <Route path="/lessons/:lessonId" element={<Lesson />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/certificates/:trackId" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
        <Toaster position="top-right" toastOptions={{ className: "soa-mono" }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
