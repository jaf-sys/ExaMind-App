import { useState, useEffect } from "react"

function RoomMembers({ roomId, currentUser }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchMembers()
  }, [roomId])

  const fetchMembers = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BASE}/room/${roomId}/members?user_id=${currentUser.user_id}`)
      const data = await res.json()
      
      if (res.ok) {
        setMembers(data)
      } else {
        setError(data.error || "Failed to fetch members")
      }
    } catch (error) {
      console.error("Error fetching members:", error)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        Loading members...
      </div>
    )
  }

  if (error) {
    return (
      <div style={errorStyle}>
        {error}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div style={emptyStyle}>
        No members in this room
      </div>
    )
  }

  const instructors = members.filter(m => m.role === "instructor")
  const students = members.filter(m => m.role === "student")

  const MemberRow = ({ member }) => (
    <div 
      style={{
        ...memberRowStyle,
        backgroundColor: member.user_id === currentUser.user_id ? '#f8fafc' : 'transparent'
      }}
    >
      <div style={memberAvatarStyle}>
        {member.name.charAt(0).toUpperCase()}
      </div>
      
      <div style={memberNameStyle}>
        {member.name}
        {member.user_id === currentUser.user_id && (
          <span style={youBadgeStyle}>You</span>
        )}
      </div>

      <div style={memberEmailStyle}>{member.email}</div>

      <div style={memberDateStyle}>
        Joined {formatDate(member.joined_at)}
      </div>

      {member.role === "instructor" && (
        <span style={roleBadgeStyle}>Instructor</span>
      )}
    </div>
  )

  return (
    <div style={containerStyle}>
      {instructors.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            Instructors ({instructors.length})
          </h4>
          <div style={membersListStyle}>
            {instructors.map(member => (
              <MemberRow key={member.user_id} member={member} />
            ))}
          </div>
        </div>
      )}

      {students.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            Students ({students.length})
          </h4>
          <div style={membersListStyle}>
            {students.map(member => (
              <MemberRow key={member.user_id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
}

const loadingStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "14px"
}

const errorStyle = {
  padding: "16px",
  textAlign: "center",
  color: "#b91c1c",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
  fontSize: "14px"
}

const emptyStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "14px",
  fontStyle: "italic"
}

const sectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
}

const sectionTitleStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  margin: 0,
  letterSpacing: "0.3px",
  textTransform: "uppercase"
}

const membersListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}

const memberRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  border: "1px solid transparent",
  transition: "background-color 0.2s"
}

const memberAvatarStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  backgroundColor: "#f1f4f9",
  color: "#334155",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "500",
  fontSize: "13px",
  border: "1px solid #e2e8f0",
  flexShrink: 0
}

const memberNameStyle = {
  minWidth: "120px",
  color: "#1e293b",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexShrink: 0
}
const youBadgeStyle = {
  fontSize: "11px",
  fontWeight: "500",
  color: "#7071ae",
  backgroundColor: "#eff6ff",
  padding: "2px 6px",
  borderRadius: "12px"
}

const memberEmailStyle = {
  minWidth: "180px",
  color: "#94a3b8",
  fontSize: "13px",
  flexShrink: 0
}

const memberDateStyle = {
  minWidth: "120px",
  color: "#94a3b8",
  fontSize: "12px",
  flexShrink: 0
}

const roleBadgeStyle = {
  fontSize: "11px",
  fontWeight: "500",
  color: "#475569",
  backgroundColor: "#f1f5f9",
  padding: "2px 8px",
  borderRadius: "12px",
  marginLeft: "auto",
  flexShrink: 0
}

export default RoomMembers