import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import './Header.css';
import { logout } from "../../services/authService";

const Header = () => {
    const isLoggedIn = !!localStorage.getItem('access')
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = ()=>{
        logout(navigate)
    }

    return (
        <header className="header">
          <h1><Link className="logo-link" to= "/">RunSafe</Link></h1>
          <ul className="nav-list">
            {isLoggedIn && (
              <li className="profile-dropdown">
                <img
                    src="/profile.png"
                    className="profile-icon"
                    onClick={() => setMenuOpen(prev => !prev)}
                />
                {menuOpen && (
                  <ul className="dropdown-menu">
                    <li><Link to="/profile">Profile</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </header>
    )
}

export default Header;
