import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Phone, Video, RefreshCw } from 'lucide-react'
import { generateRandomPersona, AIPersona, UserPreferences as PersonaUserPreferences } from './services/personaGenerator'
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
    
    const newPersona = generateRandomPersona(userPreferences || undefined)
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
  const detectDateAgreement = (aiResponse: string, userMessage?: string): boolean => {
    const response = aiResponse.toLowerCase()
    const userMsg = userMessage?.toLowerCase() || ''
    
    console.log('🔍 Checking for date agreement in:', response)
    console.log('🔍 User message context:', userMsg)
    
    // Check if user message contains explicit date invitation words
    const userAskedForDate = /\b(dinner|lunch|coffee|drinks|movie|date|go out|hang out|meet up)\b/.test(userMsg) && 
                             /\b(wanna|want to|would you like to|let['']?s|should we|how about|what about)\b/.test(userMsg)
    console.log('🔍 User asked for date:', userAskedForDate)
    
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
      
      // Response to "want to go out" or similar
      /(sounds good|sounds great|sounds fun|sounds perfect|that sounds amazing)/,
      /(i['d]? love that|i['d]? like that|that would be nice|that would be fun)/,
      
      // When they ask follow-up questions after being asked out (more specific)
      /^(when|where|what time)\??\s*$/,
      /(when (do you|would you|should we)|where (do you|would you|should we)|what time (do you|would you|should we))/,
      
      // Additional Gen Z patterns
      /(that['s]? so cute|you['re]? so sweet|this is so exciting|i['m]? actually excited)/,
      /(no literally|literally yes|actually yes|fr yes|for real yes)/,
      /(omg we should|we totally should|we def should|we definitely should)/,
      
      // Casual agreement patterns
      /(alright|okay|ok|cool|nice|sweet).*(let['s]? do it|sounds good|i['m]? in)/,
      /(why not|sure thing|count me in|i['m]? game|i['m]? up for it)/
    ]
    
    // Context-aware simple agreement patterns (only if user asked for a date)
    const contextualAgreementPatterns = [
      // Simple yes/agreement responses (when user asked for date)
      /^(yes|yeah|yep|sure|absolutely|definitely|totally)/,
      /^(bet|say less|i['m]? down|let['s]? go)/,
      /(yes|yeah|yep|sure|absolutely|definitely|totally).*(!|\.|\?|$)/,
      /(bet|say less|i['m]? down|let['s]? go).*(!|\.|\?|$)/,
      
      // Positive responses to date invitations (more specific)
      /(yes|yeah|yep|sure|absolutely|definitely|totally).*(sounds good|sounds great|sounds fun|sounds perfect)/,
      /(that sounds|that would be).*(good|great|fun|perfect|amazing|nice|cool)/,
      
      // Enthusiastic agreement to date invitations
      /(omg yes|yasss|yesss|hell yes)/,
      /(so down|i['m]? down|let['s]? do it|count me in)/,
      /(that would be (fun|nice|great|perfect|amazing)|i['d]? love (to|that)|i['d]? like (to|that))/,
      
      // Gen Z casual agreements (more specific to date context)
      /(fr that sounds|for real that sounds|no cap that sounds|period let['s]? do it)/,
      /(that['s]? fire|that['s]? lit|that['s]? a vibe).*(let['s]?|we should|sounds good)/,
    ]
    
    // Check standard patterns first
    let hasMatch = dateAgreementPatterns.some(pattern => pattern.test(response))
    
    // If no match yet, check contextual patterns (only if user asked for date)
    if (!hasMatch && userAskedForDate) {
      hasMatch = contextualAgreementPatterns.some(pattern => pattern.test(response))
      if (hasMatch) {
        console.log('🎯 Contextual agreement detected based on user invitation!')
      }
    }
    
    console.log('🎯 Date agreement detected:', hasMatch)
    
    if (hasMatch) {
      console.log('✅ SUCCESS! AI agreed to a date with response:', aiResponse)
    }
    
    return hasMatch
  }

  // Function to check if game should timeout
  const checkGameTimeout = (messageCount: number, startTime: Date | null): boolean => {
    if (!startTime) return false
    
    const currentTime = new Date()
    const timeElapsed = (currentTime.getTime() - startTime.getTime()) / 1000 // seconds
    const timeInMinutes = timeElapsed / 60
    
    // Game over if more than 5 minutes OR 30 messages
    return timeInMinutes > 5 || messageCount >= 30
  }

  // Function to handle game timeout
  const handleGameTimeout = (messageCount: number, wordCount: number) => {
    console.log('⏰ Game timed out! Too slow or too many messages.')
    
    const timeoutMetrics: GameMetrics = {
      startTime: gameMetrics.startTime,
      totalWords: wordCount,
      totalTime: gameMetrics.startTime ? Math.floor((new Date().getTime() - gameMetrics.startTime.getTime()) / 1000) : 0,
      rizzIndex: 0 // Zero rizz for timeout
    }

    // Show timeout popup
    setIsGameCompleted(true)
    setGameCompletion({
      isVisible: true,
      metrics: timeoutMetrics
    })
  }

  // Function to calculate rizz index based on performance (extremely strict now)
  const calculateRizzIndex = (wordCount: number, timeInSeconds: number, messageCount: number): number => {
    const timeInMinutes = timeInSeconds / 60
    console.log('🔢 Rizz calculation - Time:', timeInMinutes.toFixed(2), 'min, Messages:', messageCount)
    
    // LEGENDARY RIZZ: Under 30 seconds AND under 3 messages
    if (timeInSeconds < 30 && messageCount <= 2) {
      console.log('👑 LEGENDARY RIZZ achieved!')
      return 100
    }
    
    // ELITE RIZZ: Under 1 minute AND under 4 messages
    if (timeInMinutes < 1 && messageCount <= 3) {
      console.log('🔥 ELITE RIZZ achieved!')
      return 90 + Math.floor(Math.random() * 10) // 90-99
    }
    
    // Calculate base score purely on time efficiency (70% of score)
    let timeScore = 0
    if (timeInSeconds < 30) timeScore = 95
    else if (timeInSeconds < 60) timeScore = 85
    else if (timeInSeconds < 90) timeScore = 70
    else if (timeInSeconds < 120) timeScore = 55
    else if (timeInSeconds < 180) timeScore = 40
    else if (timeInSeconds < 240) timeScore = 25
    else if (timeInSeconds < 300) timeScore = 10
    else timeScore = 0 // Over 5 minutes = 0 time score
    
    // Message efficiency score (30% of score)
    let messageScore = 0
    if (messageCount <= 2) messageScore = 30
    else if (messageCount <= 3) messageScore = 25
    else if (messageCount <= 5) messageScore = 15
    else if (messageCount <= 8) messageScore = 5
    else if (messageCount <= 12) messageScore = 0
    else messageScore = -10 // Penalty for too many messages
    
    // Combine scores
    let rizzScore = timeScore + messageScore
    
    // Severe penalties for inefficiency
    if (timeInMinutes > 2) rizzScore -= 15
    if (timeInMinutes > 3) rizzScore -= 20
    if (messageCount > 5) rizzScore -= 15
    if (messageCount > 8) rizzScore -= 25
    
    // Word efficiency penalty only (no bonus)
    const wordsPerMessage = wordCount / Math.max(messageCount, 1)
    if (wordsPerMessage > 20) rizzScore -= 10 // Too verbose
    if (wordsPerMessage > 30) rizzScore -= 15 // Way too verbose
    
    // Final score
    const finalScore = Math.max(0, Math.min(100, Math.round(rizzScore)))
    console.log('📊 Final rizz score:', finalScore)
    
    return finalScore
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

    // Check for timeout before generating AI response
    if (checkGameTimeout(newContext.messageCount, gameMetrics.startTime)) {
      setIsTyping(false)
      handleGameTimeout(newContext.messageCount, gameMetrics.totalWords + userWords)
      return
    }

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
        if (detectDateAgreement(aiResponseText, userMessage.text)) {
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
          if (detectDateAgreement(fallbackResponseText, userMessage.text)) {
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
    if (score === 0) return { text: "TIMEOUT", emoji: "⏰" }
    if (score === 100) return { text: "LEGENDARY RIZZ", emoji: "👑" }
    if (score >= 90) return { text: "ELITE RIZZ", emoji: "🔥" }
    if (score >= 75) return { text: "SOLID RIZZ", emoji: "✨" }
    if (score >= 60) return { text: "DECENT RIZZ", emoji: "😎" }
    if (score >= 45) return { text: "AVERAGE RIZZ", emoji: "😊" }
    if (score >= 30) return { text: "WEAK RIZZ", emoji: "😅" }
    if (score >= 15) return { text: "POOR RIZZ", emoji: "😬" }
    return { text: "RIZZ-LESS", emoji: "💀" }
  }

  // Game completion popup component
  const GameCompletionPopup = () => {
    if (!gameCompletion.isVisible) return null

    const { metrics } = gameCompletion
    const rating = getRizzRating(metrics.rizzIndex)
    const isTimeout = metrics.rizzIndex === 0

    return (
      <div className="game-completion-overlay">
        <div className="game-completion-popup">
          <div className="popup-header">
            {isTimeout ? (
              <>
                <h2>⏰ Game Over!</h2>
                <p>Time's up! You took too long or sent too many messages.</p>
                <p className="timeout-message">
                  {metrics.totalTime > 300 ? 'Over 5 minutes' : '30+ messages'} - work on your efficiency!
                </p>
              </>
            ) : (
              <>
                <h2>🎉 Date Secured!</h2>
                <p>Congratulations! You successfully asked them out!</p>
              </>
            )}
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
              {isTimeout ? 'Try Again (Be Faster!)' : 'Try New Match'}
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