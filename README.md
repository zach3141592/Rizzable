# Rizzable - AI Dating Simulator

A fun chatbot game where you try to convince an AI persona to go on a date with you! Features a beautiful Apple Messages-style interface with **authentic Gen Z personalities** powered by OpenAI.

## 🎮 How to Play

- Meet randomly generated **Gen Z AI personas** with unique personalities
- Chat with them using natural conversation - they speak like real Gen Z!
- Use your charm and conversation skills to increase their interest
- The AI responds dynamically with **authentic Gen Z slang and expressions**
- Try to convince them to go on a date with you!

## ✨ Features

- 🍎 **Apple Messages UI** - Authentic iOS Messages look and feel
- 🗣️ **Authentic Gen Z AI** - Real slang, expressions, and communication style
- 🤖 **Real AI Personalities** - Powered by OpenAI GPT-3.5 Turbo
- 🎲 **Random Persona Generation** - 30+ names, Gen Z personalities, and trendy interests
- 💬 **Dynamic Conversations** - AI responds with "fr", "ngl", "bestie", and more
- 📈 **Interest Level System** - AI gets more flirty as you charm them
- 🔄 **New Match Button** - Generate fresh personas instantly
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🌙 **Dark Theme** - Beautiful dark interface
- ⚡ **Modern Tech Stack** - React, TypeScript, Vite, OpenAI API

## 🗣️ Gen Z Authenticity

Your matches will text you like real Gen Z people:

- **Slang**: "fr", "ngl", "lowkey", "highkey", "no cap", "bestie", "periodt"
- **Expressions**: "that's so valid", "main character energy", "it's giving..."
- **Reactions**: "stop", "i'm crying", "this is sending me", "not me..."
- **Style**: lowercase vibes, natural contractions, authentic reactions

## 🚀 Quick Start

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

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **OpenAI API** - AI conversation generation
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with animations

## 📱 Features

### UI Components

- **Header** - Contact info with avatar and action buttons
- **Persona Bio** - Displays generated personality with Gen Z flair
- **Messages** - Chat bubbles with timestamps
- **Typing Indicator** - Animated dots when AI is responding
- **Input Field** - Smooth message composition
- **Loading Screen** - Beautiful match-finding animation
- **New Match Button** - Refresh icon to generate new personas

### AI Persona System

- **30+ Unique Names** - Gender-neutral names for diverse personalities
- **18+ Personality Types** - Including "funny and unhinged", "aesthetic and trendy"
- **40+ Gen Z Interests** - TikTok, vintage shopping, coffee shops, music festivals
- **Dynamic Bios** - Generated with Gen Z language and expressions
- **13+ Conversation Styles** - From "chaotic and fun" to "wholesome and genuine"
- **Age Range** - 20-25 years old for authentic Gen Z representation

### AI Response System

- **Authentic Gen Z Language** - Real slang and expressions
- **Context Awareness** - AI remembers conversation history
- **Interest Level Tracking** - Responses get warmer and more slang-heavy
- **Personality Consistency** - AI stays in character with Gen Z authenticity
- **Realistic Timing** - Variable response delays for natural feel
- **Smart Prompting** - Advanced system prompts for authentic Gen Z responses

## 🎯 Game Mechanics

The AI persona responds intelligently based on:

- **Your conversation quality and charm**
- **How long you've been chatting**
- **Their unique Gen Z personality traits**
- **Your compatibility with their trendy interests**

Interest levels progress: **cautious → friendly → engaged → flirty → date-ready!**

## 🎭 Persona Examples

Meet some of the Gen Z personalities you might encounter:

- **Riley** (22) - _aesthetic and trendy_ • lowkey obsessed with vintage shopping and tiktok ✨
- **Phoenix** (24) - _funny and unhinged_ bestie who's into art, music festivals, and vibing 💫
- **Sage** (21) - _intellectual and curious_ • my feed is all podcasts and astrology content 🌟
- **River** (23) - _laid-back and easygoing_ energy • always down for coffee shops or skateboarding adventures 🌙

Each persona texts with authentic Gen Z language and creates realistic interactions!

## 🔧 Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚠️ API Key Security

**Important**: The app now uses environment variables for API keys, but they're still exposed in the frontend build. For production use:

1. **Move API calls to a backend server**
2. **Store API keys securely on the server**
3. **Implement proper authentication**
4. **Never expose API keys in client-side code**

**Current setup**: The API key is loaded from environment variables but is still included in the frontend bundle. This is acceptable for development but should be changed for production.

## 🎨 Design Details

The interface carefully recreates the Apple Messages experience:

- iOS-style message bubbles with authentic styling
- Smooth animations and micro-interactions
- Blur effects and transparency
- Responsive layout for all devices
- Custom scrollbars and loading states
- Realistic typing indicators

## 🚀 Deployment

The app is built with Vite and can be deployed to any static hosting platform:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

**Note**: For production deployment, implement a backend API to handle OpenAI requests securely.

## 💬 Sample Conversations

**Example opening messages:**

- _"yooo Jordan here! just got back from thrifting and your profile is giving main character energy ✨"_
- _"heyyy i'm Riley and your profile is absolutely sending me ✨ artist vibes recognize artist vibes"_
- _"yo i'm River - just vibing and thought i'd slide into your dms 😎 you seem chill"_

**Sample responses:**

- _"wait that's lowkey fire 😊"_
- _"ngl you're giving main character energy"_
- _"that's so real honestly"_
- _"okay but that's actually iconic"_

## 📄 License

MIT License - feel free to use this project for learning or building your own dating simulator!

---

**Get ready to test your rizz with authentic Gen Z AI! No cap, this is about to be iconic 💫**
