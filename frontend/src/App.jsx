import { useState, useEffect } from "react"
import InstructorDashboard from "./dashboards/InstructorDashboard"
import StudentDashboard from "./dashboards/StudentDashboard"
import Login from "./components/auth/Login"
import "./App.css"

function App() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState("dashboard")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div style={appStyle}>
      <nav style={navStyle}>
        <div style={navLeftStyle}>
          <span style={logoStyle}>ExaMind</span>
          <div style={navLinksStyle}>
            <button
              onClick={() => setCurrentView("dashboard")}
              style={navLinkStyle(currentView === "dashboard")}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("rooms")}
              style={navLinkStyle(currentView === "rooms")}
            >
              Rooms
            </button>
            {user.role === "instructor" && (
              <button
                onClick={() => setCurrentView("analytics")}
                style={navLinkStyle(currentView === "analytics")}
              >
                Analytics
              </button>
            )}
            {user.role === "student" && (
              <>
              <button
                onClick={() => setCurrentView("practice")}
                style={navLinkStyle(currentView === "practice")}
              >
                Practice
              </button>
              <button
                onClick={() => setCurrentView("analytics")}
                style={navLinkStyle(currentView === "analytics")}
              >
              Analytics
              </button>
            </>
            )}
          </div>
        </div>
        <div style={navRightStyle}>
          <span style={userNameStyle}>{user.name}</span>
          <span style={roleBadgeStyle(user.role)}>{user.role}</span>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </nav>

      <main style={mainStyle}>
        {user.role === "instructor" ? (
          <InstructorDashboard user={user} currentView={currentView} />
        ) : (
          <StudentDashboard user={user} currentView={currentView} />
        )}
      </main>
    </div>
  )
}

const colors = {
  primary: '#7071ae',
  secondary: '#f88397',
  primaryLight: '#e0e7ff',
  secondaryLight: '#ffe4e6',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  background: '#f9fafb'
}

const appStyle = {
  minHeight: '100vh',
  backgroundColor: colors.background
}

const navStyle = {
  backgroundColor: colors.surface,
  padding: '0 32px',
  height: '64px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${colors.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 100
}

const navLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '48px'
}

const logoStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: colors.primary,
  letterSpacing: '-0.3px'
}

const navLinksStyle = {
  display: 'flex',
  gap: '8px'
}

const navLinkStyle = (isActive) => ({
  padding: '8px 16px',
  backgroundColor: isActive ? colors.primaryLight : 'transparent',
  color: isActive ? colors.primary : colors.textLight,
  border: 'none',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s'
})

const navRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}

const userNameStyle = {
  fontSize: '14px',
  color: colors.text,
  fontWeight: '500'
}

const roleBadgeStyle = (role) => ({
  padding: '4px 12px',
  backgroundColor: role === 'instructor' ? colors.primaryLight : colors.secondaryLight,
  color: role === 'instructor' ? colors.primary : colors.secondary,
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'capitalize'
})

const logoutButtonStyle = {
  padding: '6px 16px',
  backgroundColor: 'transparent',
  color: colors.textLight,
  border: `1px solid ${colors.border}`,
  borderRadius: '20px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const mainStyle = {
  padding: '32px',
  maxWidth: '1200px',
  margin: '0 auto'
}

export default App