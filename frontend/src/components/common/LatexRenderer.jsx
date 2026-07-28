import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function LatexRenderer({ text }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && text) {
      try {
        let processedText = text
        
        processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
          try {
            return katex.renderToString(latex, {
              displayMode: true,
              throwOnError: false,
              output: 'html'
            })
          } catch (e) {
            console.error('LaTeX block error:', e)
            return `<span class="latex-error">${latex}</span>`
          }
        })
        
        processedText = processedText.replace(/\$([^\$]+)\$/g, (match, latex) => {
          try {
            return katex.renderToString(latex, {
              displayMode: false,
              throwOnError: false,
              output: 'html'
            })
          } catch (e) {
            console.error('LaTeX inline error:', e)
            return `<span class="latex-error">${latex}</span>`
          }
        })
        
        containerRef.current.innerHTML = processedText
      } catch (error) {
        console.error('LaTeX rendering error:', error)
        containerRef.current.innerHTML = text
      }
    }
  }, [text])

  return <div ref={containerRef} className="latex-content" />
}

export default LatexRenderer