import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Phone, Video, RefreshCw } from 'lucide-react'
import { generateRandomPersona, AIPersona } from './services/personaGenerator'
import { generateAIResponse, ConversationContext, testOpenAIConnection, generateFirstMessage } from './services/openaiService'
import './App.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

function App() {
  const [persona, setPersona] = useState<AIPersona | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<'testing' | 'working' | 'failed'>('testing')
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    messages: [],
    messageCount: 0,
    userInterestLevel: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Generate initial persona and greeting
  useEffect(() => {
    initializeChat()
  }, [])

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
    initializeChat()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || !persona || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

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
      }, typingDelay)
    } catch (error) {
      console.error('Error generating response:', error)
      // Fallback response with Gen Z energy
      setTimeout(() => {
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "oop my wifi is being so weird rn 😭 what were you saying bestie?",
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, fallbackResponse])
        setIsTyping(false)
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
            placeholder="Message"
            className="message-input"
            rows={1}
            disabled={isTyping}
          />
          <button 
            onClick={sendMessage}
            className={`send-button ${inputText.trim() && !isTyping ? 'active' : ''}`}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App 