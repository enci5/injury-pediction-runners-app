import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/Auth/AuthPage';
import HomePage from './pages/Home/HomePage'
import Header from './components/Header/Header'
import './App.css';

function App() {

  return (
    <>
    <Router>
      <Header />
      <div className="main-content">
        <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path='/'element={<HomePage/>}/>
      </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
