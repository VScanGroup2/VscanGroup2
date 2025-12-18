import React, { useState, useEffect } from 'react';
import LoginPage from './Pages/LoginPage';
import Dashboard from './Pages/Dashboard';
import { subscribeToAuthState } from './lib/auth';
import './App.css';
// Import diagnostic tool
import './lib/firestoreDiagnostic';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
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
    return <Dashboard onLogout={() => setUser(null)} />;
  }

  return <LoginPage onLogin={(newUser) => setUser(newUser)} />;
}

export default App;