import { useState, useEffect } from "react"
import ImageUpload from "../common/ImageUpload"

function EditQuizModal({ quizId, onClose, onQuizUpdated }) {
  const [activeTab, setActiveTab] = useState("details")
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    timeLimit: 30,
    topic: "",
    difficulty: "Medium",
    publish_at: "",
    start_time: "",
    end_time: ""
  })
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [savingQuestion, setSavingQuestion] = useState(false)

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchQuizDetails()
    fetchQuestions()
  }, [quizId])

  const fetchQuizDetails = async () => {
    try {
      const res = await fetch(`${BASE}/quiz/${quizId}`)
      const data = await res.json()
      
      if (res.ok) {
        setQuizDetails({
          title: data.title || "",
          timeLimit: data.time_limit || 30,
          topic: data.topic || "",
          difficulty: data.difficulty || "Medium",
          publish_at: data.publish_at ? data.publish_at.slice(0, 16) : "",
          start_time: data.start_time ? data.start_time.slice(0, 16) : "",
          end_time: data.end_time ? data.end_time.slice(0, 16) : ""
        })
      } else {
        setError(data.error || "Failed to fetch quiz")
      }
    } catch (error) {
      console.error("Error fetching quiz:", error)
      setError("Failed to connect to server")
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE}/question/by-quiz/${quizId}`)
      const data = await res.json()
      
      if (res.ok) {
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!quizDetails.title.trim()) {
      setError("Please enter quiz title")
      return
    }

    setLoading(true)
    setError("")

    try {
      const updateData = {
        title: quizDetails.title,
        time_limit: parseInt(quizDetails.timeLimit),
        topic: quizDetails.topic,
        difficulty: quizDetails.difficulty
      }
      
      if (quizDetails.publish_at) {
        updateData.publish_at = quizDetails.publish_at
      }
      if (quizDetails.start_time) {
        updateData.start_time = quizDetails.start_time
      }
      if (quizDetails.end_time) {
        updateData.end_time = quizDetails.end_time
      }

      const res = await fetch(`${BASE}/quiz/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()

      if (res.ok) {
        onQuizUpdated()
        onClose()
      } else {
        setError(data.error || "Failed to update quiz")
      }
    } catch (error) {
      console.error("Error updating quiz:", error)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (typeof questionId === 'string' && questionId.startsWith('temp_')) {
      setQuestions(questions.filter(q => q.question_id !== questionId))
      return
    }

    if (!window.confirm("Are you sure you want to delete this question?")) {
      return
    }

    try {
      const res = await fetch(`${BASE}/question/${questionId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setQuestions(questions.filter(q => q.question_id !== questionId))
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete question")
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Failed to delete question")
    }
  }

  const handleAddQuestion = () => {
    const newQuestion = {
      question_id: `temp_${Date.now()}`,
      question_text: "",
      question_image: null,
      option_a: "",
      option_a_image: null,
      option_b: "",
      option_b_image: null,
      option_c: "",
      option_c_image: null,
      option_d: "",
      option_d_image: null,
      correct_option: "A",
      isNew: true
    }
    setQuestions([...questions, newQuestion])
    setEditingQuestion(newQuestion.question_id)
  }

  const handleSaveQuestion = async (question) => {
    if (!question.question_text.trim()) {
      alert("Please enter question text")
      return
    }
    if (!question.option_a.trim() || !question.option_b.trim() || 
        !question.option_c.trim() || !question.option_d.trim()) {
      alert("Please fill all options")
      return
    }

    setSavingQuestion(true)

    try {
      const questionData = {
        question_text: question.question_text,
        question_image: question.question_image,
        option_a: question.option_a,
        option_a_image: question.option_a_image,
        option_b: question.option_b,
        option_b_image: question.option_b_image,
        option_c: question.option_c,
        option_c_image: question.option_c_image,
        option_d: question.option_d,
        option_d_image: question.option_d_image,
        correct_option: question.correct_option
      }

      if (question.isNew) {
        const res = await fetch(`${BASE}/question/add/${quizId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData)
        })

        const data = await res.json()
        
        if (res.ok) {
          fetchQuestions()
          setEditingQuestion(null)
        } else {
          alert(data.message || "Failed to add question")
        }
      } else {
        const res = await fetch(`${BASE}/question/${question.question_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData)
        })

        const data = await res.json()
        
        if (res.ok) {
          setQuestions(questions.map(q => 
            q.question_id === question.question_id ? {...question, isNew: false} : q
          ))
          setEditingQuestion(null)
        } else {
          alert(data.error || "Failed to update question")
        }
      }
    } catch (error) {
      console.error("Error saving question:", error)
      alert("Failed to save question")
    } finally {
      setSavingQuestion(false)
    }
  }

  if (fetchLoading) {
    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle}></div>
            <p style={loadingTextStyle}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Edit Quiz</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        <div style={tabContainerStyle}>
          <button
            onClick={() => setActiveTab("details")}
            style={{
              ...tabStyle,
              borderBottom: activeTab === "details" ? "2px solid #2c3e50" : "2px solid transparent",
              color: activeTab === "details" ? "#2c3e50" : "#95a5a6"
            }}
          >
            Quiz Details
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            style={{
              ...tabStyle,
              borderBottom: activeTab === "questions" ? "2px solid #2c3e50" : "2px solid transparent",
              color: activeTab === "questions" ? "#2c3e50" : "#95a5a6"
            }}
          >
            Questions ({questions.length})
          </button>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {activeTab === "details" ? (
          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Quiz Title <span style={requiredStyle}>*</span></label>
              <input
                type="text"
                value={quizDetails.title}
                onChange={(e) => setQuizDetails({...quizDetails, title: e.target.value})}
                style={inputStyle}
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Topic</label>
              <input
                type="text"
                value={quizDetails.topic}
                onChange={(e) => setQuizDetails({...quizDetails, topic: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div style={rowStyle}>
              <div style={halfWidthStyle}>
                <label style={labelStyle}>Time Limit (minutes)</label>
                <input
                  type="number"
                  value={quizDetails.timeLimit}
                  onChange={(e) => setQuizDetails({...quizDetails, timeLimit: e.target.value})}
                  min="1"
                  max="180"
                  style={inputStyle}
                />
              </div>

              <div style={halfWidthStyle}>
                <label style={labelStyle}>Difficulty</label>
                <select
                  value={quizDetails.difficulty}
                  onChange={(e) => setQuizDetails({...quizDetails, difficulty: e.target.value})}
                  style={selectStyle}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Auto-Publish Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={quizDetails.publish_at}
                onChange={(e) => setQuizDetails({...quizDetails, publish_at: e.target.value})}
                style={inputStyle}
              />
              <span style={helperTextStyle}>Quiz will automatically publish at this time</span>
            </div>

            <div style={rowStyle}>
              <div style={halfWidthStyle}>
                <label style={labelStyle}>Available From (Optional)</label>
                <input
                  type="datetime-local"
                  value={quizDetails.start_time}
                  onChange={(e) => setQuizDetails({...quizDetails, start_time: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div style={halfWidthStyle}>
                <label style={labelStyle}>Available Until (Optional)</label>
                <input
                  type="datetime-local"
                  value={quizDetails.end_time}
                  onChange={(e) => setQuizDetails({...quizDetails, end_time: e.target.value})}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={actionRowStyle}>
              <button type="button" onClick={onClose} style={cancelButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={loading ? loadingButtonStyle : saveButtonStyle}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div style={questionsContainerStyle}>
            <div style={questionsHeaderStyle}>
              <h3 style={questionsTitleStyle}>Manage Questions</h3>
              <button onClick={handleAddQuestion} style={addButtonStyle}>
                + Add Question
              </button>
            </div>

            <div style={questionsListStyle}>
              {questions.length === 0 ? (
                <div style={emptyStateStyle}>
                  <p>No questions yet. Click "Add Question" to create one.</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <div key={q.question_id} style={questionCardStyle}>
                    {editingQuestion === q.question_id ? (
                      <div>
                        <div style={formGroupStyle}>
                          <label style={labelStyle}>Question Text</label>
                          <textarea
                            value={q.question_text}
                            onChange={(e) => {
                              const updated = { ...q, question_text: e.target.value }
                              setQuestions(questions.map(qe => 
                                qe.question_id === q.question_id ? updated : qe
                              ))
                            }}
                            style={textareaStyle}
                            rows={2}
                          />
                        </div>

                        <ImageUpload
                          label="Question Image (optional)"
                          currentImage={q.question_image}
                          onImageUpload={(image) => {
                            const updated = { ...q, question_image: image }
                            setQuestions(questions.map(qe => 
                              qe.question_id === q.question_id ? updated : qe
                            ))
                          }}
                        />

                        <div style={formGroupStyle}>
                          <label style={labelStyle}>Options</label>
                          {['A', 'B', 'C', 'D'].map(letter => {
                            const optionKey = `option_${letter.toLowerCase()}`
                            const imageKey = `option_${letter.toLowerCase()}_image`
                            return (
                              <div key={letter} style={optionContainerStyle}>
                                <div style={optionInputRowStyle}>
                                  <span style={optionLetterInputStyle}>{letter}.</span>
                                  <input
                                    type="text"
                                    value={q[optionKey] || ""}
                                    onChange={(e) => {
                                      const updated = { ...q, [optionKey]: e.target.value }
                                      setQuestions(questions.map(qe => 
                                        qe.question_id === q.question_id ? updated : qe
                                      ))
                                    }}
                                    style={optionInputStyle}
                                    placeholder={`Option ${letter} text`}
                                  />
                                </div>
                                <ImageUpload
                                  label={`Option ${letter} Image (optional)`}
                                  currentImage={q[imageKey]}
                                  onImageUpload={(image) => {
                                    const updated = { ...q, [imageKey]: image }
                                    setQuestions(questions.map(qe => 
                                      qe.question_id === q.question_id ? updated : qe
                                    ))
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>

                        <div style={formGroupStyle}>
                          <label style={labelStyle}>Correct Answer</label>
                          <select
                            value={q.correct_option}
                            onChange={(e) => {
                              const updated = { ...q, correct_option: e.target.value }
                              setQuestions(questions.map(qe => 
                                qe.question_id === q.question_id ? updated : qe
                              ))
                            }}
                            style={selectStyle}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>

                        <div style={editActionsStyle}>
                          <button 
                            onClick={() => setEditingQuestion(null)}
                            style={cancelSmallButtonStyle}
                            disabled={savingQuestion}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleSaveQuestion(q)}
                            style={saveSmallButtonStyle}
                            disabled={savingQuestion}
                          >
                            {savingQuestion ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={questionHeaderStyle}>
                          <span style={questionNumberStyle}>Q{index + 1}</span>
                          <div style={questionActionsStyle}>
                            <button 
                              onClick={() => setEditingQuestion(q.question_id)}
                              style={editButtonStyle}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(q.question_id)}
                              style={deleteButtonStyle}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={questionTextStyle}>{q.question_text}</p>
                        {q.question_image && (
                          <div style={imagePreviewStyle}>
                            <img src={q.question_image} alt="Question" style={previewImageStyle} />
                          </div>
                        )}
                        <div style={optionsGridStyle}>
                          <div style={optionItemStyle}>A: {q.option_a}</div>
                          <div style={optionItemStyle}>B: {q.option_b}</div>
                          <div style={optionItemStyle}>C: {q.option_c}</div>
                          <div style={optionItemStyle}>D: {q.option_d}</div>
                        </div>
                        <div style={correctAnswerStyle}>
                          Correct: <strong>{q.correct_option}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={footerStyle}>
              <button onClick={() => setActiveTab("details")} style={doneButtonStyle}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
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
  maxWidth: "700px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
}

const modalHeaderStyle = {
  padding: "16px 24px",
  borderBottom: "1px solid #e9ecef",
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
  color: "#2c3e50",
  margin: 0
}

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#95a5a6",
  padding: "4px"
}

const tabContainerStyle = {
  display: "flex",
  gap: "20px",
  padding: "0 24px",
  marginBottom: "20px",
  borderBottom: "1px solid #e9ecef"
}

const tabStyle = {
  padding: "10px 0",
  background: "none",
  border: "none",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s"
}

const loadingContainerStyle = {
  padding: "40px",
  textAlign: "center"
}

const spinnerStyle = {
  width: "32px",
  height: "32px",
  border: "3px solid #e9ecef",
  borderTopColor: "#2c3e50",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto 12px auto"
}

const loadingTextStyle = {
  color: "#7f8c8d",
  fontSize: "13px",
  margin: 0
}

const errorStyle = {
  margin: "0 24px 16px 24px",
  padding: "10px 12px",
  backgroundColor: "#fef5f5",
  color: "#c0392b",
  borderRadius: "4px",
  fontSize: "12px"
}

const formGroupStyle = {
  padding: "0 24px",
  marginBottom: "16px"
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: "#546e7a",
  marginBottom: "4px"
}

const requiredStyle = {
  color: "#c0392b"
}

const helperTextStyle = {
  display: "block",
  fontSize: "11px",
  color: "#95a5a6",
  marginTop: "4px"
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box"
}

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  backgroundColor: "#ffffff"
}

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  fontFamily: "inherit"
}

const rowStyle = {
  display: "flex",
  gap: "12px",
  padding: "0 24px",
  marginBottom: "16px"
}

const halfWidthStyle = {
  flex: 1,
  minWidth: 0
}

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  padding: "20px 24px 24px 24px",
  borderTop: "1px solid #e9ecef"
}

const cancelButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#ffffff",
  color: "#546e7a",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
}

const saveButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
}

const loadingButtonStyle = {
  ...saveButtonStyle,
  opacity: 0.6,
  cursor: "not-allowed"
}

const questionsContainerStyle = {
  padding: "0 24px 24px 24px"
}

const questionsHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px"
}

const questionsTitleStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#2c3e50",
  margin: 0
}

const addButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer"
}

const questionsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  marginBottom: "20px",
  maxHeight: "400px",
  overflowY: "auto"
}

const emptyStateStyle = {
  padding: "40px",
  textAlign: "center",
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  color: "#7f8c8d",
  fontSize: "13px",
  border: "1px dashed #dee2e6"
}

const questionCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e9ecef",
  borderRadius: "6px",
  padding: "16px"
}

const questionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
}

const questionNumberStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#7f8c8d",
  textTransform: "uppercase"
}

const questionActionsStyle = {
  display: "flex",
  gap: "8px"
}

const editButtonStyle = {
  padding: "4px 8px",
  backgroundColor: "#f8f9fa",
  color: "#2c3e50",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  fontSize: "11px",
  cursor: "pointer"
}

const deleteButtonStyle = {
  padding: "4px 8px",
  backgroundColor: "#fef5f5",
  color: "#c0392b",
  border: "1px solid #fadbd8",
  borderRadius: "4px",
  fontSize: "11px",
  cursor: "pointer"
}

const questionTextStyle = {
  fontSize: "14px",
  color: "#2c3e50",
  margin: "0 0 12px 0"
}

const imagePreviewStyle = {
  margin: "8px 0",
  textAlign: "center"
}

const previewImageStyle = {
  maxWidth: "200px",
  maxHeight: "150px",
  borderRadius: "4px",
  border: "1px solid #e2e8f0"
}

const optionsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  marginBottom: "8px",
  fontSize: "12px"
}

const optionItemStyle = {
  color: "#546e7a"
}

const correctAnswerStyle = {
  fontSize: "12px",
  color: "#546e7a",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px dashed #e9ecef"
}

const optionContainerStyle = {
  marginBottom: "12px"
}

const optionInputRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "4px"
}

const optionLetterInputStyle = {
  minWidth: "20px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#546e7a"
}

const optionInputStyle = {
  flex: 1,
  padding: "6px 10px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "12px",
  outline: "none"
}

const editActionsStyle = {
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
  marginTop: "12px"
}

const cancelSmallButtonStyle = {
  padding: "4px 12px",
  backgroundColor: "#ffffff",
  color: "#546e7a",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  fontSize: "11px",
  cursor: "pointer"
}

const saveSmallButtonStyle = {
  padding: "4px 12px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "11px",
  cursor: "pointer"
}

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "16px"
}

const doneButtonStyle = {
  padding: "8px 24px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
}

const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

export default EditQuizModal