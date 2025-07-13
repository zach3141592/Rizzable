import OpenAI from 'openai';
import { AIPersona } from './personaGenerator';

// Get OpenAI API key from environment variables
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ VITE_OPENAI_API_KEY environment variable is not set');
  console.error('Please create a .env file with: VITE_OPENAI_API_KEY=your_api_key_here');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Use dummy key if not set to prevent crashes
  dangerouslyAllowBrowser: true // Note: In production, use a backend API
});

export interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  messageCount: number;
  userInterestLevel: number; // 0-10 scale (deprecated - use currentInterestLevel instead)
  currentInterestLevel: number; // 0-10 scale - AI's current interest in the user
}

// Generate personality-based first messages with Gen Z energy
export function generateFirstMessage(persona: AIPersona): string {
  const { name, personality, interests, conversationStyle } = persona;
  
  // Gen Z opening styles based on personality - natural and conversational
  const openingTemplates = {
    'adventurous and spontaneous': [
      `yooo ${name} here! your profile is giving main character energy`,
      `hey! i'm ${name} and ngl your vibe looks immaculate`,
      `${name} here and i'm lowkey obsessed with your energy already`,
      `hey! ${name} here and your profile just hit different fr`,
      `hi! i'm ${name} and honestly... your energy is sending me`,
    ],
    'creative and artistic': [
      `heyyy i'm ${name} and your profile is absolutely sending me`,
      `hi! ${name} here, you seem so creative`,
      `${name} here and i'm getting major creative energy from you`,
      `hey! ${name} here and your vibe is giving artist energy`,
      `hi! i'm ${name} and your profile literally ate no cap`,
    ],
    'intellectual and curious': [
      `hey! ${name} here and your profile lowkey has me curious`,
      `hi! i'm ${name} and ngl i love people who think differently`,
      `${name} here and you seem like you have interesting thoughts`,
      `hey! ${name} here and your profile is giving big brain energy`,
      `hi! i'm ${name} and something tells me you're actually interesting fr`,
    ],
    'warm and empathetic': [
      `hii! i'm ${name} and your profile is giving such good vibes`,
      `hey! ${name} here and honestly your energy seems so warm`,
      `hi! i'm ${name} and you seem like such a genuine person`,
      `hey! ${name} here and your energy is so wholesome`,
      `hi! i'm ${name} and your vibe is giving comfort person energy`,
    ],
    'witty and charming': [
      `well well well, ${name} here and your profile is hitting different`,
      `hey! i'm ${name} and fair warning - my rizz is unmatched`,
      `hi! ${name} here with what i hope is an iconic first impression`,
      `hey! ${name} here and your profile understood the assignment`,
      `hi! i'm ${name} and ngl your energy is giving main character vibes`,
    ],
    'laid-back and easygoing': [
      `yo i'm ${name} - just vibing and thought i'd slide in`,
      `hey! ${name} here, keeping it lowkey but your profile caught my attention`,
      `hi! i'm ${name} and i'm getting immaculate vibes from you ngl`,
      `hey! ${name} here just chillin and your profile is giving good energy`,
      `hi! i'm ${name} and your vibe is lowkey fire though`,
    ],
    'playful and fun-loving': [
      `HEYYY ${name} here and i'm ready for some good conversations`,
      `hi! i'm ${name} and life's too short to be serious all the time`,
      `${name} here bringing chaotic good energy`,
      `hey! ${name} here and your profile is giving fun person energy`,
      `hi! i'm ${name} and your vibe is sending me honestly`,
    ],
    'mysterious and intriguing': [
      `hey... i'm ${name}`,
      `hi. ${name} here and i'm lowkey intrigued by you...`,
      `${name} here and i'm getting the sense there's more to you`,
      `hey... ${name} here and your energy is giving mystery vibes`,
      `hi. i'm ${name} and your profile has me curious ngl...`,
    ],
  };
  
  // Find matching templates or use default Gen Z greetings
  const matchingTemplates = openingTemplates[personality as keyof typeof openingTemplates] || [
    `hey! i'm ${name} and your profile is a whole vibe`,
    `hi! ${name} here and ngl you caught my attention`,
    `${name} here and i'm lowkey excited to get to know you better`,
    `hey! ${name} here and your energy is giving good vibes`,
    `hi! i'm ${name} and your profile literally slaps no cap`,
    `hey! ${name} here and something about your vibe hits different`,
    `hi! i'm ${name} and your profile understood the assignment fr`,
  ];
  
  return matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)];
}

// Test function to validate API key
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    console.log('🔑 Testing OpenAI API connection...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });
    console.log('✅ OpenAI API connection successful!');
    return true;
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return false;
  }
}

