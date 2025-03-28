import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landingpage.css';  
const LandingPage = () => {
  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">SecureNotes</div>
        {/* <Link to="/login" className="btn">Login</Link> */}
      </nav>
      <div className="head">
        <h1>Your Notes, <span className="highlight">Secured</span> with Google Authenticator</h1>
        <p>Keep your personal notes truly private with our powerful note-taking  protected by two-factor authentication.</p>

        <div className="button">
          <Link to="/login" className="btn">Get Started</Link>
        </div>
      </div>

      <div className="authenticator">
        <div className="secure">
          <h3> My Secure Notes</h3>
          <div className="note">Meeting notes</div>
          <div className="note">Project ideas</div>
          <div className="note">Personal journal</div>
        </div>
        <div className="auth">
          <h4>Google Authenticator</h4>
          <p className="otp">*** ***</p>
        </div>
      </div>

      <div className="features">
        <h2>Key Features</h2>
        <div className="features-container">
          <div className="card">
            <div className="content">
              <h3>Two-Factor Security</h3>
              <p>Protect your notes with Google Authenticator's time-based one-time passwords.</p>
            </div>
          </div>
          <div className="card">
            <div className="content">
              <h3>Text Editor</h3>
              <p>Format your notes with Add, delete, edit for better organization.</p>
            </div>
          </div>
          <div className="card">
            <div className="content">
              <h3>Organised Collections</h3>
              <p>Keep your notes organised with custumisable categories.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
