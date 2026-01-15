# 🤖 AI Transcript MVP

An intelligent transcript summarization tool that transforms meeting notes and transcripts into actionable insights using Google's Gemini 2.0 Flash model.

## ✨ Features

- **Three Summary Modes**:
  - 📋 **Executive Summary**: Concise overview of key points
  - 🔸 **Bullet Points**: Clear, structured bullet-point format
  - ✅ **Action Items**: Extracted tasks in checklist format

- **Real-time Processing**: Fast summarization with latency tracking
- **Token Usage Metrics**: View input/output token counts
- **Modern UI**: Clean interface built with Tailwind CSS
- **Optimized Performance**: Powered by Gemini 2.0 Flash for speed
- **Character Limit**: Supports transcripts up to 12,000 characters

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ai-transcript-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

1. Paste or type a transcript into the text area
2. Select your preferred summary mode (Executive, Bullets, or Actions)
3. Click "Generate" to create your summary
4. View the results along with processing metrics

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.0 Flash
- **Font**: Geist by Vercel

## 📝 API Endpoints

### POST `/api/summarize`

Generates a summary from the provided transcript.

**Request Body**:
```json
{
  "text": "Your transcript here...",
  "mode": "executive" | "bullets" | "actions"
}
```

**Response**:
```json
{
  "summary": "Generated summary...",
  "tokens_in": 250,
  "tokens_out": 75,
  "latency_ms": 1200
}
```

## 🚢 Deploy on Vercel

The easiest way to deploy this app is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your `GEMINI_API_KEY` environment variable
4. Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

MIT