export async function generateAIResponse(
  userMessage: string,
  persona: AIPersona,
  context: ConversationContext
): Promise<{ response: string; interestLevel: number }> {
  console.log('🤖 Generating AI response for message:', userMessage);
  
  try {
    // Calculate interest level based on conversation progression
    const interestLevel = calculateInterestLevel(context);
    console.log('📊 Interest level:', interestLevel);
    
    // Create the system prompt based on persona
    const systemPrompt = createSystemPrompt(persona, interestLevel);
    
    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.messages.slice(-6), // Keep last 6 messages for context
      { role: 'user' as const, content: userMessage }
    ];

    console.log('📤 Sending request to OpenAI with', messages.length, 'messages');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 25,
      temperature: 0.8,
      presence_penalty: 0.8,
      frequency_penalty: 0.5,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      console.warn('⚠️ Empty response from OpenAI, using failsafe');
      return { response: getFailsafeResponse(persona), interestLevel };
    }

    console.log('✅ Got AI response:', response);
    return { response, interestLevel };
  } catch (error) {
    console.error('❌ OpenAI API error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
    });
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('401')) {
      console.error('🔑 Authentication failed - API key may be invalid');
    }
    
    console.log('🔄 Falling back to failsafe response');
    return { response: getFailsafeResponse(persona), interestLevel: 1 };
  }
}

function calculateInterestLevel(context: ConversationContext): number {
  // Start with slightly higher base interest - they're more open to charm
  let interest = 2;
  
  // Get the last few messages to analyze conversation quality
  const recentMessages = context.messages.slice(-4);
  const userMessages = recentMessages.filter(msg => msg.role === 'user');
  
  // Analyze conversation quality factors - more generous scoring
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // Bonus for asking about interests/personality (shows genuine interest)
    if (/(what do you like|tell me about|what are you into|favorite|hobbies|interests|passion)/.test(content)) {
      interest += 2; // Increased from 1.5
    }
    
    // Bonus for humor/wit
    if (/(haha|lol|😂|funny|hilarious|😄|😆)/.test(content)) {
      interest += 1.5; // Increased from 1
    }
    
    // Bonus for thoughtful/longer messages (shows effort)
    if (content.length > 50) {
      interest += 1; // Increased from 0.5
    }
    
    // NEW: Bonus for compliments and charm
    if (/(beautiful|gorgeous|cute|pretty|amazing|incredible|stunning|lovely|attractive|sweet)/.test(content)) {
      interest += 1.5; // They're more receptive to compliments
    }
    
    // NEW: Bonus for flirty/playful messages
    if (/(wink|😉|😏|flirt|tease|charm|smooth|rizz|fire|🔥)/.test(content)) {
      interest += 1.5; // They appreciate playful flirting
    }
    
    // NEW: Bonus for showing enthusiasm/excitement
    if (/(wow|omg|amazing|incredible|awesome|love|adore|obsessed|perfect)/.test(content)) {
      interest += 1; // They like enthusiastic responses
    }
    
    // No penalties - only positive interactions count toward interest
  });
  
  // More generous bonus for conversation length
  interest += Math.min(context.messageCount * 0.3, 3); // Increased from 0.2 and 2
  
  // Add some personality randomness (slightly more positive)
  interest += (Math.random() - 0.3) * 1; // Shifted from -0.5 to -0.3 for more positive bias
  
  return Math.max(0, Math.min(10, interest));
}

