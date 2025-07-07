export interface AIPersona {
  name: string;
  personality: string;
  bio: string;
  avatar: string;
  age: number;
  interests: string[];
  conversationStyle: string;
}

const NAMES = [
  "Alex", "Jordan", "Riley", "Casey", "Morgan", "Avery", "Sage", "River",
  "Phoenix", "Rowan", "Blake", "Cameron", "Emery", "Hayden", "Peyton",
  "Quinn", "Reese", "Skylar", "Taylor", "Drew", "Finley", "Kendall",
  "Lane", "Parker", "Remy", "Shay", "Val", "Wren", "Ari", "Bay"
];

const PERSONALITIES = [
  "adventurous and spontaneous",
  "creative and artistic", 
  "intellectual and curious",
  "warm and empathetic",
  "witty and charming",
  "ambitious and driven",
  "laid-back and easygoing",
  "passionate and intense",
  "quirky and unique",
  "confident and charismatic",
  "thoughtful and introspective",
  "playful and fun-loving",
  "mysterious and intriguing",
  "kind and nurturing",
  "bold and fearless",
  "funny and unhinged",
  "aesthetic and trendy",
  "wholesome and genuine"
];

const INTERESTS = [
  "tiktok", "instagram", "spotify playlists", "vintage shopping", "thrifting",
  "photography", "hiking", "cooking", "reading", "traveling", "music festivals",
  "art", "dancing", "yoga", "gaming", "writing", "movies", "coffee shops",
  "concerts", "museums", "beach days", "city exploring", "food trucks",
  "meditation", "astrology", "fashion", "fitness", "podcasts", "theatre",
  "volunteering", "plant care", "vinyl collecting", "skateboarding", "snowboarding",
  "rock climbing", "surfing", "painting", "pottery", "photography walks",
  "farmers markets", "karaoke", "escape rooms", "mini golf", "arcade games"
];

const CONVERSATION_STYLES = [
  "playful and teasing",
  "deep and meaningful",
  "light and humorous",
  "flirtatious and bold",
  "thoughtful and curious",
  "energetic and enthusiastic",
  "calm and mysterious",
  "witty and sarcastic",
  "sweet and romantic",
  "intellectual and engaging",
  "chaotic and fun",
  "wholesome and genuine",
  "trendy and aesthetic"
];

const AVATARS = [
  "🌟", "✨", "🌙", "🦋", "🌸", "🍃", "🌊", "🔥", "💫", "🌺",
  "🎭", "🎨", "📚", "🎵", "🌻", "🍀", "🌈", "💎", "🎪", "🗝️",
  "🎯", "🎭", "🎲", "🎸", "🎹", "🎪", "🎨", "🎭", "🌟", "✨",
  "🌙", "🦋", "🌸", "🍃", "🌊", "🔥", "💫", "🌺", "🎭", "🎨"
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateRandomPersona(): AIPersona {
  const name = getRandomItem(NAMES);
  const personality = getRandomItem(PERSONALITIES);
  const interests = getRandomItems(INTERESTS, 3 + Math.floor(Math.random() * 3));
  const conversationStyle = getRandomItem(CONVERSATION_STYLES);
  const avatar = getRandomItem(AVATARS);
  const age = 20 + Math.floor(Math.random() * 6); // Age between 20-25 for Gen Z

  // Generate bio based on personality and interests
  const bio = generateBio(personality, interests, age);

  return {
    name,
    personality,
    bio,
    avatar,
    age,
    interests,
    conversationStyle
  };
}

function generateBio(personality: string, interests: string[], age: number): string {
  const templates = [
    `${age} • ${personality} • lowkey obsessed with ${interests[0]} and ${interests[1]} ✨`,
    `${personality} bestie who's into ${interests[0]}, ${interests[1]}, and vibing 💫`,
    `${age} • ${personality} • my feed is all ${interests[0]} and ${interests[1]} content 🌟`,
    `${personality} energy • always down for ${interests[0]} or ${interests[1]} adventures 🌙`,
    `${age} • ${personality} • ${interests[0]} enthusiast and ${interests[1]} lover 🦋`,
    `main character energy • ${personality} • ${interests[0]} + ${interests[1]} = my vibe ✨`,
    `${age} • ${personality} • currently hyperfixated on ${interests[0]} and ${interests[1]} 🌸`,
    `${personality} girlie who's obsessed with ${interests[0]} and ${interests[1]} fr 💫`
  ];
  
  return getRandomItem(templates);
} 