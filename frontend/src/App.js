import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AvocatDashboard from './pages/AvocatDashboard';
import AssociationDashboard from './pages/DashboardAssociation';
import AddBeneficiaireForm from './components/AddBeneficiaireForm';  
  


function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/avocat/dashboard" element={<AvocatDashboard />} />
          <Route path="/association/dashboard" element={<AssociationDashboard />} />
          <Route path="/components/AddBeneficiaireForm" element={<AddBeneficiaireForm />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
