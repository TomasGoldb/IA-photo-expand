import { useMemo, useState } from 'react'
import './App.css'

const DEFAULT_API = 'http://localhost:8787/api/generate'

function resolveApiUrl() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) return DEFAULT_API
  try {
    const u = new URL(raw, typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173')
    const local =
      u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    if (local && u.pathname.startsWith('/models/')) {
      console.warn(
        '[IA-photo-expand] VITE_API_URL no debe ser /models/... en localhost; usa /api/generate. Modelo en back/.env (HF_MODEL_ID).',
      )
      return DEFAULT_API
    }
  } catch {
    /* ignore */
  }
  return raw
}

const API_URL = resolveApiUrl()
const DEFAULT_PROMPT =
  'high quality photorealistic edit, preserve original subject, natural colors, detailed textures, no text, no watermark'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')

  const imageRatioMessage = useMemo(() => {
    if (!imageFile) {
      return ''
    }
    return 'Modo normal: se envia la imagen tal cual, sin outpaint.'
  }, [imageFile])

  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    setError('')
    setResultUrl('')
    setImageFile(selectedFile)
    const dataUrl = await fileToDataUrl(selectedFile)
    setImageDataUrl(dataUrl)
  }

  async function generateNormal() {
    if (!imageDataUrl) {
      setError('Primero sube una imagen.')
      return
    }
    setIsGenerating(true)
    setError('')
    setResultUrl('')

    try {
      const imageResponse = await fetch(imageDataUrl)
      const imageBlob = await imageResponse.blob()
      const formData = new FormData()
      formData.append('image', imageBlob, 'source.png')
      formData.append('prompt', DEFAULT_PROMPT)
      formData.append('negative_prompt', 'blurry, artifacts, distorted')
      formData.append('num_inference_steps', '30')
      formData.append('guidance_scale', '7.5')

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error de IA (${response.status}): ${text}`)
      }

      const blob = await response.blob()
      const finalImageUrl = URL.createObjectURL(blob)
      setResultUrl(finalImageUrl)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo generar la imagen.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="app">
      <h1>IA Foto Normal</h1>
      <p className="subtitle">
        Sube una foto y se procesa sin outpaint.
      </p>

      <section className="panel">
        <label className="field">
          <span>1) Elige una imagen</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
        </label>

        <button type="button" onClick={generateNormal} disabled={isGenerating}>
          {isGenerating ? 'Generando...' : 'Generar imagen'}
        </button>

        {imageRatioMessage && <p className="hint">{imageRatioMessage}</p>}
        <p className="hint">
          Usa backend en `http://localhost:8787` (configurable con `VITE_API_URL`).
        </p>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="grid">
        <div className="card">
          <h2>Original</h2>
          {imageDataUrl ? (
            <img src={imageDataUrl} alt="Original subida" />
          ) : (
            <p className="placeholder">Aun no cargaste ninguna imagen.</p>
          )}
        </div>

        <div className="card">
          <h2>Resultado IA</h2>
          {resultUrl ? (
            <>
              <img src={resultUrl} alt="Resultado generado con IA" />
              <a href={resultUrl} download="resultado-ia.png" className="download">
                Descargar PNG
              </a>
            </>
          ) : (
            <p className="placeholder">El resultado aparecera aqui.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
