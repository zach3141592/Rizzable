import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Phone, Video, RefreshCw } from 'lucide-react'
import { generateRandomPersona, AIPersona } from './services/personaGenerator'
import { generateAIResponse, ConversationContext, testOpenAIConnection, generateFirstMessage } from './services/openaiService'
import LandingPage from './components/LandingPage'
import './App.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface UserPreferences {
  name: string
  ageRange: {
    min: number
    max: number
  }
  genderIdentity: string
  sexualOrientation: string
}

interface GameMetrics {
  startTime: Date | null
  totalWords: number
  totalTime: number // in seconds
  rizzIndex: number // 0-100
}

interface GameCompletionData {
  isVisible: boolean
  metrics: GameMetrics
}

function App() {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [hasCompletedLanding, setHasCompletedLanding] = useState(false)
  const [persona, setPersona] = useState<AIPersona | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'testing' | 'working' | 'failed'>('testing')
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messages: [],
    messageCount: 0,
    userInterestLevel: 0
  })
  const [gameMetrics, setGameMetrics] = useState<GameMetrics>({
    startTime: null,
    totalWords: 0,
    totalTime: 0,
    rizzIndex: 0
  })
  const [gameCompletion, setGameCompletion] = useState<GameCompletionData>({
    isVisible: false,
    metrics: {
      startTime: null,
      totalWords: 0,
      totalTime: 0,
      rizzIndex: 0
    }
  })
  const [isGameCompleted, setIsGameCompleted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Only initialize chat after landing page completion
  useEffect(() => {
    if (hasCompletedLanding && userPreferences) {
      initializeChat()
    }
  }, [hasCompletedLanding, userPreferences])

  const handleLandingComplete = (preferences: UserPreferences) => {
    setUserPreferences(preferences)
    setHasCompletedLanding(true)
  }

  const initializeChat = async () => {
    setIsLoading(true)
    setApiStatus('testing')
    
    // Test OpenAI connection first
    console.log('🔍 Testing OpenAI API connection...')
    const apiWorking = await testOpenAIConnection()
    setApiStatus(apiWorking ? 'working' : 'failed')
    
    if (!apiWorking) {
      console.log('⚠️ OpenAI API is not working, responses will use fallback system')
    }
    
    const newPersona = generateRandomPersona()
    setPersona(newPersona)
    
    // Generate personality-based first message
    const firstMessageText = generateFirstMessage(newPersona)
    const greetingMessage: Message = {
      id: '1',
      text: firstMessageText,
      isUser: false,
      timestamp: new Date()
    }
    
    setMessages([greetingMessage])
    setConversationContext({
      messages: [{ role: 'assistant', content: firstMessageText }],
      messageCount: 0,
      userInterestLevel: 0
    })
    
    // Initialize game metrics
    setGameMetrics({
      startTime: new Date(),
      totalWords: 0,
      totalTime: 0,
      rizzIndex: 0
    })
    setIsGameCompleted(false)
    setGameCompletion({
      isVisible: false,
      metrics: {
        startTime: new Date(),
        totalWords: 0,
        totalTime: 0,
        rizzIndex: 0
      }
    })
    
    setIsLoading(false)
  }

  const generateNewPersona = () => {
    setMessages([])
    setInputText('')
    setConversationContext({
      messages: [],
      messageCount: 0,
      userInterestLevel: 0
    })
    setIsGameCompleted(false)
    setGameCompletion({
      isVisible: false,
      metrics: {
        startTime: null,
        totalWords: 0,
        totalTime: 0,
        rizzIndex: 0
      }
    })
    initializeChat()
  }

  // Function to detect if AI has agreed to go on a date
  const detectDateAgreement = (aiResponse: string): boolean => {
    const response = aiResponse.toLowerCase()
    console.log('🔍 Checking for date agreement in:', response)
    
    // Patterns that indicate date agreement
    const dateAgreementPatterns = [
      // Direct agreement with date words
      /(yes|yeah|yep|sure|absolutely|definitely|totally).*(date|go out|hang out|meet up)/,
      /(i['d]? love to|i['d]? like to|sounds good|sounds great|let['s]? do it)/,
      /(when|where|what time|tomorrow|tonight|weekend|this week).*(date|meet|hang out)/,
      
      // Gen Z specific agreement patterns
      /(bet|say less|i['m]? down|let['s]? go|fr\?|for real\?|no cap)/,
      /(that sounds fire|that['s]? a vibe|i['m]? so down|period|periodt)/,
      /(we should totally|let['s]? definitely|i['m]? literally so excited)/,
      
      // Enthusiastic responses
      /(omg yes|yasss|yesss|absolutely|hell yes)/,
      /(can['t]? wait|so excited|this is gonna be|looking forward)/,
      /(pick me up|meet me|see you).*(at|tomorrow|tonight|friday|saturday|sunday)/,
      
      // Planning responses - questions that indicate agreement
      /(what should we|where should we|when works|what time).*(do|go|meet)/,
      /(coffee|dinner|lunch|movie|drinks|park|beach).*(sounds|good|perfect|amazing)/,
      /(what did you have in mind|where were you thinking|when works for you)/,
      
      // Time and place commitments
      /(tomorrow|tonight|this weekend|friday|saturday|sunday|next week).*(works|perfect|good|sounds good)/,
      /(7|8|9|six|seven|eight|nine|ten).*(pm|am|o['']?clock).*(works|good|perfect)/,
      
      // Simple enthusiastic agreement (without specific date words)
      /^(yes|yeah|yep|sure|absolutely|definitely|totally|bet|say less|i['m]? down|let['s]? go)[\s!.]*$/,
      
      // Response to "want to go out" or similar
      /(sounds good|sounds great|sounds fun|sounds perfect|that sounds amazing)/,
      /(i['d]? love that|i['d]? like that|that would be nice|that would be fun)/,
      
      // When they ask follow-up questions after being asked out
      /(when|where|what time|how about|what about)/,
      
      // Additional Gen Z patterns
      /(that['s]? so cute|you['re]? so sweet|this is so exciting|i['m]? actually excited)/,
      /(no literally|literally yes|actually yes|fr yes|for real yes)/,
      /(omg we should|we totally should|we def should|we definitely should)/,
      
      // Casual agreement patterns
      /(alright|okay|ok|cool|nice|sweet).*(let['s]? do it|sounds good|i['m]? in)/,
      /(why not|sure thing|count me in|i['m]? game|i['m]? up for it)/
    ]
    
    // Check for any matching patterns
    const hasMatch = dateAgreementPatterns.some(pattern => pattern.test(response))
    console.log('🎯 Date agreement detected:', hasMatch)
    
    if (hasMatch) {
      console.log('✅ SUCCESS! AI agreed to a date with response:', aiResponse)
    }
    
    return hasMatch
  }

  // Function to calculate rizz index based on performance
  const calculateRizzIndex = (wordCount: number, timeInSeconds: number, messageCount: number): number => {
    let rizzScore = 50 // Base score
    
    // Efficiency bonus (fewer words = better rizz)
    const wordsPerMessage = wordCount / Math.max(messageCount, 1)
    if (wordsPerMessage <= 10) rizzScore += 20        // Very efficient
    else if (wordsPerMessage <= 20) rizzScore += 10   // Efficient
    else if (wordsPerMessage <= 30) rizzScore += 5    // Decent
    else rizzScore -= 10                              // Too wordy
    
    // Speed bonus (faster conversation = better rizz)
    const timeInMinutes = timeInSeconds / 60
    if (timeInMinutes <= 2) rizzScore += 15           // Lightning fast
    else if (timeInMinutes <= 5) rizzScore += 10      // Quick
    else if (timeInMinutes <= 10) rizzScore += 5      // Decent pace
    else rizzScore -= 5                               // Too slow
    
    // Message count efficiency (fewer messages = better)
    if (messageCount <= 5) rizzScore += 15            // Smooth operator
    else if (messageCount <= 10) rizzScore += 10      // Good flow
    else if (messageCount <= 15) rizzScore += 5       // Average
    else rizzScore -= 10                              // Took too long
    
    // Bonus for ultra-fast success (under 1 minute)
    if (timeInMinutes < 1) rizzScore += 10
    
    // Bonus for minimal words (under 50 total words)
    if (wordCount < 50) rizzScore += 10
    
    // Cap the score between 0 and 100
    return Math.max(0, Math.min(100, Math.round(rizzScore)))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || !persona || isTyping || isGameCompleted) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

    // Count words in user message
    const userWords = inputText.trim().split(/\s+/).length
    
    // Update metrics with user word count
    setGameMetrics(prev => ({
      ...prev,
      totalWords: prev.totalWords + userWords
    }))

    // Update messages and context
    setMessages(prev => [...prev, userMessage])
    const newContext: ConversationContext = {
      messages: [...conversationContext.messages, { role: 'user', content: inputText }],
      messageCount: conversationContext.messageCount + 1,
      userInterestLevel: conversationContext.userInterestLevel
    }
    setConversationContext(newContext)
    setInputText('')
    setIsTyping(true)

    try {
      console.log('📩 User sent:', inputText)
      
      // Generate AI response using OpenAI
      const aiResponseText = await generateAIResponse(inputText, persona, newContext)
      
      // Simulate realistic typing delay (shorter for more natural feel)
      const typingDelay = 800 + Math.random() * 1500
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiResponse])
        setConversationContext(prev => ({
          ...prev,
          messages: [...prev.messages, { role: 'assistant', content: aiResponseText }]
        }))
        setIsTyping(false)

        // Check if AI agreed to a date
        if (detectDateAgreement(aiResponseText)) {
          // Calculate final metrics
          const currentTime = new Date()
          const totalTime = gameMetrics.startTime 
            ? Math.floor((currentTime.getTime() - gameMetrics.startTime.getTime()) / 1000)
            : 0
          
          const finalRizzIndex = calculateRizzIndex(
            gameMetrics.totalWords + userWords,
            totalTime,
            newContext.messageCount
          )

          const finalMetrics: GameMetrics = {
            startTime: gameMetrics.startTime,
            totalWords: gameMetrics.totalWords + userWords,
            totalTime,
            rizzIndex: finalRizzIndex
          }

          // Show game completion popup after a brief delay
          setTimeout(() => {
            setIsGameCompleted(true)
            setGameCompletion({
              isVisible: true,
              metrics: finalMetrics
            })
          }, 1500) // Short delay to let user read the success message
        }
      }, typingDelay)
    } catch (error) {
      console.error('Error generating response:', error)
      // Fallback response with Gen Z energy
              setTimeout(() => {
          const fallbackResponseText = "oop my wifi is being so weird rn 😭 what were you saying bestie?"
          const fallbackResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: fallbackResponseText,
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, fallbackResponse])
          setIsTyping(false)

          // Check fallback response for date agreement (unlikely but just in case)
          if (detectDateAgreement(fallbackResponseText)) {
            const currentTime = new Date()
            const totalTime = gameMetrics.startTime 
              ? Math.floor((currentTime.getTime() - gameMetrics.startTime.getTime()) / 1000)
              : 0
            
            const finalRizzIndex = calculateRizzIndex(
              gameMetrics.totalWords + userWords,
              totalTime,
              newContext.messageCount
            )

            const finalMetrics: GameMetrics = {
              startTime: gameMetrics.startTime,
              totalWords: gameMetrics.totalWords + userWords,
              totalTime,
              rizzIndex: finalRizzIndex
            }

            setTimeout(() => {
              setIsGameCompleted(true)
              setGameCompletion({
                isVisible: true,
                metrics: finalMetrics
              })
            }, 1500)
          }
        }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Function to format time duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) {
      return `${remainingSeconds}s`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  // Function to get rizz rating text
  const getRizzRating = (score: number): { text: string; emoji: string } => {
    if (score >= 90) return { text: "LEGENDARY RIZZ", emoji: "👑" }
    if (score >= 80) return { text: "ELITE RIZZ", emoji: "🔥" }
    if (score >= 70) return { text: "SOLID RIZZ", emoji: "✨" }
    if (score >= 60) return { text: "DECENT RIZZ", emoji: "😎" }
    if (score >= 50) return { text: "AVERAGE RIZZ", emoji: "😊" }
    if (score >= 40) return { text: "NEEDS WORK", emoji: "😅" }
    return { text: "RIZZ-LESS", emoji: "💀" }
  }

  // Game completion popup component
  const GameCompletionPopup = () => {
    if (!gameCompletion.isVisible) return null

    const { metrics } = gameCompletion
    const rating = getRizzRating(metrics.rizzIndex)

    return (
      <div className="game-completion-overlay">
        <div className="game-completion-popup">
          <div className="popup-header">
            <h2>🎉 Date Secured!</h2>
            <p>Congratulations! You successfully asked them out!</p>
          </div>
          
          <div className="metrics-container">
            <div className="rizz-score">
              <div className="score-circle">
                <span className="score-number">{metrics.rizzIndex}</span>
                <span className="score-label">RIZZ</span>
              </div>
              <div className="rating-text">
                <span className="rating-emoji">{rating.emoji}</span>
                <span className="rating-label">{rating.text}</span>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{metrics.totalWords}</span>
                <span className="stat-label">Words Used</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{formatDuration(metrics.totalTime)}</span>
                <span className="stat-label">Time Taken</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{conversationContext.messageCount}</span>
                <span className="stat-label">Messages Sent</span>
              </div>
            </div>
          </div>
          
          <div className="popup-actions">
            <button 
              className="try-again-btn"
              onClick={() => {
                setGameCompletion({ isVisible: false, metrics: { startTime: null, totalWords: 0, totalTime: 0, rizzIndex: 0 }})
                generateNewPersona()
              }}
            >
              Try New Match
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page if not completed
  if (!hasCompletedLanding) {
    return <LandingPage onStart={handleLandingComplete} />
  }

  // Show loading while initializing chat
  if (isLoading || !persona) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner">✨</div>
          <p>Finding your perfect match...</p>
          {apiStatus === 'testing' && <p className="api-status">🔑 Testing AI connection...</p>}
          {apiStatus === 'failed' && <p className="api-status error">⚠️ AI temporarily offline (using fallback)</p>}
          {apiStatus === 'working' && <p className="api-status success">✅ AI ready!</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="contact-info">
            <div className="avatar">{persona.avatar}</div>
            <div className="contact-details">
              <h2 className="contact-name">
                {persona.name}
                {apiStatus === 'failed' && <span className="ai-status-badge">🔄</span>}
                {apiStatus === 'working' && <span className="ai-status-badge">🤖</span>}
              </h2>
              <p className="contact-status">Online</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={generateNewPersona} title="New Match">
              <RefreshCw size={20} />
            </button>
            <button className="header-btn">
              <Video size={20} />
            </button>
            <button className="header-btn">
              <Phone size={20} />
            </button>
            <button className="header-btn">
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Persona Bio */}
      <div className="persona-bio">
        <p>{persona.bio}</p>
        {apiStatus === 'failed' && (
          <p className="api-warning">⚠️ Using fallback responses - check console for details</p>
        )}
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${message.isUser ? 'user' : 'ai'}`}
            >
              <div className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
                <p className="message-text">{message.text}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper ai">
              <div className="message ai-message typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isGameCompleted ? "Game completed! You got the date! 🎉" : "Message"}
            className="message-input"
            rows={1}
            disabled={isTyping || isGameCompleted}
          />
          <button 
            onClick={sendMessage}
            className={`send-button ${inputText.trim() && !isTyping && !isGameCompleted ? 'active' : ''}`}
            disabled={!inputText.trim() || isTyping || isGameCompleted}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Game Completion Popup */}
      <GameCompletionPopup />
    </div>
  )
}

export default App 