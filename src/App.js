import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Layout from './components/shared/Layout';
import RozanaGahak from './pages/RozanaGahak';
import RozanaGahakList from './pages/RozanaGahakList';
import MahanaGahak from './pages/MahanaGahak';
import RatePage from './pages/RatePage';
import AdvancePayments from './pages/AdvancePayments';
import Suppliers from './pages/Suppliers';
import MonthlyReport from './pages/MonthlyReport';
import PaymentSummary from './pages/PaymentSummary';
import Dashboard from './pages/Dashboard';
import Home from './pages/MahanaGahakFehrist';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('activeSection') || 'billing';
  });
  
  // Check if user is already logged in
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Save active section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  // Render different components based on active section
  const renderActiveSection = () => {
    switch(activeSection) {
      case 'billing':
        return <RozanaGahak />;
      case 'history':
        return <RozanaGahakList />;
      case 'customers':
        return <MahanaGahak />;
      case 'purchaseList':
        return <Home />;
      case 'settings':
        return <RatePage />;
      case 'advancePayments':
        return <AdvancePayments />;
      case 'suppliers':
        return <Suppliers />;
      case 'monthlyReport':
        return <MonthlyReport />;
      case 'paymentSummary':
        return <PaymentSummary />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <RozanaGahak />;
    }
  };

  return (
    <div className="App">
      <Layout 
        onLogout={handleLogout}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      >
        {renderActiveSection()}
      </Layout>
    </div>
  );
}

export default App;
