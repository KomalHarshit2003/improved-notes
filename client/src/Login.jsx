import "./Login.css";
import { useEffect, useState } from "react";

function Login() {
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Tab switching functionality
        document.getElementById('login-tab').addEventListener('click', function () {
            document.getElementById('login-tab').classList.add('active');
            document.getElementById('register-tab').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
            document.getElementById('register-form').classList.remove('active');
        });

        document.getElementById('register-tab').addEventListener('click', function () {
            document.getElementById('register-tab').classList.add('active');
            document.getElementById('login-tab').classList.remove('active');
            document.getElementById('register-form').classList.add('active');
            document.getElementById('login-form').classList.remove('active');
        });

        // Setup key verification
        document.getElementById('setup-key-input').addEventListener('input', function () {
            const setupKey = this.value.trim();
            if (setupKey) {
                document.getElementById('setup-key-display').textContent = setupKey;
                document.getElementById('setup-key-display').style.display = 'block';
                document.getElementById('qr-info').style.display = 'block';
            }
        });
    }, [])

    function showMessage(elementId, message, type) {
        const messageElement = document.getElementById(elementId);
        messageElement.textContent = message;
        messageElement.className = 'message ' + type;
        messageElement.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5001);
        }
    }

    function register(e) {
        e.preventDefault()

        const email = document.getElementById('register-email').value;

        if (!email) {
            showMessage('register-message', 'Please enter your email', 'error');
            return;
        }

        // Send registration request to server
        fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('register-message', 'Registration initiated! Please check your email for the setup key.', 'success');
                    document.getElementById('setup-container').style.display = 'block';
                    document.getElementById('register').style.display = 'none';
                } else {
                    showMessage('register-message', data.message || 'Registration failed. Please try again.', 'error');
                }
            })
            .catch(error => {
                showMessage('register-message', 'Server error. Please try again later.', 'error');
                console.error('Error:', error);
            });
    }

    function verifySetup(e) {
        e.preventDefault()
        const email = document.getElementById('register-email').value;
        const setupKey = document.getElementById('setup-key-input').value;
        const totpCode = document.getElementById('verify-totp').value;

        if (!setupKey || !totpCode) {
            showMessage('register-message', 'Please enter both the setup key and verification code', 'error');
            return;
        }

        if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
            showMessage('register-message', 'TOTP code must be 6 digits', 'error');
            return;
        }

        // Send verification request to server
        fetch('http://localhost:5001/api/verify-setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                setupKey: setupKey,
                totp: totpCode
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('register-message', 'TOTP setup verified successfully! You can now login.', 'success');
                    document.getElementById('setup-container').style.display = 'none';

                    // Show login link
                    document.getElementById('redirect-link').innerHTML = '<a href="#" id="goto-login">Go to login</a>';
                    document.getElementById('goto-login').addEventListener('click', function (e) {
                        e.preventDefault();
                        document.getElementById('login-tab').click();
                    });
                } else {
                    showMessage('register-message', data.message || 'Verification failed. Please check your setup key and TOTP code.', 'error');
                }
            })
            .catch(error => {
                showMessage('register-message', 'Server error. Please try again later.', 'error');
                console.error('Error:', error);
            });
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const totp = document.getElementById('login-totp').value;

        if (!email || !totp) {
            showMessage('login-message', 'Please fill in all fields', 'error');
            return;
        }

        if (totp.length !== 6 || !/^\d+$/.test(totp)) {
            showMessage('login-message', 'TOTP code must be 6 digits', 'error');
            return;
        }

        // Send login request to the server
        fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                totp: totp
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store email in local storage for welcome message
                    localStorage.setItem('userEmail', email);
                    showMessage('login-message', 'Login successful! Redirecting...', 'success');
                    // In a real app, redirect to dashboard or set auth token
                    setTimeout(() => {
                        window.location.href = '/notes';
                    }, 1500);
                } else {
                    showMessage('login-message', data.message || 'Login failed. Please check your email and TOTP code.', 'error');
                }
            })
            .catch(error => {
                showMessage('login-message', 'Server error. Please try again later.', 'error');
                console.error('Error:', error);
            });
    }

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="tabs">
                    <div className="tab active" id="login-tab">Login</div>
                    <div className="tab" id="register-tab">Register</div>
                </div>

                <div className="form-container active" id="login-form">
                    <h1>Login</h1>
                    <form id="login" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="login-email">Email</label>
                            <input type="email" id="login-email" required placeholder="Enter your email" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-totp">Google Authenticator Code</label>
                            <input type="text" id="login-totp" required placeholder="6-digit code from Google Authenticator" maxLength="6" pattern="[0-9]{6}" />
                        </div>
                        <button type="submit" className="login-button">Login</button>
                    </form>
                    <div className="message" id="login-message"></div>
                </div>

                <div className="form-container" id="register-form">
                    <h1>Register</h1>
                    <form id="register" onSubmit={register}>
                        <div className="form-group">
                            <label htmlFor="register-email">Email</label>
                            <input type="email" id="register-email" required placeholder="Enter your email" />
                        </div>
                        <button type="submit" className="login-button">Register</button>
                    </form>
                    <div className="message" id="register-message"></div>

                    <div id="setup-container" style={{ display: "none" }}>
                        <h2>Setup Google Authenticator</h2>
                        <p>We've sent a setup key to your email. Please check your inbox and enter the setup key below:</p>
                        <div className="form-group">
                            <label htmlFor="setup-key-input">Setup Key</label>
                            <input type="text" id="setup-key-input" placeholder="Enter setup key from your email" />
                        </div>
                        <div className="setup-key" id="setup-key-display"></div>
                        <div className="qr-info" id="qr-info">
                            <p>1. Install Google Authenticator app on your smartphone</p>
                            <p>2. Open the app and tap + to add a new account</p>
                            <p>3. Select "Enter setup key"</p>
                            <p>4. Enter your email as the account name and the setup key above</p>
                            <p>5. After adding the account, enter the 6-digit code from the app below to complete setup</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="verify-totp">Verification Code</label>
                            <input type="text" id="verify-totp" placeholder="6-digit code from Google Authenticator" maxLength="6" pattern="[0-9]{6}" />
                        </div>
                        <button id="verify-button" className="login-button" onClick={verifySetup} >Complete Setup</button>
                    </div>
                </div>

                <div className="redirect-link" id="redirect-link"></div>
            </div>
        </div>
    )
}

export default Login