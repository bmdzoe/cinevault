import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
export default function Navbar() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const handleLogout = async () => {
    await logout()
    showToast('Logged out.', 'success')
  }
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">CINE<span>VAULT</span></Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Discover</Link>
        <Link to="/vault" className="nav-link">The Vault</Link>
        <Link to="/watchlist" className="nav-link">My List</Link>
        {user ? (
          <>
            <span className="nav-username">{user.username}</span>
            <button className="btn-ghost" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-ghost">Log In</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}