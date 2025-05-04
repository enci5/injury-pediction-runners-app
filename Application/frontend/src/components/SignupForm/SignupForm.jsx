import { useState } from 'react';
import { signupUser } from '../../services/authService';
import './SignupForm.css'

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage("Passwords don't match.");
      return;
    }

    const { success, data } = await signupUser({username, email, password });
    if(!success){
      //if error then return the error message from backedn
      const firstError = 
        typeof data ==='object'
        // Grab first error message from object
          ? Object.values(data)[0]?.[0] || 'Signup failed'
          : 'Signup failed'
      setMessage(firstError)
      return
    }
    setMessage('Signup successful')
  };

  return (
    <form className='signup-form' onSubmit={handleSignup}>
      <input
        type="string"
        placeholder='Username'
        value={username}
        onChange={(e)=>setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <button type="submit">Sign Up</button>
      <p>{message}</p>
    </form>
  );
};

export default SignupForm;
