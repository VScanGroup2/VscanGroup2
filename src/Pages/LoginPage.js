<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ignacio Lacson Arroyo Memorial Hospital - Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            height: 100vh;
            overflow: hidden;
        }

        .container {
            position: relative;
            width: 100%;
            height: 100vh;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><rect fill="%23c9d6d4" width="1920" height="1080"/></svg>');
            background-size: cover;
            background-position: center;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(16, 124, 103, 0.3), rgba(16, 124, 103, 0.5));
        }

        .header {
            position: absolute;
            top: 0;
            width: 100%;
            background-color: #107c67;
            padding: 20px;
            text-align: center;
            z-index: 10;
        }

        .header h1 {
            color: white;
            font-size: 2.5rem;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .content {
            position: relative;
            z-index: 5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding-top: 80px;
        }

        .welcome {
            font-size: 5rem;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 60px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .form-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            width: 100%;
            max-width: 600px;
            padding: 0 20px;
        }

        .input-group {
            position: relative;
        }

        .input-group label {
            display: block;
            color: white;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-group input {
            width: 100%;
            padding: 20px 70px 20px 20px;
            font-size: 1.1rem;
            border: none;
            border-radius: 8px;
            background-color: #19a88a;
            color: white;
            outline: none;
            transition: all 0.3s ease;
        }

        .input-group input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }

        .input-group input:focus {
            background-color: #158c74;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }

        .input-icon {
            position: absolute;
            right: 20px;
            width: 40px;
            height: 40px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .input-icon:hover {
            transform: scale(1.1);
        }

        .input-icon svg {
            width: 24px;
            height: 24px;
            fill: #19a88a;
        }

        .login-btn {
            margin-top: 20px;
            padding: 20px;
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
            background-color: #19a88a;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .login-btn:hover {
            background-color: #158c74;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .login-btn:active {
            transform: translateY(0);
        }

        .message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-size: 1.1rem;
            display: none;
        }

        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="overlay"></div>
        <div class="header">
            <h1>Ignacio Lacson Arroyo Memorial Hospital</h1>
        </div>
        <div class="content">
            <div class="welcome">WELCOME</div>
            <div class="form-container">
                <div class="input-group">
                    <label for="email">Enter Email</label>
                    <div class="input-wrapper">
                        <input type="email" id="email" placeholder="Email Address" required>
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="input-group">
                    <label for="password">Enter Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="password" placeholder="Password" required>
                        <div class="input-icon" id="togglePassword">
                            <svg id="eyeIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <button class="login-btn" id="loginBtn">Log In</button>
                <div class="message" id="message"></div>
            </div>
        </div>
    </div>

    <script>
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        const togglePassword = document.getElementById('togglePassword');
        const eyeIcon = document.getElementById('eyeIcon');
        const message = document.getElementById('message');

        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                eyeIcon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
            } else {
                eyeIcon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
            }
        });

        // Login functionality
        loginBtn.addEventListener('click', function() {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            message.style.display = 'none';

            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }

            // Simulate login (replace with actual authentication)
            simulateLogin(email, password);
        });

        // Enter key support
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function showMessage(text, type) {
            message.textContent = text;
            message.className = 'message ' + type;
            message.style.display = 'block';
        }

        function simulateLogin(email, password) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            // Simulate API call
            setTimeout(() => {
                // Demo credentials (replace with actual authentication)
                if (email === 'admin@hospital.com' && password === 'admin123') {
                    showMessage('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        // Redirect to dashboard or home page
                        console.log('Redirecting to dashboard...');
                        // window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showMessage('Invalid email or password', 'error');
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Log In';
                }
            }, 1000);
        }
    </script>
</body>
</html>