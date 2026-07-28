import { useState } from "react"

function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState("student")

  const BASE = "http://127.0.0.1:5000"

  const handleSubmit = async () => {
    if (isSignup && password.length < 5) {
      alert("Password must be at least 5 characters long")
      return
    }
    const url = isSignup
      ? `${BASE}/auth/signup`
      : `${BASE}/auth/login`

    const body = isSignup
      ? { name, email, password, role }
      : { email, password }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (res.ok) {
      onLogin(data) 
    } else {
      alert(data.message || "Error")
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f0f2f5",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        padding: "40px",
        width: "100%",
        maxWidth: "450px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ 
          color: "#4f5ea0", 
          fontSize: "32px", 
          marginBottom: "8px",
          fontWeight: "700"
        }}>
          ExaMind
        </h1>
        <p style={{ color: "#6c757d", fontSize: "16px" }}>
          {isSignup ? "Create your account" : "Welcome back!"}
        </p>
      </div>
      {isSignup && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#495057",
              fontWeight: "500",
              fontSize: "14px"
            }}>
              Full Name
            </label>
            <input
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4f5ea0"}
              onBlur={(e) => e.target.style.borderColor = "#ced4da"}
            />
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            color: "#495057",
            fontWeight: "500",
            fontSize: "14px"
          }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "16px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "#4f5ea0"}
            onBlur={(e) => e.target.style.borderColor = "#ced4da"}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            color: "#495057",
            fontWeight: "500",
            fontSize: "14px"
          }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "16px",
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "#4f5ea0"}
            onBlur={(e) => e.target.style.borderColor = "#ced4da"}
          />
        </div>

        {isSignup && (
          <div style={{ marginBottom: "25px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#495057",
              fontWeight: "500",
              fontSize: "14px"
            }}>
              I am a
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#4f5ea0",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
            marginBottom: "20px"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#3a56d4"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#4361ee"}
        >
          {isSignup ? "Create Account" : "Sign In"}
        </button>

        <p
          onClick={() => setIsSignup(!isSignup)}
          style={{
            textAlign: "center",
            color: "#4f5ea0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            margin: 0
          }}
        >
          {isSignup
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </p>

      </div>
    </div>
  )
}

export default Login