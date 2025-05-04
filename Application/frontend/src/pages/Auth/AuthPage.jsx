import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '../../components/LoginForm/LoginForm';
import SignupForm from '../../components/SignupForm/SignupForm';
import './AuthPage.css'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const token = localStorage.getItem('access');
  if (token) {
    return <Navigate to="/" replace />;
  }

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">
          {isLogin 
          ? 'Welcome Back! Sign in to view recent activity' 
          : 'Create an Account'}
        </h1>
        
        <div className="auth-form-wrapper">
          {isLogin ? <LoginForm /> : <SignupForm />}
        </div>

        <button className="auth-toggle-btn" onClick={toggleMode}>
          {isLogin 
          ? "Don't have an account? Sign up" 
          : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
