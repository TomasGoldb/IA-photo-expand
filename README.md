# IA Foto Normal + Backend

Aplicacion frontend (React + Vite) para:

- Cargar una foto.
- Enviarla a un backend local (`./back`) que consulta Hugging Face.
- Descargar el resultado final en PNG.

## Requisitos

- Node.js instalado.
- Token gratis de Hugging Face (User Access Token con permiso `read`).

## Como sacar el token en Hugging Face

1. Crea cuenta o inicia sesion en [Hugging Face](https://huggingface.co/).
2. Entra a `Settings` -> `Access Tokens`.
3. Crea un token nuevo (tipo **User Access Token**) con permiso **read**.
4. Copia el token (empieza con `hf_...`).

## Configurar frontend (.env)

1. Crea `.env` en la raiz del proyecto (puedes copiar `.env.example`).
2. Agrega:
   - `VITE_API_URL=http://localhost:8787/api/generate`
3. Reinicia Vite:
   - `npm run dev`

## Configurar backend (`back/.env`)

1. Crea `back/.env` (puedes copiar `back/.env.example`).
2. Agrega:
   - `HF_TOKEN=hf_tu_token_real`
   - `HF_MODEL_ID=sd2-community/stable-diffusion-2-inpainting`
   - `PORT=8787`
   - `CORS_ORIGIN=http://localhost:5173`

Si ese modelo da error, prueba con:
- `HF_MODEL_ID=runwayml/stable-diffusion-inpainting`

## Uso

1. Instala dependencias:
   - `npm install`
2. Inicia backend:
   - `cd back`
   - `npm install`
   - `npm run dev`
3. En otra terminal, inicia frontend:
   - `cd ..`
   - `npm run dev`
4. En la app:
   - Sube una imagen.
   - Pulsa **Generar imagen**.

## Nota importante

Con esta configuracion, el navegador ya no llama directo a Hugging Face, por lo que evita el bloqueo CORS normal.
