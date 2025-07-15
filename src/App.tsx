import React, { useState, useRef, useEffect } from 'react'
import { Send, Info, Phone, Video, RefreshCw, Home, Download } from 'lucide-react'
import { generateRandomPersona, AIPersona, UserPreferences as PersonaUserPreferences } from './services/personaGenerator'
import { generateAIResponse, ConversationContext, testOpenAIConnection, generateFirstMessage } from './services/openaiService'
import LandingPage from './components/LandingPage'
import jsPDF from 'jspdf'
import './App.css'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface UserPreferences {
  name: string
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
  isTimeout: boolean
  isFriendzone: boolean
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
    userInterestLevel: 0,
    currentInterestLevel: 1
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
    },
    isTimeout: false,
    isFriendzone: false
  })
  const [isGameCompleted, setIsGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds
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
      userInterestLevel: 0,
      currentInterestLevel: 1
    })
    
    // Initialize game metrics
    setGameMetrics({
      startTime: new Date(),
      totalWords: 0,
      totalTime: 0,
      rizzIndex: 0
    })
    setIsGameCompleted(false)
    setTimeRemaining(300) // Reset countdown to 5 minutes
    setGameCompletion({
      isVisible: false,
      metrics: {
        startTime: new Date(),
        totalWords: 0,
        totalTime: 0,
        rizzIndex: 0
      },
      isTimeout: false,
      isFriendzone: false
    })
    
    setIsLoading(false)
  }

  const generateNewPersona = () => {
    setMessages([])
    setInputText('')
    setConversationContext({
      messages: [],
      messageCount: 0,
      userInterestLevel: 0,
      currentInterestLevel: 1
    })
    setIsGameCompleted(false)
    setTimeRemaining(300) // Reset countdown
    setGameCompletion({
      isVisible: false,
      metrics: {
        startTime: null,
        totalWords: 0,
        totalTime: 0,
        rizzIndex: 0
      },
      isTimeout: false,
      isFriendzone: false
    })
    initializeChat()
  }

  const returnHome = () => {
    // Reset all state and return to landing page
    setHasCompletedLanding(false)
    setUserPreferences(null)
    setPersona(null)
    setMessages([])
    setInputText('')
    setConversationContext({
      messages: [],
      messageCount: 0,
      userInterestLevel: 0,
      currentInterestLevel: 1
    })
    setIsGameCompleted(false)
    setGameCompletion({
      isVisible: false,
      metrics: {
        startTime: null,
        totalWords: 0,
        totalTime: 0,
        rizzIndex: 0
      },
      isTimeout: false,
      isFriendzone: false
    })
    setGameMetrics({
      startTime: null,
      totalWords: 0,
      totalTime: 0,
      rizzIndex: 0
    })
    setTimeRemaining(300) // Reset countdown
    setApiStatus('testing')
    setIsLoading(false)
    setIsTyping(false)
  }

  // Function to detect if AI has friendzoned the user
  const detectFriendzone = (aiResponse: string): boolean => {
    const response = aiResponse.toLowerCase()
    console.log('🔍 Checking for friendzone in response:', response)
    
    // Common friendzone patterns
    const friendzonePatterns = [
      // Direct friendzone statements
      /(let['']?s just be friends|let['']?s stay friends|we should just be friends)/,
      /(i see you as a friend|you['']?re like a friend|think of you as a friend)/,
      /(just friends|only friends|friend vibes|platonic)/,
      /(you['']?re like a brother|you['']?re like a sister|sibling energy)/,
      /(don['']?t want to ruin our friendship|keep our friendship)/,
      /(better as friends|work better as friends|meant to be friends)/,
      /(friend zone|friendzone|friend-zone)/,
      /(not interested romantically|not romantic|no romantic)/,
      /(like you but not that way|like you as a friend)/,
      /(bestie|bro|homie).*(stay|keep|remain|just)/,
      /(friend material|friendship material)/,
      /(value our friendship|friendship is important)/,
      /(don['']?t see you that way|not feeling it romantically)/,
      /(you['']?re sweet but|you['']?re nice but).*(friend|not|don['']?t)/,
      /(appreciate you as a friend|care about you as a friend)/,
      /(let['']?s keep things friendly|keep it friendly)/,
      /(you['']?re a good friend|great friend|amazing friend|best friend)/,
      /(friend energy|giving friend vibes|friendship vibes)/,
      /(not looking for anything romantic|not interested in dating)/,
      /(you['']?re really sweet but|you['']?re cool but).*(friend|not)/,
    ]
    
    const hasMatch = friendzonePatterns.some(pattern => pattern.test(response))
    
    if (hasMatch) {
      console.log('💔 FRIENDZONE DETECTED!')
      return true
    }
    
    console.log('✅ No friendzone detected')
    return false
  }

  // Function to detect if AI has agreed to go on a date
  const detectDateAgreement = (aiResponse: string, userMessage?: string, interestLevel?: number): boolean => {
    const response = aiResponse.toLowerCase()
    const userMsg = userMessage?.toLowerCase() || ''
    const currentInterest = interestLevel || 0
    
    console.log('🔍 Checking for date agreement in:', response)
    console.log('🔍 User message context:', userMsg)
    console.log('🔍 AI interest level:', currentInterest)
    
    // Enhanced user date invitation detection
    const dateActivities = /\b(dinner|lunch|coffee|drinks|movie|date|go out|hang out|meet up|see you|get together|grab)\b/
    const invitationPhrases = /\b(wanna|want to|would you like to|let['']?s|should we|how about|what about|do you want|are you free|free to|up for|down for|interested in)\b/
    const questionMarks = /\?/
    
    const userAskedForDate = dateActivities.test(userMsg) && 
                            (invitationPhrases.test(userMsg) || questionMarks.test(userMsg))
    
    // Also catch direct invitations without specific phrases
    const directInvitations = /\b(date me|ask you out|take you out|see you tonight|see you tomorrow|meet tonight|meet tomorrow)\b/
    const userAskedDirectly = directInvitations.test(userMsg)
    
    const totalUserAsked = userAskedForDate || userAskedDirectly
    console.log('🔍 User asked for date:', totalUserAsked)
    
    // Enhanced check if AI wants to keep talking first (should NOT end game)
    const wantsToTalkMore = [
      // Direct rejections
      /(let['']?s talk more|we should talk more|get to know|know each other better)/,
      /(maybe later|not yet|too soon|too fast|slow down)/,
      /(first let['']?s|maybe we should|i think we should|how about we)/,
      /(take it slow|take things slow|see where this goes|see how things go)/,
      /(chat more|talk a bit more|get to know you better|learn more about)/,
      /(not ready|maybe after|perhaps after|maybe once we)/,
      
      // Speed concerns
      /(rushing|moving fast|taking things fast|moving quick|bit forward|kinda forward|pretty forward)/,
      /(whoa|slow down|hold on|wait|pump the brakes)/,
      
      // Not knowing each other well enough
      /(i barely know you|we just met|don['']?t really know each other|we literally just started)/,
      /(you don['']?t know me|i don['']?t know you|we['']?re strangers)/,
      
      // Uncertain responses
      /(let['']?s see|maybe someday|perhaps|potentially|we['']?ll see|not sure)/,
      /(maybe|might|could|possibly|we['']?ll see how)/,
      
      // Playful deflections
      /(tiger|cutie|bestie|hold your horses|easy there|not so fast)/,
      
      // Want more conversation first
      /(talk first|chat first|vibe first|get a feel|see how we vibe)/,
    ].some(pattern => pattern.test(response))
    
    if (wantsToTalkMore) {
      console.log('💬 AI wants to talk more first - continuing game')
      return false
    }
    
    // Enhanced patterns that indicate date agreement
    const dateAgreementPatterns = [
      // Direct positive responses with date context
      /(yes|yeah|yep|sure|absolutely|definitely|totally|ok|okay).*(dinner|lunch|coffee|drinks|movie|date|go out|hang out|meet up|see you)/,
      /(i['d]? love to|i['d]? like to|i want to|i wanna).*(go|have|get|do|see you|meet|hang out)/,
      
      // Enthusiastic agreements
      /(omg yes|yasss|yesss|hell yes|absolutely|for sure|definitely|count me in)/,
      /(i['m]? so down|so down|i['m]? game|i['m]? up for it|let['s]? do it|why not)/,
      /(sounds (good|great|perfect|amazing|fun|awesome)|would be (nice|fun|great|amazing))/,
      
      // Planning and logistics responses
      /(when|where|what time).*(work|good|best|free|available)/,
      /(what should we|where should we|when works|what time|how about|what about)/,
      /(what did you have in mind|where were you thinking|when works for you|i['m]? free)/,
      
      // Time commitments
      /(tomorrow|tonight|this weekend|friday|saturday|sunday|next week|later|soon)/,
      /(morning|afternoon|evening|7|8|9|pm|am|o['']?clock)/,
      
      // Activity suggestions (showing engagement)
      /(coffee sounds|dinner sounds|lunch sounds|movie sounds|drinks sound)/,
      /(i know a place|there['s]? a great|i love|i['m]? into|that would be)/,
      
      // Excited/eager responses
      /(can['t]? wait|so excited|this is gonna be|looking forward|excited to)/,
      /(pick me up|meet me|see you|text me|call me)/,
      
      // Simple agreements when user clearly asked
      /(sure thing|sounds like a plan|that works|perfect|bet|say less)/,
    ]
    
    // Context-aware simple agreement patterns (when user clearly asked for a date)
    const contextualAgreementPatterns = [
      // Simple positive responses when user asked for date
      /^(yes|yeah|yep|sure|absolutely|definitely|totally|ok|okay)[\s!.😊😍💕]*$/,
      /^(bet|say less|i['m]? down|let['s]? go|for sure)[\s!.😊😍💕]*$/,
      
      // Enthusiastic short responses
      /^(omg yes|yasss|yesss|hell yes|so down)[\s!.😊😍💕]*$/,
      /^(i['m]? so down|count me in|i['m]? game)[\s!.😊😍💕]*$/,
      
      // Positive responses with emojis
      /^(yes|yeah|sure|okay|absolutely).*[😊😍💕😘😏🥺✨💯].*$/,
      
      // Agreement with enthusiasm markers
      /(that sounds|that would be).*(good|great|fun|perfect|amazing|awesome)/,
      /(i['d]? love to|i['d]? like to|i want to).*(go|do that|see you)/,
      /^(why not|sure thing|sounds good|sounds great|sounds perfect)[\s!.😊😍💕]*$/,
    ]
    
    // Check both pattern types
    let hasMatch = dateAgreementPatterns.some(pattern => pattern.test(response))
    
    // If no match yet, check contextual patterns (only if user asked for date)
    if (!hasMatch && totalUserAsked) {
      hasMatch = contextualAgreementPatterns.some(pattern => pattern.test(response))
      if (hasMatch) {
        console.log('🎯 Contextual agreement detected based on user invitation!')
      }
    }
    
    // Additional check for very obvious agreements that might be missed
    const obviousAgreements = [
      /let['s]? do (it|this|that)/,
      /sounds like a plan/,
      /i['m]? excited/,
      /looking forward to/,
      /can['t]? wait/,
      /when (are|should) we/,
      /where (are|should) we/,
      /what time (should|do)/,
      /pick me up/,
      /see you (there|then|tonight|tomorrow)/,
      /text me/,
      /call me/,
    ]
    
    if (!hasMatch && totalUserAsked) {
      hasMatch = obviousAgreements.some(pattern => pattern.test(response))
      if (hasMatch) {
        console.log('🎯 Obvious agreement pattern detected!')
      }
    }
    
    console.log('🎯 Date agreement detected:', hasMatch)
    console.log('🎯 User asked for date:', totalUserAsked)
    console.log('🎯 AI response:', response)
    
    // CRITICAL: Only count as a win if AI has sufficient interest level (4+) AND user actually asked for a date
    if (hasMatch && currentInterest >= 4 && totalUserAsked) {
      console.log('✅ SUCCESS! AI agreed to a date with sufficient interest level:', currentInterest)
      console.log('📋 WIN DETECTION SUMMARY:')
      console.log('   - User asked for date:', totalUserAsked)
      console.log('   - AI agreement detected:', hasMatch)
      console.log('   - AI wants to talk more:', wantsToTalkMore)
      console.log('   - Interest level:', currentInterest, '(need 4+)')
      console.log('   - Game should end:', true)
      return true
    } else if (hasMatch && currentInterest < 4) {
      console.log('❌ AI agreed to date but interest level too low:', currentInterest, '(need 4+)')
      return false
    } else if (hasMatch && !totalUserAsked) {
      console.log('❌ AI seems to agree but user never asked for a date')
      return false
    }
    
    // Final summary
    console.log('📋 DETECTION SUMMARY:')
    console.log('   - User asked for date:', totalUserAsked)
    console.log('   - AI agreement detected:', hasMatch)
    console.log('   - AI wants to talk more:', wantsToTalkMore)
    console.log('   - Interest level:', currentInterest, '(need 4+)')
    console.log('   - Game should end:', false)
    
    return false
  }

  // Function to check if game should timeout
  const checkGameTimeout = (startTime: Date | null): boolean => {
    if (!startTime) return false
    
    const currentTime = new Date()
    const timeElapsed = (currentTime.getTime() - startTime.getTime()) / 1000 // seconds
    
    // Game over if more than 5 minutes (300 seconds)
    return timeElapsed >= 300
  }



  // Function to handle game ending due to friendzone
  const handleFriendzone = (messageCount: number, wordCount: number, interestLevel: number) => {
    console.log('💔 Game ended due to friendzone!')
    
    // Calculate comprehensive rizz score for friendzone
    const totalTime = gameMetrics.startTime ? Math.floor((new Date().getTime() - gameMetrics.startTime.getTime()) / 1000) : 0
    const friendzoneRizzScore = calculateRizzScore(
      wordCount,
      totalTime,
      messageCount,
      interestLevel,
      'friendzone'
    )
    
    const friendzoneMetrics: GameMetrics = {
      startTime: gameMetrics.startTime,
      totalWords: wordCount,
      totalTime: totalTime,
      rizzIndex: friendzoneRizzScore
    }

    // Show friendzone popup
    setIsGameCompleted(true)
    setGameCompletion({
      isVisible: true,
      metrics: friendzoneMetrics,
      isTimeout: false,
      isFriendzone: true
    })
  }

  // Function to handle game timeout
  const handleGameTimeout = (messageCount: number, wordCount: number) => {
    console.log('⏰ Game timed out! Time ran out.')
    
    // Calculate comprehensive rizz score for timeout
    const currentInterestLevel = conversationContext.currentInterestLevel
    const totalTime = gameMetrics.startTime ? Math.floor((new Date().getTime() - gameMetrics.startTime.getTime()) / 1000) : 0
    const timeoutRizzScore = calculateRizzScore(
      wordCount,
      totalTime,
      messageCount,
      currentInterestLevel,
      'timeout'
    )
    
    const timeoutMetrics: GameMetrics = {
      startTime: gameMetrics.startTime,
      totalWords: wordCount,
      totalTime: totalTime,
      rizzIndex: timeoutRizzScore
    }

    // Show timeout popup
    setIsGameCompleted(true)
    setGameCompletion({
      isVisible: true,
      metrics: timeoutMetrics,
      isTimeout: true,
      isFriendzone: false
    })
  }

  // Comprehensive rizz calculation system
  // NOTE: This scoring system considers time and message efficiency for rizz rating
  // These factors do NOT affect game ending conditions (friendzone/success/timeout)
  // Game outcomes are determined by AI responses and interest levels only
  const calculateRizzScore = (
    wordCount: number,
    timeInSeconds: number,
    messageCount: number,
    interestLevel: number,
    gameOutcome: 'success' | 'timeout' | 'friendzone'
  ): number => {
    const timeInMinutes = timeInSeconds / 60
    console.log('🔢 Comprehensive rizz calculation:')
    console.log(`   Time: ${timeInMinutes.toFixed(2)} min, Messages: ${messageCount}`)
    console.log(`   Interest Level: ${interestLevel}/10, Outcome: ${gameOutcome}`)
    
    // Base score multiplier based on game outcome
    let outcomeMultiplier = 1.0
    let baseBonus = 0
    
    switch (gameOutcome) {
      case 'success':
        outcomeMultiplier = 1.0 // Full scoring potential
        baseBonus = 20 // Bonus for securing the date
        break
      case 'timeout':
        outcomeMultiplier = 0.6 // Reduced scoring for timeout
        baseBonus = 0
        break
      case 'friendzone':
        outcomeMultiplier = 0.4 // Lowest scoring for friendzone
        baseBonus = 0
        break
    }
    
    // 1. EFFICIENCY SCORE (40% of total) - Speed and message count
    let efficiencyScore = 0
    
    // Time efficiency (20% of total)
    if (timeInSeconds < 30) efficiencyScore += 20
    else if (timeInSeconds < 60) efficiencyScore += 18
    else if (timeInSeconds < 90) efficiencyScore += 15
    else if (timeInSeconds < 120) efficiencyScore += 12
    else if (timeInSeconds < 180) efficiencyScore += 8
    else if (timeInSeconds < 240) efficiencyScore += 5
    else if (timeInSeconds < 300) efficiencyScore += 2
    else efficiencyScore += 0 // Over 5 minutes = 0 time score
    
    // Message efficiency (20% of total) - always consider for rizz scoring
    if (messageCount <= 2) efficiencyScore += 20
    else if (messageCount <= 3) efficiencyScore += 18
    else if (messageCount <= 5) efficiencyScore += 15
    else if (messageCount <= 8) efficiencyScore += 10
    else if (messageCount <= 12) efficiencyScore += 5
    else if (messageCount <= 20) efficiencyScore += 2
    else efficiencyScore += 0 // Too many messages
    
    // 2. CHARM SCORE (30% of total) - Based on interest level achieved
    let charmScore = Math.min(30, interestLevel * 3) // Max 30 points, 3 points per interest level
    
    // 3. CONSISTENCY SCORE (20% of total) - Word efficiency and conversation flow
    let consistencyScore = 20 // Start with full points
    const wordsPerMessage = wordCount / Math.max(messageCount, 1)
    
    // Optimal range is 8-15 words per message
    if (wordsPerMessage < 3) consistencyScore -= 10 // Too brief
    else if (wordsPerMessage > 25) consistencyScore -= 8 // Too verbose
    else if (wordsPerMessage > 20) consistencyScore -= 5
    else if (wordsPerMessage > 15) consistencyScore -= 2
    
    // 4. LEGENDARY BONUSES - Special achievements
    let legendaryBonus = 0
    if (gameOutcome === 'success') {
      if (timeInSeconds < 30 && messageCount <= 2) {
        legendaryBonus = 20 // LEGENDARY RIZZ
        console.log('👑 LEGENDARY RIZZ BONUS!')
      } else if (timeInSeconds < 60 && messageCount <= 3) {
        legendaryBonus = 15 // ELITE RIZZ
        console.log('🔥 ELITE RIZZ BONUS!')
      } else if (interestLevel >= 9) {
        legendaryBonus = 10 // High charm bonus
        console.log('💖 HIGH CHARM BONUS!')
      }
    }
    
    // Calculate final score
    let rawScore = (efficiencyScore + charmScore + consistencyScore) * outcomeMultiplier
    let finalScore = Math.round(rawScore + baseBonus + legendaryBonus)
    
    // Ensure score is within bounds
    finalScore = Math.max(0, Math.min(100, finalScore))
    
    console.log('📊 Rizz calculation breakdown:')
    console.log(`   Efficiency: ${efficiencyScore}/40 (Time: ${efficiencyScore/2}/20, Messages: ${efficiencyScore/2}/20)`)
    console.log(`   Charm: ${charmScore}/30 (Interest Level: ${interestLevel}/10)`)
    console.log(`   Consistency: ${consistencyScore}/20 (Words/msg: ${wordsPerMessage.toFixed(1)})`)
    console.log(`   Outcome Multiplier: ${outcomeMultiplier}x`)
    console.log(`   Base Bonus: ${baseBonus}`)
    console.log(`   Legendary Bonus: ${legendaryBonus}`)
    console.log(`   Final Score: ${finalScore}/100`)
    
    return finalScore
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Countdown timer effect
  useEffect(() => {
    if (!hasCompletedLanding || !gameMetrics.startTime || isGameCompleted) return

    const timer = setInterval(() => {
      const currentTime = new Date()
      const elapsed = Math.floor((currentTime.getTime() - gameMetrics.startTime!.getTime()) / 1000)
      const remaining = Math.max(0, 300 - elapsed) // 5 minutes = 300 seconds
      
      setTimeRemaining(remaining)
      
      if (remaining <= 0) {
        clearInterval(timer)
        // Trigger game timeout when timer hits 0
        handleGameTimeout(conversationContext.messageCount, gameMetrics.totalWords)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [hasCompletedLanding, gameMetrics.startTime, isGameCompleted, conversationContext.messageCount, gameMetrics.totalWords])

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
      userInterestLevel: conversationContext.userInterestLevel,
      currentInterestLevel: conversationContext.currentInterestLevel
    }
    setConversationContext(newContext)
    setInputText('')
    setIsTyping(true)

    // Check for timeout before generating AI response
    if (checkGameTimeout(gameMetrics.startTime)) {
      setIsTyping(false)
      handleGameTimeout(newContext.messageCount, gameMetrics.totalWords + userWords)
      return
    }

    try {
      console.log('📩 User sent:', inputText)
      
      // Generate AI response using OpenAI
      const aiResponseData = await generateAIResponse(inputText, persona, newContext, userPreferences?.name)
      const aiResponseText = aiResponseData.response
      const currentInterestLevel = aiResponseData.interestLevel
      
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
          messages: [...prev.messages, { role: 'assistant', content: aiResponseText }],
          currentInterestLevel: currentInterestLevel
        }))
        setIsTyping(false)

        // Check if AI has friendzoned the user
        if (detectFriendzone(aiResponseText)) {
          handleFriendzone(newContext.messageCount, gameMetrics.totalWords + userWords, currentInterestLevel)
          return
        }

        // Check if AI agreed to a date AND has sufficient interest level
        if (detectDateAgreement(aiResponseText, userMessage.text, currentInterestLevel)) {
          // Calculate final metrics
          const currentTime = new Date()
          const totalTime = gameMetrics.startTime 
            ? Math.floor((currentTime.getTime() - gameMetrics.startTime.getTime()) / 1000)
            : 0
          
          const finalRizzIndex = calculateRizzScore(
            gameMetrics.totalWords + userWords,
            totalTime,
            newContext.messageCount,
            currentInterestLevel,
            'success'
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
              metrics: finalMetrics,
              isTimeout: false,
              isFriendzone: false
            })
          }, 1500) // Short delay to let user read the success message
        }
      }, typingDelay)
    } catch (error) {
      console.error('Error generating response:', error)
      // Fallback response with Gen Z energy
              setTimeout(() => {
          const fallbackResponses = [
            "oop my wifi is being so weird rn 😭 what were you saying bestie?",
            "omg sorry my phone is literally glitching rn 💀 can you repeat that?",
            "wait hold on my service is trash rn 😤 what did you say?",
            "bestie my phone is acting up... what were you saying? 🥺",
            "ugh technology is not it today 😭 say that again?",
            "sorry babe my wifi said no apparently 💀 what was that?",
          ]
          const fallbackResponseText = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
          const fallbackResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: fallbackResponseText,
            isUser: false,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, fallbackResponse])
          setIsTyping(false)

          // Check fallback response for friendzone (unlikely but just in case)
          if (detectFriendzone(fallbackResponseText)) {
            handleFriendzone(newContext.messageCount, gameMetrics.totalWords + userWords, 1)
            return
          }

          // Check fallback response for date agreement (unlikely but just in case)
          if (detectDateAgreement(fallbackResponseText, userMessage.text, 1)) {
            const currentTime = new Date()
            const totalTime = gameMetrics.startTime 
              ? Math.floor((currentTime.getTime() - gameMetrics.startTime.getTime()) / 1000)
              : 0
            
            const finalRizzIndex = calculateRizzScore(
              gameMetrics.totalWords + userWords,
              totalTime,
              newContext.messageCount,
              1, // Low interest for fallback response
              'success'
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
                metrics: finalMetrics,
                isTimeout: false,
                isFriendzone: false
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

  // Function to format countdown time
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // PDF Export Function
  const exportConversationAsPDF = () => {
    if (!persona || messages.length === 0) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const lineHeight = 7
    let yPosition = margin

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + (lines.length * lineHeight)
    }

    // Add simple header
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(22)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Rizzable Conversation Export', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Add horizontal line
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    // Add rizz rating section (simple)
    const currentMetrics = gameCompletion.isVisible ? gameCompletion.metrics : gameMetrics
    const finalRizzScore = currentMetrics.rizzIndex || 0
    const rating = getRizzRating(finalRizzScore, gameCompletion.isTimeout, gameCompletion.isFriendzone)
    
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`RIZZ RATING: ${finalRizzScore}/100`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text(rating.text, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20

    // Add game stats (simple list)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Game Statistics', margin, yPosition)
    yPosition += 12
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const stats = [
      `Match: ${persona.name}`,
      `Personality: ${persona.personality}`,
      `Messages Sent: ${conversationContext.messageCount}`,
      `Words Used: ${currentMetrics.totalWords}`,
      `Time Taken: ${formatDuration(currentMetrics.totalTime)}`,
      `Final Interest Level: ${conversationContext.currentInterestLevel.toFixed(1)}/10`
    ]

    stats.forEach(stat => {
      pdf.text(`• ${stat}`, margin, yPosition)
      yPosition += 8
    })

    yPosition += 15

    // Add conversation header (simple)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Conversation', margin, yPosition)
    yPosition += 12

    // Add horizontal line
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    // Add conversation messages (simple format)
    pdf.setFontSize(11)
    messages.forEach((message, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }

      // Add timestamp (centered)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      pdf.text(formatTime(message.timestamp), pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      // Add speaker name
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      const speaker = message.isUser ? (userPreferences?.name || 'You') : persona.name
      pdf.text(`${speaker}:`, margin, yPosition)
      yPosition += 8

      // Add message text
      pdf.setFont('helvetica', 'normal')
      yPosition = addWrappedText(message.text, margin, yPosition, pageWidth - 2 * margin, 11)
      yPosition += 10

      // Add separator line between messages
      if (index < messages.length - 1) {
        pdf.setLineWidth(0.2)
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8
      }
    })

    // Add simple footer
    const date = new Date().toLocaleDateString()
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Generated on ${date} by Rizzable`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Save the PDF
    const fileName = `Rizzable_${persona.name}_${date.replace(/\//g, '-')}.pdf`
    pdf.save(fileName)
  }

  // Function to get rizz rating text
  const getRizzRating = (score: number, isTimeout: boolean = false, isFriendzone: boolean = false): { text: string; emoji: string } => {
    if (score === 100) return { text: "LEGENDARY RIZZ", emoji: "" }
    if (score >= 90) return { text: "ELITE RIZZ", emoji: "" }
    if (score >= 75) return { text: "SOLID RIZZ", emoji: "" }
    if (score >= 60) return { text: "DECENT RIZZ", emoji: "" }
    if (score >= 45) return { text: "AVERAGE RIZZ", emoji: "" }
    if (score >= 30) return { text: "WEAK RIZZ", emoji: "" }
    
    // Friendzone-specific messages
    if (isFriendzone) {
      if (score >= 15) return { text: "FRIENDZONED - DECENT EFFORT", emoji: "" }
      if (score >= 10) return { text: "FRIENDZONED - SOME PROGRESS", emoji: "" }
      if (score >= 5) return { text: "FRIENDZONED - WEAK GAME", emoji: "" }
      return { text: "FRIENDZONED - NO RIZZ", emoji: "" }
    }
    
    // Timeout-specific messages
    if (isTimeout) {
      if (score >= 25) return { text: "TIMEOUT - ALMOST HAD IT", emoji: "" }
      if (score >= 20) return { text: "TIMEOUT - GOOD PROGRESS", emoji: "" }
      if (score >= 15) return { text: "TIMEOUT - DECENT EFFORT", emoji: "" }
      if (score >= 10) return { text: "TIMEOUT - SOME PROGRESS", emoji: "" }
      if (score >= 5) return { text: "TIMEOUT - MINIMAL RIZZ", emoji: "" }
    }
    
    if (score >= 15) return { text: "POOR RIZZ", emoji: "" }
    return { text: "RIZZ-LESS", emoji: "" }
  }

  // Game completion popup component
  const GameCompletionPopup = () => {
    if (!gameCompletion.isVisible) return null

    const { metrics, isTimeout, isFriendzone } = gameCompletion
    const rating = getRizzRating(metrics.rizzIndex, isTimeout, isFriendzone)

    return (
      <div className="game-completion-overlay">
        <div className="game-completion-popup">
          <div className="popup-header">
            {isFriendzone ? (
              <>
                <h2>You've Been Friendzoned!</h2>
                <p>They want to keep things platonic. Better luck next time!</p>
                <p className="friendzone-message">
                  Work on your charm and try a different approach.
                </p>
              </>
            ) : isTimeout ? (
              <>
                <h2>Game Over!</h2>
                <p>Time's up! You took too long to make your move.</p>
                <p className="timeout-message">
                  5 minutes passed - work on your efficiency!
                </p>
              </>
            ) : (
              <>
                <h2>Date Secured!</h2>
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
              className="try-again-btn secondary"
              onClick={exportConversationAsPDF}
              title="Export this conversation as PDF"
            >
              <Download size={16} style={{ marginRight: '8px' }} />
              Export PDF
            </button>
            <button 
              className="try-again-btn secondary"
                          onClick={() => {
              setGameCompletion({ isVisible: false, metrics: { startTime: null, totalWords: 0, totalTime: 0, rizzIndex: 0 }, isTimeout: false, isFriendzone: false })
              returnHome()
            }}
            >
              Return Home
            </button>
            <button 
              className="try-again-btn"
                          onClick={() => {
              setGameCompletion({ isVisible: false, metrics: { startTime: null, totalWords: 0, totalTime: 0, rizzIndex: 0 }, isTimeout: false, isFriendzone: false })
              generateNewPersona()
            }}
            >
              {isFriendzone ? 'Try Again (Better Rizz!)' : isTimeout ? 'Try Again (Be Faster!)' : 'Try New Match'}
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
          <div className="loading-spinner"></div>
          <p>Finding your perfect match...</p>
          {apiStatus === 'testing' && <p className="api-status">Testing AI connection...</p>}
          {apiStatus === 'failed' && <p className="api-status error">AI temporarily offline (using fallback)</p>}
          {apiStatus === 'working' && <p className="api-status success">AI ready!</p>}
        </div>
      </div>
    )
  }

  // Function to get interest level display
  const getInterestMeter = (level: number) => {
    const maxLevel = 10
    const filledHearts = Math.min(Math.floor(level), maxLevel)
    const emptyHearts = maxLevel - filledHearts
    
    let statusText = ""
    let statusEmoji = ""
    
    if (level >= 8) {
      statusText = "Absolutely Smitten!"
      statusEmoji = ""
    } else if (level >= 6) {
      statusText = "Really Into You!"
      statusEmoji = ""
    } else if (level >= 4) {
      statusText = "Warming Up"
      statusEmoji = ""
    } else if (level >= 2) {
      statusText = "Open to Charm"
      statusEmoji = ""
    } else {
      statusText = "Just Getting Started"
      statusEmoji = ""
    }
    
    return {
      hearts: "💖".repeat(filledHearts) + "🤍".repeat(emptyHearts),
      statusText,
      statusEmoji,
      level: level.toFixed(1)
    }
  }

  const currentInterestMeter = getInterestMeter(conversationContext.currentInterestLevel)

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
              </h2>
              <p className="contact-status">Online</p>
            </div>
          </div>
          <div className="header-actions">
            <div className={`countdown-timer ${timeRemaining <= 60 ? 'warning' : timeRemaining <= 30 ? 'danger' : ''}`}>
              <span className="countdown-label">Time:</span>
              <span className="countdown-value">{formatCountdown(timeRemaining)}</span>
            </div>
            <button className="header-btn" onClick={returnHome} title="Return Home">
              <Home size={20} />
            </button>
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

      {/* Interest Level Meter */}
      <div className="interest-meter">
        <div className="interest-meter-content">
          <div className="interest-hearts">
            <span className="hearts-display">{currentInterestMeter.hearts}</span>
          </div>
          <div className="interest-status">
            <span className="status-emoji">{currentInterestMeter.statusEmoji}</span>
            <span className="status-text">{currentInterestMeter.statusText}</span>
            <span className="status-level">({currentInterestMeter.level}/10)</span>
          </div>
        </div>
        <div className="interest-tip">
          {conversationContext.currentInterestLevel < 4 
            ? "Try compliments, be funny, show genuine interest - they're open to charm!" 
            : conversationContext.currentInterestLevel < 6
            ? "You're making progress! Keep being charming and flirty."
            : conversationContext.currentInterestLevel < 8
            ? "They're really into you! Great time to ask them out!"
            : "They're absolutely smitten! They'll say yes immediately - ask now!"}
        </div>
      </div>

      {/* Persona Bio */}
      <div className="persona-bio">
        <p>{persona.bio}</p>
        {apiStatus === 'failed' && (
          <p className="api-warning">Using fallback responses - check console for details</p>
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