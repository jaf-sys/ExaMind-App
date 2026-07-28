import { useState } from "react"
import ManualQuiz from "./ManualQuiz"
import AIQuiz from "./AIQuiz"
import AIFromText from "./AIFromText"

function CreateQuiz({ user, roomId, onQuizCreated, onClose }) {
  const [step, setStep] = useState(1)
  const [quizType, setQuizType] = useState(null)

  const renderQuizType = () => {
    switch(quizType) {
      case 'manual':
        return <ManualQuiz 
                user={user} 
                roomId={roomId} 
                onQuizCreated={onQuizCreated}
                onBack={() => {setQuizType(null); setStep(1);}}
                onClose={onClose}
               />
      case 'ai':
        return <AIQuiz 
                user={user} 
                roomId={roomId} 
                onQuizCreated={onQuizCreated}
                onBack={() => {setQuizType(null); setStep(1);}}
                onClose={onClose}
               />
      case 'text':
        return <AIFromText 
                user={user} 
                roomId={roomId} 
                onQuizCreated={onQuizCreated}
                onBack={() => {setQuizType(null); setStep(1);}}
                onClose={onClose}
               />
      default:
        return null
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Create New Quiz</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {step === 1 && !quizType && (
          <div style={stepContainerStyle}>
            <h3 style={stepTitleStyle}>Choose Creation Method</h3>
            
            <div style={optionsContainerStyle}>
              <button
                onClick={() => { setQuizType('manual'); setStep(2); }}
                style={optionCardStyle}
              >
                <div style={optionContentStyle}>
                  <h4 style={optionTitleStyle}>Manual Creation</h4>
                  <p style={optionDescriptionStyle}>
                    Create questions one by one with full control
                  </p>
                  <span style={optionBadgeStyle}>Best for specific questions</span>
                </div>
              </button>

              <button
                onClick={() => { setQuizType('ai'); setStep(2); }}
                style={optionCardStyle}
              >
                <div style={optionContentStyle}>
                  <h4 style={optionTitleStyle}>AI from Topic</h4>
                  <p style={optionDescriptionStyle}>
                    Enter a topic and AI generates questions automatically
                  </p>
                  <span style={optionBadgeStyle}>Best for quick generation</span>
                </div>
              </button>

              <button
                onClick={() => { setQuizType('text'); setStep(2); }}
                style={optionCardStyle}
              >
                <div style={optionContentStyle}>
                  <h4 style={optionTitleStyle}>AI from Text</h4>
                  <p style={optionDescriptionStyle}>
                    Paste your content and AI creates questions from it
                  </p>
                  <span style={optionBadgeStyle}>Best for study materials</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && quizType && renderQuizType()}
      </div>
    </div>
  )
}

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: "20px"
}

const modalContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
}

const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #eaeef2",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "sticky",
  top: 0,
  backgroundColor: "#ffffff",
  zIndex: 10
}

const modalTitleStyle = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#1e293b",
  margin: 0
}

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#64748b",
  padding: "4px",
  borderRadius: "4px",
  lineHeight: "1"
}

const stepContainerStyle = {
  padding: "24px"
}

const stepTitleStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 20px 0"
}

const optionsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
}

const optionCardStyle = {
  display: "flex",
  gap: "16px",
  padding: "20px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.2s",
  textAlign: "left",
  width: "100%"
}

const optionContentStyle = {
  flex: 1
}

const optionTitleStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 4px 0"
}

const optionDescriptionStyle = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 8px 0",
  lineHeight: "1.5"
}

const optionBadgeStyle = {
  display: "inline-block",
  padding: "2px 8px",
  backgroundColor: "#f1f5f9",
  color: "#475569",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "500"
}

export default CreateQuiz