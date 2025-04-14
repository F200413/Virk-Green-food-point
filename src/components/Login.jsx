import React, { useState } from 'react';
import './Login.css';
// Import your video - adjust the path as needed
import backgroundVideo from '../assets/video.mp4';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check credentials
    if (email === 'admin@gmail.com' && password === 'virk0912') {
      // Successful login
      onLogin(true);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      // Failed login
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <video className="background-video" autoPlay loop muted>
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="overlay"></div>
      <div className="login-card">
        <div className="login-header">
          <h1>ورک گرین فوڈ پوائنٹ</h1>
          <p>Welcome back! Please login to your account</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
          
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login; 