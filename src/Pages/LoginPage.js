import React, { useState } from 'react';
import '../Styles/LoginPage.css';
import bg from '../Styles/bg.png';
import Dashboard from './Dashboard';
import { signIn } from '../lib/auth';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setMessage('');
    setMessageType('');

    if (!email || !password) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      setMessage('Login successful!');
      setMessageType('success');
      setTimeout(() => onLogin(), 1000);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px 40px', borderRadius: '10px', marginBottom: '40px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>IGNACIO LACSON ARROYO SR. MEMORIAL DISTRICT HOSPITAL</h1>
      </div>

      <div style={{ background: 'white', borderRadius: '15px', padding: '50px 60px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', maxWidth: '500px', width: '100%' }}>
        <h2 style={{ fontSize: '3em', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', color: '#333' }}>WELCOME</h2>

        <div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '1.1em', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={handleKeyPress} autoComplete="email" style={{ width: '100%', padding: '15px 50px 15px 15px', fontSize: '1.1em', border: '2px solid #ddd', borderRadius: '8px', outline: 'none', transition: 'border-color 0.3s', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '1.1em', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} autoComplete="current-password" style={{ width: '100%', padding: '15px 50px 15px 15px', fontSize: '1.1em', border: '2px solid #ddd', borderRadius: '8px', outline: 'none', transition: 'border-color 0.3s', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
              <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', fill: '#1a8f6f', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                  {showPassword ? <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/> : <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>}
                </svg>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', background: messageType === 'success' ? '#d4edda' : '#f8d7da', color: messageType === 'success' ? '#155724' : '#721c24', border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}` }}>{message}</div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '18px', fontSize: '1.3em', fontWeight: 'bold', color: 'white', background: loading ? '#999' : 'linear-gradient(135deg, #1a8f6f 0%, #22a885 100%)', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'transform 0.2s, background 0.3s', boxShadow: '0 4px 15px rgba(26,143,111,0.3)' }} onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')} onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
