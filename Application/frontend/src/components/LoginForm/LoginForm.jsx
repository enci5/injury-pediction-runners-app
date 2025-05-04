import { useState } from 'react';
import { loginUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css'

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { success, message } = await loginUser({ username, password });
    if (!success) {
      setMessage(message);
      return;
    }
    setMessage('Login successful')
    navigate('/')
    }

  return (
    <form className='login-form' onSubmit={handleLogin}>
      <input
        type="string"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Log In</button>
      {message && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {message}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
