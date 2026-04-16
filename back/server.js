/* global process, Buffer */
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'

dotenv.config()

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

const PORT = Number(process.env.PORT || 8787)
const HF_TOKEN = process.env.HF_TOKEN
const HF_MODEL_ID =
  process.env.HF_MODEL_ID || 'sd2-community/stable-diffusion-2-inpainting'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  return next()
})

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    model: HF_MODEL_ID,
  })
})

app.get('/api/generate', (_req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Este endpoint solo acepta POST con multipart/form-data y el campo "image".',
  })
})

app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Missing HF_TOKEN in back/.env' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Missing image file in form field "image"' })
    }

    const formData = new FormData()
    formData.append(
      'image',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'image/png' }),
      req.file.originalname || 'source.png',
    )
    formData.append('prompt', req.body.prompt || '')
    formData.append('negative_prompt', req.body.negative_prompt || '')
    formData.append('num_inference_steps', req.body.num_inference_steps || '30')
    formData.append('guidance_scale', req.body.guidance_scale || '7.5')

    const hfResponse = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: formData,
    })

    if (!hfResponse.ok) {
      const text = await hfResponse.text()
      console.error(
        `[HF] ${hfResponse.status} ${HF_URL}`,
        text.slice(0, 200),
      )
      return res.status(hfResponse.status).send(text)
    }

    const contentType = hfResponse.headers.get('content-type') || 'image/png'
    const imageArrayBuffer = await hfResponse.arrayBuffer()
    res.setHeader('Content-Type', contentType)
    return res.status(200).send(Buffer.from(imageArrayBuffer))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected backend error'
    return res.status(500).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend ready on http://localhost:${PORT}`)
})
