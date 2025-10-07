import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import '../Styles/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Add this line

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = (e) => {
    e.preventDefault();
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

    // Simulate login (replace with your actual authentication logic)
    setTimeout(() => {
      setLoading(false);
      setMessage('Login successful!');
      setMessageType('success');
      
      // Navigate to home page after successful login
      setTimeout(() => {
        navigate('/home'); // Add this line
      }, 1000);
    }, 1500);
  };

  // Rest of your component...
};

export default LoginPage;
