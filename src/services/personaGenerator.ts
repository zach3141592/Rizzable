export interface AIPersona {
  name: string;
  personality: string;
  bio: string;
  avatar: string;
  age: number;
  interests: string[];
  conversationStyle: string;
}

const FEMININE_NAMES = [
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia",
  "Harper", "Evelyn", "Abigail", "Emily", "Ella", "Elizabeth", "Camila", "Luna",
  "Sofia", "Avery", "Mila", "Aria", "Scarlett", "Penelope", "Layla", "Chloe",
  "Victoria", "Madison", "Eleanor", "Grace", "Nora", "Riley", "Zoey", "Hannah",
  "Hazel", "Lily", "Ellie", "Violet", "Lillian", "Zoe", "Stella", "Aurora",
  "Natalie", "Emilia", "Everly", "Leah", "Aubrey", "Willow", "Addison", "Lucy",
  "Audrey", "Bella", "Nova", "Brooklyn", "Paisley", "Savannah", "Claire", "Skylar"
];

const MASCULINE_NAMES = [
  "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Alexander",
  "Ethan", "Jacob", "Michael", "Daniel", "Henry", "Jackson", "Sebastian", "Aiden",
  "Matthew", "Samuel", "David", "Joseph", "Carter", "Owen", "Wyatt", "John",
  "Jack", "Luke", "Jayden", "Dylan", "Grayson", "Levi", "Isaac", "Gabriel",
  "Julian", "Mateo", "Anthony", "Jaxon", "Lincoln", "Joshua", "Christopher", "Andrew",
  "Theodore", "Caleb", "Ryan", "Asher", "Nathan", "Thomas", "Leo", "Isaiah",
  "Charles", "Josiah", "Hudson", "Christian", "Hunter", "Connor", "Eli", "Ezra"
];

const NEUTRAL_NAMES = [
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

export interface UserPreferences {
  name: string;
  ageRange: {
    min: number;
    max: number;
  };
  genderIdentity: string;
  sexualOrientation: string;
}

function getNameArrayForPreferences(userPreferences: UserPreferences): string[] {
  const { genderIdentity, sexualOrientation } = userPreferences;
  
  // If user is interested in women
  if (
    (genderIdentity === 'Man' && sexualOrientation === 'Straight') ||
    (genderIdentity === 'Woman' && (sexualOrientation === 'Lesbian' || sexualOrientation === 'Gay')) ||
    (sexualOrientation === 'Bisexual' && Math.random() < 0.5) ||
    (sexualOrientation === 'Pansexual' && Math.random() < 0.4)
  ) {
    return FEMININE_NAMES;
  }
  
  // If user is interested in men
  if (
    (genderIdentity === 'Woman' && sexualOrientation === 'Straight') ||
    (genderIdentity === 'Man' && (sexualOrientation === 'Gay' || sexualOrientation === 'Lesbian')) ||
    (sexualOrientation === 'Bisexual' && Math.random() < 0.5) ||
    (sexualOrientation === 'Pansexual' && Math.random() < 0.4)
  ) {
    return MASCULINE_NAMES;
  }
  
  // Default to neutral names for non-binary, other orientations, etc.
  return NEUTRAL_NAMES;
}

export function generateRandomPersona(userPreferences?: UserPreferences): AIPersona {
  const nameArray = userPreferences ? getNameArrayForPreferences(userPreferences) : NEUTRAL_NAMES;
  const name = getRandomItem(nameArray);
  const personality = getRandomItem(PERSONALITIES);
  const interests = getRandomItems(INTERESTS, 3 + Math.floor(Math.random() * 3));
  const conversationStyle = getRandomItem(CONVERSATION_STYLES);
  const avatar = getRandomItem(AVATARS);
  
  // Use user's preferred age range if available
  const minAge = userPreferences?.ageRange.min || 20;
  const maxAge = userPreferences?.ageRange.max || 25;
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));

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