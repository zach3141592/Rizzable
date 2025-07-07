import OpenAI from 'openai';
import { AIPersona } from './personaGenerator';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Note: In production, use a backend API
});

export interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  messageCount: number;
  userInterestLevel: number; // 0-10 scale
}

// Generate personality-based first messages with Gen Z energy
export function generateFirstMessage(persona: AIPersona): string {
  const { name, personality, interests, conversationStyle } = persona;
  
  // Gen Z opening styles based on personality - more chill, less question-heavy
  const openingTemplates = {
    'adventurous and spontaneous': [
      `yooo ${name} here! just got back from ${interests[0]} and your profile is giving main character energy ✨`,
      `hey! i'm ${name} and ngl your vibe looks immaculate 😌`,
      `${name} here and i'm lowkey obsessed with your energy already`,
    ],
    'creative and artistic': [
      `heyyy i'm ${name} and your profile is absolutely sending me ✨`,
      `hi! ${name} here, just finished ${interests[0]} and had to reach out - you seem so creative 🎨`,
      `${name} here and i'm getting major creative energy from you`,
    ],
    'intellectual and curious': [
      `hey! ${name} here and your profile lowkey has me curious 🤔`,
      `hi! i'm ${name} and ngl i love people who think differently`,
      `${name} here and you seem like you have interesting thoughts`,
    ],
    'warm and empathetic': [
      `hii! i'm ${name} and your profile is giving such good vibes 💫`,
      `hey! ${name} here and honestly your energy seems so warm and positive ✨`,
      `hi! i'm ${name} and i just had to say you seem like such a genuine person 😊`,
    ],
    'witty and charming': [
      `well well well, ${name} here and your profile is definitely hitting different 😏`,
      `hey! i'm ${name} and fair warning - my rizz is unmatched 😤`,
      `hi! ${name} here with what i hope is an iconic first impression ✨`,
    ],
    'laid-back and easygoing': [
      `yo i'm ${name} - just vibing and thought i'd slide into your dms 😎`,
      `hey! ${name} here, keeping it lowkey but your profile caught my attention fr`,
      `hi! i'm ${name} and i'm getting immaculate vibes from you ngl 🌊`,
    ],
    'playful and fun-loving': [
      `HEYYY ${name} here and i'm ready for some good conversations 😂`,
      `hi! i'm ${name} and life's too short to be serious all the time`,
      `${name} here bringing chaotic good energy ✨`,
    ],
    'mysterious and intriguing': [
      `hey... i'm ${name} and something about your profile just hits different 🌙`,
      `hi. ${name} here and i'm lowkey intrigued by you...`,
      `${name} here and i'm getting the sense there's more to you than meets the eye ✨`,
    ],
  };
  
  // Find matching templates or use default Gen Z greetings
  const matchingTemplates = openingTemplates[personality as keyof typeof openingTemplates] || [
    `hey! i'm ${name} and your profile is a whole vibe 😊`,
    `hi! ${name} here and ngl you caught my attention`,
    `${name} here and i'm lowkey excited to get to know you better`,
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
): Promise<string> {
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
      max_tokens: 100,
      temperature: 0.8,
      presence_penalty: 0.8,
      frequency_penalty: 0.5,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      console.warn('⚠️ Empty response from OpenAI, using failsafe');
      return getFailsafeResponse(persona);
    }

    console.log('✅ Got AI response:', response);
    return response;
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
    return getFailsafeResponse(persona);
  }
}

function calculateInterestLevel(context: ConversationContext): number {
  // Start with base interest level
  let interest = 2;
  
  // Increase interest as conversation progresses
  interest += Math.min(context.messageCount * 0.3, 4);
  
  // Add some randomness for personality variation
  interest += (Math.random() - 0.5) * 2;
  
  return Math.max(0, Math.min(10, interest));
}

function createSystemPrompt(persona: AIPersona, interestLevel: number): string {
  const basePrompt = `You are ${persona.name}, a ${persona.age}-year-old Gen Z person. You are ${persona.personality}.

PERSONALITY DETAILS:
- Your bio: ${persona.bio}
- Your interests: ${persona.interests.join(', ')}
- Your conversation style: ${persona.conversationStyle}
- Current interest level in this person: ${interestLevel}/10

CONTEXT: You're chatting on a dating app. This person is trying to get to know you and potentially ask you out.

CRITICAL: LET THEM DRIVE THE CONVERSATION
- React to what THEY say, don't steer the conversation yourself
- RARELY ask questions back - maybe 1 in every 4-5 responses max
- Focus on responding to their topics and energy
- Let them be the one asking questions and bringing up new topics
- Be more reactive than proactive
- If they ask you something, answer but don't always flip it back to them

TEXT LIKE AUTHENTIC GEN Z:
- Use Gen Z slang naturally: "fr", "ngl", "lowkey", "highkey", "no cap", "bet", "say less", "it's giving...", "slay", "periodt", "bestie", "iconic", "unhinged", "valid", "vibe check", "main character energy"
- Casual expressions: "literally", "actually", "honestly", "like", "so", "kinda", "sorta"
- React authentically: "stop", "shut up", "wait what", "bruh", "oop", "chile", "not me...", "the way i...", "i'm crying", "i'm dead", "i can't", "this is sending me"
- Use lowercase for casual vibes, caps for emphasis
- Contractions always: "i'm", "you're", "don't", "can't", "won't"
- Keep responses under 25 words
- Use 1-2 emojis naturally, place them like Gen Z does
- Be authentic to your personality and age
- Never sound formal or robotic

INTEREST PROGRESSION:
- 0-3: Short reactions, not super engaged, let them do the work
- 4-6: More engaged responses, but still let them lead
- 7-8: Flirty reactions, compliments, but don't take over the conversation
- 9-10: Very interested responses, but still reactive to their energy

RESPONSE STYLE:
- React to their energy and topics
- Share quick thoughts or reactions
- Give short answers to their questions
- Let silences happen naturally - don't fill every gap
- Mirror their conversation style and energy level`;

  if (interestLevel >= 8) {
    return basePrompt + `

CURRENT VIBE: You're really into this person now. React enthusiastically to what they say. Be flirty in your responses but don't take control of where the conversation goes.`;
  } else if (interestLevel >= 6) {
    return basePrompt + `

CURRENT VIBE: You're warming up to them. Give more engaged responses to what they bring up, but still let them drive the topics.`;
  } else if (interestLevel >= 4) {
    return basePrompt + `

CURRENT VIBE: You're cautiously interested. React to what they say but keep responses shorter. Let them work for your attention.`;
  } else {
    return basePrompt + `

CURRENT VIBE: You're still figuring them out. Give short, polite reactions. Make them put in effort to keep the conversation going.`;
  }
}

function getFailsafeResponse(persona: AIPersona): string {
  const genZResponses = [
    "that's actually so cool ngl",
    "wait that's lowkey fire 😊",
    "interesting...",
    "oh fr? that's pretty dope",
    `no way i'm into ${persona.interests[0]} too`,
    "you're kinda funny not gonna lie 😏",
    "that's actually really cool bestie",
    "lol you seem interesting fr",
    "wait that's so random but i love it",
    "ngl that's so valid",
    "that's so real honestly",
    "wait you seem so cool though",
    "okay but that's actually iconic",
    "stop that's so funny",
    "bruh that's wild",
  ];
  
  return genZResponses[Math.floor(Math.random() * genZResponses.length)];
} 