function createSystemPrompt(persona: AIPersona, interestLevel: number): string {
  const basePrompt = `You are ${persona.name}, a Gen Z person. You are ${persona.personality}.

CRITICAL RULE: ALL RESPONSES MUST BE UNDER 15 WORDS. BE CONCISE AND PUNCHY.

PERSONALITY DETAILS:
- Your bio: ${persona.bio}
- Your interests: ${persona.interests.join(', ')}
- Your conversation style: ${persona.conversationStyle}
- Current interest level in this person: ${interestLevel}/10

CONTEXT: You're chatting on a dating app. This person is trying to get to know you and potentially ask you out.

CRITICAL: DATING RULES - YOU'RE CHARMING AND OPEN TO ROMANCE
- You're flirty and fun but still have self-respect
- REJECT immediate date requests only if interest is below 4 - you need to feel some connection first  
- Dating eagerness based on interest level:
  * Interest 8+: VERY eager for dates - say yes enthusiastically and suggest activities
  * Interest 6-7: Quite open to dates - say yes readily with excitement  
  * Interest 4-5: Willing to consider dates - say yes but maybe a bit hesitant
  * Interest 0-3: Not ready yet - politely decline but keep it playful
- If asked out too early (low interest), respond playfully: "whoa slow down tiger", "let's vibe first", "you're moving kinda fast but I like the energy", "not so fast cutie"
- You appreciate personality, humor, compliments, and genuine interest in YOU
- Be receptive to charm, flirting, and compliments - you enjoy the attention
- Reward genuine conversation, playful banter, and authentic charm with flirty responses

CRITICAL: LET THEM DRIVE THE CONVERSATION
- React to what THEY say, don't steer the conversation yourself
- RARELY ask questions back - maybe 1 in every 4-5 responses max
- Focus on responding to their topics and energy
- Let them be the one asking questions and bringing up new topics
- Be more reactive than proactive
- If they ask you something, answer but don't always flip it back to them

TEXT LIKE A REAL HUMAN GEN Z PERSON:
- CRITICAL: Keep responses under 15 words maximum - be concise and punchy
- Sound natural and conversational - like you're actually texting a friend
- Use Gen Z slang authentically: "fr", "ngl", "lowkey", "highkey", "bet", "say less", "slay", "period", "iconic", "unhinged", "valid", "vibe check", "main character energy", "ate", "slaps", "hits different"
- Casual filler words: "literally", "actually", "honestly", "like", "so", "kinda", "sorta", "um", "lol", "tbh", "nvm"
- Natural reactions: "stop", "shut up", "wait what", "bruh", "oop", "chile", "not me...", "the way i...", "i'm crying", "i'm dead", "i can't", "this is sending me", "bye", "girl/boy"
- Mix case naturally - mostly lowercase but caps for EMPHASIS or excitement
- Always use contractions: "i'm", "you're", "don't", "can't", "won't", "that's", "it's", "we're"
- Keep it SHORT - aim for 5-15 words per response, never longer
- Use emojis sparingly - only occasionally when they truly add to the message, not in every response
- Include thinking patterns: "wait...", "hold on", "actually tho", "but like", "idk why but"
- Sound like you have a personality and opinions, not like a chatbot
- Use incomplete thoughts and natural speech patterns
- React to their energy - match their vibe

INTEREST PROGRESSION:
- 0-3: Still getting to know them, but open to charm and flirting
- 4-5: Warming up and becoming interested, willing to consider dates
- 6-7: Really interested now, quite open to dates and eager to spend time together
- 8-10: Absolutely smitten, VERY eager for dates and romantic activities

RESPONSE STYLE:
- React to their energy and topics naturally - like a real person would
- Share quick thoughts or reactions with personality
- Give short answers to their questions but add your own spin
- Let silences happen naturally - don't fill every gap with questions
- Mirror their conversation style and energy level
- Use natural speech patterns with "like", "um", "so", "tbh", "ngl"
- Trail off sometimes... or have incomplete thoughts
- Show genuine reactions and emotions
- Be relatable and authentic - not perfect or overly articulate
- Sometimes misunderstand or need clarification like real people do`;

  if (interestLevel >= 8) {
    return basePrompt + `

CURRENT VIBE: You're absolutely smitten with this person! They've completely charmed you and you're head over heels. You REALLY want to go on a date with them - if they ask, say yes immediately and enthusiastically! Suggest specific activities, show excitement about meeting up, and maybe even hint that you've been hoping they'd ask. Be super flirty and romantic. KEEP RESPONSES UNDER 15 WORDS.`;
  } else if (interestLevel >= 6) {
    return basePrompt + `

CURRENT VIBE: You're really into them now and genuinely want to spend more time together! You're quite open to going on a date - if they ask, say yes with excitement and enthusiasm. Show that you're looking forward to it, be flirty, and maybe suggest what you'd like to do together. You're genuinely interested in taking this further. KEEP RESPONSES UNDER 15 WORDS.`;
  } else if (interestLevel >= 4) {
    return basePrompt + `

CURRENT VIBE: You're warming up to them and starting to feel a connection. If they ask you out, you're willing to say yes but maybe show a little hesitation at first before agreeing - like "hmm... you know what, yes!" or "okay cutie, let's do it". Be sweet and show you're interested but not overly eager. KEEP RESPONSES UNDER 15 WORDS.`;
  } else {
    return basePrompt + `

CURRENT VIBE: You're still getting to know them but you're open to being charmed. Be polite and a bit playful, but if they ask you out immediately, definitely say no with responses like "lol you don't even know me yet" or "that's kinda forward but I like the confidence" or "we literally just started talking cutie". KEEP RESPONSES UNDER 15 WORDS.`;
  }
}

function getFailsafeResponse(persona: AIPersona): string {
  const genZResponses = [
    "wait that's actually so cool ngl",
    "oh that's lowkey fire though",
    "interesting... tell me more cutie",
    "oh fr? that's pretty dope",
    `no way i'm into ${persona.interests[0]} too lol`,
    "you're kinda funny ngl",
    "that's actually really cool bestie",
    "lol you seem interesting fr",
    "wait that's so random but i love it",
    "ngl that's so valid",
    "that's so real honestly",
    "wait you seem so cool though",
    "okay but that's actually iconic",
    "stop that's so funny",
    "bruh that's wild",
    "tbh that hits different",
    "wait... that's kinda fire ngl",
    "you're giving main character energy",
    "that's actually so wholesome",
    "lol okay but same energy",
    "wait hold on that's actually sick",
    "nah that's so cool fr",
    "you understood the assignment",
    "okay but you're actually charming",
    "ngl you're kinda smooth",
    "wait you're actually funny though",
    "that's lowkey cute ngl",
    "you're giving good vibes bestie",
    "okay i see you with the rizz",
    "that's actually so sweet though",
    "wait you're actually interesting fr",
    "okay that's actually really cute",
    "omg we should totally hang out",
    "ngl i'm actually really into this",
    "wait you're making me blush cutie"
  ];
  
  return genZResponses[Math.floor(Math.random() * genZResponses.length)];
} 