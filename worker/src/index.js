const HF_URL =
  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-inpainting'

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*'
    const headers = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers })
    }

    if (!env.HF_TOKEN) {
      return new Response('Missing HF_TOKEN secret in Worker', {
        status: 500,
        headers,
      })
    }

    try {
      const hfResponse = await fetch(HF_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HF_TOKEN}`,
        },
        body: request.body,
      })

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text()
        return new Response(errorText, {
          status: hfResponse.status,
          headers: {
            ...headers,
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      }

      const contentType = hfResponse.headers.get('Content-Type') || 'image/png'
      const imageBuffer = await hfResponse.arrayBuffer()

      return new Response(imageBuffer, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected proxy error'
      return new Response(message, {
        status: 500,
        headers: {
          ...headers,
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }
  },
}
