# Rizzable - AI Dating Simulator

A fun chatbot game where you try to convince an AI persona to go on a date with you! Features a beautiful Apple Messages-style interface with **authentic Gen Z personalities** powered by OpenAI.

## How to Play

- Meet randomly generated **Gen Z AI personas** with unique personalities
- Chat with them using natural conversation - they speak like real Gen Z!
- Use your charm and conversation skills to increase their interest
- The AI responds dynamically with **authentic Gen Z slang and expressions**
- Try to convince them to go on a date with you!

## Features

- **Apple Messages UI** - Authentic iOS Messages look and feel
- **Authentic Gen Z AI** - Real slang, expressions, and communication style
- **Real AI Personalities** - Powered by OpenAI GPT-3.5 Turbo
- **Random Persona Generation** - 30+ names, Gen Z personalities, and trendy interests
- **Dynamic Conversations** - AI responds with "fr", "ngl", "bestie", and more
- **Interest Level System** - AI gets more flirty as you charm them
- **New Match Button** - Generate fresh personas instantly
- **Responsive Design** - Works perfectly on desktop and mobile
- **Dark Theme** - Beautiful dark interface
- **Modern Tech Stack** - React, TypeScript, Vite, OpenAI API

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Create a `.env` file in the root directory and add your OpenAI API key:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file and replace `your_openai_api_key_here` with your actual OpenAI API key:

   ```
   VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

   **Get your OpenAI API key:**

   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account or sign in
   - Generate a new API key
   - Copy it to your `.env` file

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Visit `http://localhost:3000`
   - Meet your first Gen Z AI match and start chatting!

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **OpenAI API** - AI conversation generation
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with animations

### AI Response System

- **Authentic Gen Z Language** - Real slang and expressions
- **Context Awareness** - AI remembers conversation history
- **Interest Level Tracking** - Responses get warmer and more slang-heavy
- **Personality Consistency** - AI stays in character with Gen Z authenticity
- **Realistic Timing** - Variable response delays for natural feel
- **Smart Prompting** - Advanced system prompts for authentic Gen Z responses

## Game Mechanics

The AI persona responds intelligently based on:

- **Your conversation quality and charm**
- **How long you've been chatting**
- **Their unique Gen Z personality traits**
- **Your compatibility with their trendy interests**

## Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The app is built with Vite and can be deployed to any static hosting platform:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## License

MIT License - feel free to use this project for learning or building your own dating simulator!

---
