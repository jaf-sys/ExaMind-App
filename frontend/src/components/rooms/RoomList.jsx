import { useState, useEffect } from "react"
import RoomMembers from "./RoomMembers"

function RoomList({ user, onSelectRoom, role }) {
  const [rooms, setRooms] = useState([])
  const [roomName, setRoomName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedRoom, setExpandedRoom] = useState(null)

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchRooms()
  }, [user])

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${BASE}/room/my-rooms/${user.user_id}`)
      const data = await res.json()
      if (res.ok) {
        setRooms(data)
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  const createRoom = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${BASE}/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name: roomName,
          user_id: user.user_id
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Room created! Code: ${data.join_code}`)
        setRoomName("")
        fetchRooms()
      } else {
        setError(data.message || "Failed to create room")
      }
    } catch (error) {
      console.error("Error creating room:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a join code")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${BASE}/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          join_code: joinCode,
          user_id: user.user_id
        })
      })

      if (res.ok) {
        alert("Joined room successfully!")
        setJoinCode("")
        fetchRooms()
      } else {
        const data = await res.json()
        setError(data.message || "Failed to join room")
      }
    } catch (error) {
      console.error("Error joining room:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    alert("Code copied!")
  }

  const toggleExpand = (roomId) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId)
  }

  const handleSelectRoom = (roomId) => {
    onSelectRoom(roomId)
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Rooms</h2>
        <span style={countStyle}>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={formContainerStyle}>
        {role === "instructor" ? (
          <div style={formCardStyle}>
            <h3 style={formTitleStyle}>Create New Room</h3>
            <div style={formStyle}>
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                style={inputStyle}
              />
              <button onClick={createRoom} disabled={loading} style={createButtonStyle}>
                Create
              </button>
            </div>
          </div>
        ) : (
          <div style={formCardStyle}>
            <h3 style={formTitleStyle}>Join a Room</h3>
            <div style={formStyle}>
              <input
                type="text"
                placeholder="Enter join code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={inputStyle}
                maxLength={6}
              />
              <button onClick={joinRoom} disabled={loading} style={joinButtonStyle}>
                Join
              </button>
            </div>
          </div>
        )}
      </div>


      <div style={roomsContainerStyle}>
        {rooms.length === 0 ? (
          <div style={emptyStyle}>
            <p style={emptyTextStyle}>
              {role === "instructor" 
                ? "No rooms yet. Create your first room above."
                : "No rooms yet. Join a room using a code."}
            </p>
          </div>
        ) : (
          rooms.map(room => (
            <div key={room.room_id} style={roomCardStyle}>

              <div style={roomHeaderStyle}>
                <div>
                  <h3 style={roomNameStyle}>{room.room_name}</h3>
                  {role === "instructor" && (
                    <div style={codeDisplayStyle}>
                      <span style={codeLabelStyle}>Code:</span>
                      <code style={codeStyle}>{room.join_code}</code>
                      <button onClick={() => copyToClipboard(room.join_code)} style={copyButtonStyle}>
                        Copy
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSelectRoom(room.room_id)}
                  style={selectButtonStyle}
                >
                  Select Room
                </button>
              </div>

              <div style={expandButtonContainerStyle}>
                <button
                  onClick={() => toggleExpand(room.room_id)}
                  style={expandButtonStyle}
                >
                  {expandedRoom === room.room_id ? '▼ Hide Members' : '▶ Show Members'}
                </button>
              </div>

              {expandedRoom === room.room_id && (
                <div style={membersSectionStyle}>
                  <RoomMembers roomId={room.room_id} currentUser={user} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const containerStyle = {
  width: "100%"
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
}

const titleStyle = {
  fontSize: "20px",
  fontWeight: "500",
  color: "#212529",
  margin: 0
}

const countStyle = {
  fontSize: "14px",
  color: "#6c757d",
  backgroundColor: "#e9ecef",
  padding: "4px 10px",
  borderRadius: "20px"
}

const errorStyle = {
  backgroundColor: "#f8d7da",
  color: "#842029",
  padding: "12px",
  borderRadius: "4px",
  marginBottom: "20px",
  fontSize: "14px"
}

const formContainerStyle = {
  marginBottom: "30px"
}

const formCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  padding: "20px"
}

const formTitleStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#212529",
  margin: "0 0 12px 0"
}

const formStyle = {
  display: "flex",
  gap: "8px"
}

const inputStyle = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ced4da",
  fontSize: "14px"
}

const createButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "14px",
  cursor: "pointer"
}

const joinButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#7071ae",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "14px",
  cursor: "pointer"
}

const roomsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
  gap: "16px"
}

const emptyStyle = {
  gridColumn: "1 / -1",
  backgroundColor: "#ffffff",
  border: "1px dashed #ced4da",
  borderRadius: "4px",
  padding: "40px",
  textAlign: "center"
}

const emptyTextStyle = {
  fontSize: "14px",
  color: "#6c757d",
  margin: 0
}

const roomCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  overflow: "hidden"
}

const roomHeaderStyle = {
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  borderBottom: "1px solid #e9ecef"
}

const roomNameStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#212529",
  margin: "0 0 8px 0"
}

const codeDisplayStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#f8f9fa",
  padding: "4px 8px",
  borderRadius: "4px"
}

const codeLabelStyle = {
  fontSize: "12px",
  color: "#6c757d"
}


const codeStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#7071ae",
  backgroundColor: "#ffffff",
  padding: "2px 6px",
  borderRadius: "4px",
  border: "1px solid #dee2e6"
}

const copyButtonStyle = {
  padding: "2px 8px",
  backgroundColor: "#ffffff",
  border: "1px solid #ced4da",
  borderRadius: "3px",
  fontSize: "11px",
  cursor: "pointer"
}

const selectButtonStyle = {
  padding: "6px 16px",
  backgroundColor: "#7071ae",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
}

const expandButtonContainerStyle = {
  padding: "8px 16px",
  borderBottom: "1px solid #e9ecef"
}

const expandButtonStyle = {
  background: "none",
  border: "none",
  color: "#7071ae",
  fontSize: "13px",
  cursor: "pointer",
  padding: 0
}

const membersSectionStyle = {
  padding: "16px",
  backgroundColor: "#f8f9fa",
  borderTop: "1px solid #e9ecef"
}

export default RoomList