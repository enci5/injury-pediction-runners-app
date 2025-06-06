import { useState } from 'react';
import LoginForm from '../../components/LoginForm/LoginForm';
import SignupForm from '../../components/SignupForm/SignupForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div >
      <h1>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
      
      {isLogin ? <LoginForm /> : <SignupForm />}

      <button onClick={toggleMode}>
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
};

export default AuthPage;
