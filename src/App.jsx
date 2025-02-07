import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; 
import AdminDashboard from './admins/dashboard';
import ProductUploader from './admins/product';
import Quotes from './admins/quotes';
import TeamHandler from './admins/team';
import ProfileAdmin from './admins/profile';
import AdminTable from './admins/admins';
import Header from './components/Header'; 
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminGallery from './admins/gallery';
import AdminStories from './admins/stories';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductUploader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stories"
              element={
                <ProtectedRoute>
                  <AdminStories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <AdminGallery/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotes"
              element={
                <ProtectedRoute>
                  <Quotes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <TeamHandler />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiles"
              element={
                <ProtectedRoute>
                  <ProfileAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admins"
              element={
                <ProtectedRoute>
                  <AdminTable />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}
export default App;
