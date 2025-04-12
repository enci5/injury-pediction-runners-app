import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/Auth/AuthPage';
import './App.css';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
