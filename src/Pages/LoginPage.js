import React, { useState } from 'react';
import '../Styles/LogInPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);

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
            setMessage('Please enter a valid email address');
            setMessageType('error');
            return;
        }

        setLoading(true);

        setTimeout(() => {
            if (email === 'admin@hospital.com' && password === 'admin123') {
                setMessage('Login successful! Redirecting...');
                setMessageType('success');
                setTimeout(() => {
                    // Redirect to dashboard or home page
                    // window.location.href = '/dashboard';
                }, 1500);
            } else {
                setMessage('Invalid email or password');
                setMessageType('error');
                setLoading(false);
            }
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    };

    return (
        <div className="container">
            <div className="overlay"></div>
            <div className="header">
                <h1>Ignacio Lacson Arroyo Memorial Hospital</h1>
            </div>
            <div className="content">
                <div className="welcome">WELCOME</div>
                <form className="form-container" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">Enter Email</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                id="email"
                                placeholder="Email Address"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <div className="input-icon">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Enter Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <div
                                className="input-icon"
                                id="togglePassword"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <svg id="eyeIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    {showPassword ? (
                                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                    ) : (
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    )}
                                </svg>
                            </div>
                        </div>
                    </div>
                    <button
                        className="login-btn"
                        id="loginBtn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                    {message && (
                        <div className={`message ${messageType}`} id="message">
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;