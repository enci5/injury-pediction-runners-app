import { useState } from 'react';
import { loginUser } from '../../services/authService';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { success, data } = await loginUser({ username, password });
    setMessage(data.message || (success ? 'Login successful!' : 'Login failed.'));
  };

  return (
    <form onSubmit={handleLogin}>
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
      <p>{message}</p>
    </form>
  );
};

export default LoginForm;
