import { useState } from "react"
import CodeEditor from "./CodeEditor"
import ImageUpload from "../../common/ImageUpload"

function ManualQuiz({ user, roomId, onQuizCreated, onBack, onClose }) {
  const [step, setStep] = useState(1)
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    timeLimit: 30,
    topic: "",
    difficulty: "Medium",
    attemptsAllowed: 1,
    publish_at: "",
    start_time: "",
    end_time: ""
  })
  
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: "",
    question_image: null,
    code_snippet: "",
    language: "python",
    options: ["", "", "", ""],
    option_images: [null, null, null, null],
    correct_option: "A"
  })

  const BASE = "http://127.0.0.1:5000"

  const handleQuizDetailsSubmit = (e) => {
    e.preventDefault()
    if (!quizDetails.title.trim()) {
      alert("Please enter quiz title")
      return
    }
    setStep(2)
  }

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      alert("Please enter question text")
      return
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      alert("Please fill all options")
      return
    }
    
    setQuestions([...questions, { ...currentQuestion }])
    setCurrentQuestion({
      question_text: "",
      question_image: null,
      code_snippet: "",
      language: "python",
      options: ["", "", "", ""],
      option_images: [null, null, null, null],
      correct_option: "A"
    })
  }

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const saveQuiz = async () => {
    if (questions.length === 0) {
      alert("Please add at least one question")
      return
    }

    try {
      const quizData = {
        title: quizDetails.title,
        time_limit: parseInt(quizDetails.timeLimit),
        room_id: roomId,
        user_id: user.user_id,
        topic: quizDetails.topic || "General",
        difficulty: quizDetails.difficulty,
        publish_at: quizDetails.publish_at || null,
        start_time: quizDetails.start_time || null,
        end_time: quizDetails.end_time || null
      }
      
      if (roomId) {
        quizData.attempts_allowed = quizDetails.attemptsAllowed
      }

      const quizRes = await fetch(`${BASE}/quiz/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData)
      })

      const quizData_res = await quizRes.json()
      
      if (!quizRes.ok) {
        throw new Error(quizData_res.error || "Failed to create quiz")
      }

      for (const q of questions) {
        const questionData = {
          question_text: q.question_text,
          question_image: q.question_image,
          option_a: q.options[0],
          option_a_image: q.option_images[0],
          option_b: q.options[1],
          option_b_image: q.option_images[1],
          option_c: q.options[2],
          option_c_image: q.option_images[2],
          option_d: q.options[3],
          option_d_image: q.option_images[3],
          correct_option: q.correct_option
        }
        
        if (q.code_snippet) {
          questionData.code_snippet = q.code_snippet
          questionData.language = q.language
        }
        
        const questionRes = await fetch(`${BASE}/question/add/${quizData_res.quiz_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData)
        })

        if (!questionRes.ok) {
          const errorData = await questionRes.json()
          throw new Error(errorData.message || "Failed to add question")
        }
      }

      alert(`Quiz created successfully with ${questions.length} questions!`)
      onQuizCreated()
      onClose()
      
    } catch (error) {
      console.error("Error saving quiz:", error)
      alert("Failed to save quiz: " + error.message)
    }
  }

  if (step === 1) {
    return (
      <div style={stepContainerStyle}>
        <h3 style={stepTitleStyle}>Quiz Details</h3>
        
        <form onSubmit={handleQuizDetailsSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Quiz Title *</label>
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

          {roomId && (
            <div style={formGroupStyle}>
              <label style={labelStyle}>Attempts Allowed</label>
              <input
                type="number"
                value={quizDetails.attemptsAllowed}
                onChange={(e) => setQuizDetails({...quizDetails, attemptsAllowed: parseInt(e.target.value) || 1})}
                min="1"
                max="10"
                style={inputStyle}
              />
            </div>
          )}

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

          <div style={questionCountStyle}>
            <span>{questions.length} question{questions.length !== 1 ? 's' : ''} added</span>
          </div>

          <div style={actionRowStyle}>
            <button type="button" onClick={onBack} style={secondaryButtonStyle}>
              Back
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Continue to Questions
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div style={stepContainerStyle}>
      <div style={stepHeaderStyle}>
        <h3 style={stepTitleStyle}>Add Questions</h3>
        <span style={questionCounterStyle}>{questions.length} added</span>
      </div>
      
      <p style={quizNameStyle}>Quiz: {quizDetails.title}</p>
      
      <div style={questionFormStyle}>
        <h4 style={questionFormTitleStyle}>Question {questions.length + 1}</h4>
        
        <div style={formGroupStyle}>
          <label style={labelStyle}>Question Text</label>
          <textarea
            value={currentQuestion.question_text}
            onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
            style={textareaStyle}
            placeholder="Enter your question here..."
            rows={2}
          />
        </div>

        <ImageUpload
          label="Question Image (optional)"
          currentImage={currentQuestion.question_image}
          onImageUpload={(image) => setCurrentQuestion({...currentQuestion, question_image: image})}
        />

        <div style={codeToggleStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={currentQuestion.code_snippet !== ""}
              onChange={(e) => {
                setCurrentQuestion({
                  ...currentQuestion,
                  code_snippet: e.target.checked ? "# Enter your code here" : "",
                  options: currentQuestion.options || ["", "", "", ""]
                })
              }}
            />
            Include code snippet
          </label>
        </div>

        {currentQuestion.code_snippet !== "" && (
          <div style={codeSectionStyle}>
            <CodeEditor
              value={currentQuestion.code_snippet}
              onChange={(newCode) => setCurrentQuestion({
                ...currentQuestion, 
                code_snippet: newCode
              })}
              language={currentQuestion.language}
              onLanguageChange={(newLang) => setCurrentQuestion({
                ...currentQuestion,
                language: newLang
              })}
            />
          </div>
        )}

        <div style={formGroupStyle}>
          <label style={labelStyle}>Options</label>
          {['A', 'B', 'C', 'D'].map((letter, idx) => (
            <div key={letter} style={optionContainerStyle}>
              <div style={optionRowStyle}>
                <span style={optionLetterStyle}>{letter}.</span>
                <textarea
                  value={currentQuestion.options?.[idx] || ""}
                  onChange={(e) => {
                    const currentOptions = currentQuestion.options || ["", "", "", ""]
                    const newOptions = [...currentOptions]
                    newOptions[idx] = e.target.value
                    setCurrentQuestion({
                      ...currentQuestion, 
                      options: newOptions
                    })
                  }}
                  style={optionTextareaStyle}
                  placeholder={`Option ${letter} text`}
                  rows={2}
                />
              </div>
              <ImageUpload
                label={`Option ${letter} Image (optional)`}
                currentImage={currentQuestion.option_images?.[idx]}
                onImageUpload={(image) => {
                  const newImages = [...(currentQuestion.option_images || [null, null, null, null])]
                  newImages[idx] = image
                  setCurrentQuestion({...currentQuestion, option_images: newImages})
                }}
              />
            </div>
          ))}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Correct Answer</label>
          <select
            value={currentQuestion.correct_option}
            onChange={(e) => setCurrentQuestion({...currentQuestion, correct_option: e.target.value})}
            style={selectStyle}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <button onClick={addQuestion} style={addButtonStyle}>
          + Add Question
        </button>
      </div>

      {questions.length > 0 && (
        <div style={questionsListStyle}>
          <h4 style={listTitleStyle}>Added Questions ({questions.length})</h4>
          {questions.map((q, idx) => (
            <div key={idx} style={questionItemStyle}>
              <span style={questionItemTextStyle}>
                {idx + 1}. {q.question_text.substring(0, 50)}...
                {q.code_snippet && <span style={codeIndicatorStyle}> [code]</span>}
                {q.question_image && <span style={imageIndicatorStyle}> [image]</span>}
              </span>
              <button 
                onClick={() => removeQuestion(idx)} 
                style={removeButtonStyle}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={actionRowStyle}>
        <button onClick={() => setStep(1)} style={secondaryButtonStyle}>
          Back to Details
        </button>
        <button 
          onClick={saveQuiz} 
          style={questions.length === 0 ? disabledButtonStyle : saveButtonStyle}
          disabled={questions.length === 0}
        >
          Save Quiz ({questions.length} question{questions.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  )
}

const stepContainerStyle = {
  padding: "20px 24px"
}

const stepHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px"
}

const stepTitleStyle = {
  fontSize: "15px",
  fontWeight: "500",
  color: "#2c3e50",
  margin: 0
}

const questionCounterStyle = {
  fontSize: "12px",
  color: "#7f8c8d",
  backgroundColor: "#f5f7fa",
  padding: "2px 8px",
  borderRadius: "12px"
}

const quizNameStyle = {
  fontSize: "12px",
  color: "#7f8c8d",
  margin: "0 0 20px 0",
  paddingBottom: "12px",
  borderBottom: "1px solid #e9ecef"
}

const formGroupStyle = {
  marginBottom: "16px"
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: "#546e7a",
  marginBottom: "4px"
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

const textareaStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
  minHeight: "50px",
  fontFamily: "inherit"
}

const selectStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "13px",
  outline: "none",
  backgroundColor: "#ffffff",
  cursor: "pointer"
}

const rowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px"
}

const halfWidthStyle = {
  flex: 1,
  minWidth: 0
}

const questionCountStyle = {
  marginBottom: "20px",
  padding: "8px 12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "4px",
  fontSize: "12px",
  color: "#546e7a"
}

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "20px"
}

const primaryButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer"
}

const secondaryButtonStyle = {
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
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer"
}

const disabledButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#bdc3c7",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "not-allowed",
  opacity: 0.6
}

const addButtonStyle = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#f5f7fa",
  color: "#2c3e50",
  border: "1px dashed #bdc3c7",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  marginTop: "8px"
}

const questionFormStyle = {
  backgroundColor: "#fafbfc",
  padding: "16px",
  borderRadius: "6px",
  marginBottom: "20px",
  border: "1px solid #e9ecef"
}

const questionFormTitleStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#2c3e50",
  margin: "0 0 12px 0"
}

const codeToggleStyle = {
  marginBottom: "12px"
}

const checkboxLabelStyle = {
  fontSize: "12px",
  color: "#546e7a",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer"
}

const codeSectionStyle = {
  marginBottom: "16px"
}

const optionContainerStyle = {
  marginBottom: "12px"
}

const optionRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "4px"
}

const optionLetterStyle = {
  minWidth: "20px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#546e7a",
  paddingTop: "8px"
}

const optionTextareaStyle = {
  flex: 1,
  padding: "6px 10px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "12px",
  resize: "vertical",
  fontFamily: "inherit"
}

const questionsListStyle = {
  marginTop: "20px"
}

const listTitleStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#2c3e50",
  margin: "0 0 10px 0"
}

const questionItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  backgroundColor: "#ffffff",
  border: "1px solid #e9ecef",
  borderRadius: "4px",
  marginBottom: "6px"
}

const questionItemTextStyle = {
  fontSize: "12px",
  color: "#2c3e50"
}

const codeIndicatorStyle = {
  marginLeft: "4px",
  color: "#e67e22",
  fontWeight: "500"
}

const imageIndicatorStyle = {
  marginLeft: "4px",
  color: "#3498db",
  fontWeight: "500"
}

const removeButtonStyle = {
  background: "none",
  border: "none",
  color: "#95a5a6",
  cursor: "pointer",
  fontSize: "14px"
}

export default ManualQuiz