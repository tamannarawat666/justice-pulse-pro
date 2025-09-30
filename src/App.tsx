import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import FileCase from "./pages/FileCase";
import Lawyers from "./pages/Lawyers";
import CourtTracker from "./pages/CourtTracker";
import Documents from "./pages/Documents";
import Complaint from "./pages/Complaint";
import LegalAwareness from "./pages/LegalAwareness";
import Dashboard from "./pages/Dashboard";
import NotFoundPage from "./pages/NotFoundPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/lawyers" element={<Lawyers />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/complaint" element={<Complaint />} />
                <Route path="/awareness" element={<LegalAwareness />} />
                <Route 
                  path="/file-case" 
                  element={
                    <ProtectedRoute>
                      <FileCase />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tracker" 
                  element={
                    <ProtectedRoute>
                      <CourtTracker />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
