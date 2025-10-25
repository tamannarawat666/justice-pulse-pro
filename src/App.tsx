import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatAssistant from "@/components/ChatAssistant";
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
import AISummarizer from "./pages/AISummarizer";
import NotFoundPage from "./pages/NotFoundPage";
import CommunityForum from "./pages/CommunityForum";

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
                <Route path="/awareness" element={<LegalAwareness />} />
                <Route 
                  path="/cases" 
                  element={
                    <ProtectedRoute>
                      <Cases />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cases/:id" 
                  element={
                    <ProtectedRoute>
                      <CaseDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lawyers" 
                  element={
                    <ProtectedRoute>
                      <Lawyers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/documents" 
                  element={
                    <ProtectedRoute>
                      <Documents />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/complaint" 
                  element={
                    <ProtectedRoute>
                      <Complaint />
                    </ProtectedRoute>
                  } 
                />
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
                <Route 
                  path="/ai-summarizer" 
                  element={
                    <ProtectedRoute>
                      <AISummarizer />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/community" 
                  element={
                    <ProtectedRoute>
                      <CommunityForum />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <ChatAssistant />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
