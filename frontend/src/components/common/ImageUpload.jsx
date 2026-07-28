import { useState } from 'react'

function ImageUpload({ onImageUpload, currentImage, label }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || null)

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    const base64 = await convertToBase64(file)
    onImageUpload(base64)
    setUploading(false)
  }

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={uploadContainerStyle}>
        {preview && (
          <div style={previewContainerStyle}>
            <img src={preview} alt="Preview" style={previewImageStyle} />
            <button 
              onClick={() => {
                setPreview(null)
                onImageUpload(null)
              }}
              style={removeButtonStyle}
            >
              ✕
            </button>
          </div>
        )}
        <label style={uploadButtonStyle}>
          {uploading ? 'Uploading...' : (preview ? 'Change Image' : 'Upload Image')}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={hiddenInputStyle}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  )
}

const containerStyle = {
  marginBottom: '12px'
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '500',
  color: '#475569',
  marginBottom: '4px'
}

const uploadContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const previewContainerStyle = {
  position: 'relative',
  display: 'inline-block'
}

const previewImageStyle = {
  maxWidth: '200px',
  maxHeight: '150px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0'
}

const removeButtonStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const uploadButtonStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  backgroundColor: '#f1f5f9',
  color: '#475569',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer',
  border: '1px solid #e2e8f0',
  width: 'fit-content'
}

const hiddenInputStyle = {
  display: 'none'
}

export default ImageUpload