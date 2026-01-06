import React, { useState, useEffect } from 'react';
import LoginPage from './Pages/LoginPage';
import Dashboard from './Pages/Dashboard';
import SecurityDashboard from './Pages/SecurityDashboard';
import { subscribeToAuthState } from './lib/auth';
import './App.css';
// Import diagnostic tool
import './lib/firestoreDiagnostic';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Get role from localStorage
        const role = localStorage.getItem('userRole');
        console.log('User logged in:', currentUser.email, 'Role from localStorage:', role);
        if (role) {
          setUserRole(role);
        }
      } else {
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.5em', color: '#1a8f6f' }}>
        Loading...
      </div>
    );
  }

  if (user) {
    // Route based on user role
    console.log('Current userRole state:', userRole);
    if (userRole === 'security') {
      console.log('Rendering SecurityDashboard');
      return <SecurityDashboard onLogout={() => { 
        setUser(null); 
        setUserRole(null);
        localStorage.removeItem('userRole');
      }} />;
    }
    console.log('Rendering Admin Dashboard');
    return <Dashboard onLogout={() => { 
      setUser(null); 
      setUserRole(null);
      localStorage.removeItem('userRole');
    }} />;
  }

  return <LoginPage onLogin={(newUser) => setUser(newUser)} />;
}

export default App;