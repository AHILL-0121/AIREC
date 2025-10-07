# Client-Side Resume Parsing with Gemini AI

This feature allows the resume parsing functionality to work even when the backend Gemini service is unavailable.

## How It Works

1. When the backend resume parsing service returns a 503 error (service unavailable), the frontend automatically offers a client-side alternative.
2. The client-side parser uses Firebase AI SDK to call Gemini directly from the browser.
3. PDF text extraction happens in the browser using PDF.js.
4. The parsed resume data is processed the same way as if it came from the backend.

## Setup Instructions

To enable the client-side Gemini AI resume parsing:

1. Get a Gemini API key from Google AI Studio (https://ai.google.dev/)
2. Configure Firebase:
   - Open `src/lib/firebaseConfig.js`
   - Replace `YOUR_API_KEY` with your Gemini API key
   - For production, use environment variables

3. Update the Firebase configuration in `public/index.html` with the same API key.

## Dependencies

- Firebase App SDK (loaded from CDN)
- Firebase AI SDK (loaded from CDN)
- PDF.js (loaded from CDN)

## Flow

1. User uploads a PDF resume
2. System attempts to parse via backend
3. If backend is unavailable (503 error):
   - Client-side parsing option appears
   - User can click "Parse with Client-Side Gemini AI"
   - Result is processed locally and displayed

## Security Notes

- Ensure your API key has appropriate usage restrictions
- For production, set HTTP referrer restrictions on your API key
- Consider moving to server-side Firebase initialization for better security