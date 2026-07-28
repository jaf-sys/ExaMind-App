import { useState } from "react"

function CodeEditor({ value, onChange, language, onLanguageChange }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const languages = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash" }
  ]

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <select 
          value={language} 
          onChange={(e) => onLanguageChange(e.target.value)}
          style={selectStyle}
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={expandButtonStyle}
        >
          {isExpanded ? "▼" : "▶"} {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...textareaStyle,
          height: isExpanded ? "200px" : "100px"
        }}
        placeholder="Enter your code here..."
      />
      
      <div style={infoStyle}>
        <span>💡 Tip: You can paste code directly</span>
      </div>
    </div>
  )
}

const containerStyle = {
  marginBottom: "16px",
  border: "1px solid #e9ecef",
  borderRadius: "6px",
  overflow: "hidden"
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  backgroundColor: "#f8f9fa",
  borderBottom: "1px solid #e9ecef"
}

const selectStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "12px",
  backgroundColor: "#ffffff",
  cursor: "pointer"
}

const expandButtonStyle = {
  padding: "4px 8px",
  backgroundColor: "#ffffff",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  fontSize: "11px",
  cursor: "pointer"
}

const textareaStyle = {
  width: "100%",
  padding: "12px",
  border: "none",
  fontSize: "13px",
  fontFamily: "monospace",
  backgroundColor: "#fafbfc",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box"
}

const infoStyle = {
  padding: "6px 12px",
  backgroundColor: "#f1f9ff",
  fontSize: "11px",
  color: "#2c3e50",
  borderTop: "1px solid #e9ecef"
}

export default CodeEditor