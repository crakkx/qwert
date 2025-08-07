import axios from 'axios';

// Configuration for Gemini API
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Multiple model endpoints to try as fallbacks
const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
];

class AIService {
  constructor() {
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
    } else {
      console.log('Gemini API key loaded successfully');
    }
  }

  // Detect if this is an important conversation moment that requires branching
  detectImportantMoment(playerInput, conversationHistory, npcData) {
    const input = playerInput.toLowerCase();
    const historyLength = conversationHistory.length;
    
    // Keywords that indicate important moments
    const importantKeywords = [
      'quest', 'mission', 'help', 'dangerous', 'important', 'urgent',
      'secret', 'hidden', 'treasure', 'magic', 'weapon', 'armor',
      'king', 'queen', 'lord', 'lady', 'noble', 'royal',
      'war', 'battle', 'fight', 'enemy', 'threat',
      'love', 'romance', 'marriage', 'relationship',
      'death', 'kill', 'murder', 'revenge',
      'power', 'strength', 'weakness', 'curse',
      'prophecy', 'destiny', 'fate', 'future',
      'past', 'memory', 'forgotten', 'remember',
      'family', 'father', 'mother', 'child', 'son', 'daughter',
      'friend', 'ally', 'enemy', 'betrayal', 'trust'
    ];

    // Check if input contains important keywords
    const hasImportantKeywords = importantKeywords.some(keyword => 
      input.includes(keyword)
    );

    // Check if this is a new conversation (first few messages)
    const isNewConversation = historyLength <= 2;

    // Check if the player is asking for something significant
    const isAskingForHelp = input.includes('help') || input.includes('need') || input.includes('want');
    const isAskingAboutPast = input.includes('past') || input.includes('history') || input.includes('remember');
    const isAskingAboutFuture = input.includes('future') || input.includes('destiny') || input.includes('prophecy');

    // More selective criteria for important moments
    let isImportant = false;
    
    // Only trigger on specific conditions:
    // 1. Very specific important keywords (not just any keyword)
    const criticalKeywords = ['quest', 'mission', 'secret', 'treasure', 'prophecy', 'destiny', 'death', 'kill', 'revenge'];
    const hasCriticalKeywords = criticalKeywords.some(keyword => input.includes(keyword));
    
    // 2. Deep conversation (more than 8 messages) with important topics
    const isDeepConversation = historyLength > 8 && hasImportantKeywords;
    
    // 3. New conversation with very specific requests
    const isNewWithCriticalRequest = isNewConversation && (hasCriticalKeywords || 
      (input.includes('help') && (input.includes('quest') || input.includes('mission') || input.includes('danger'))));
    
    // 4. Random chance for variety (10% chance on longer conversations)
    const randomChance = historyLength > 5 && Math.random() < 0.1;
    
    // 5. Specific emotional or dramatic moments
    const isEmotionalMoment = input.includes('love') || input.includes('hate') || input.includes('betrayal') || 
                             input.includes('family') || input.includes('friend') || input.includes('enemy');
    
    isImportant = hasCriticalKeywords || isDeepConversation || isNewWithCriticalRequest || 
                  (randomChance && isEmotionalMoment) || (historyLength > 12 && Math.random() < 0.15);

    console.log(`Detecting important moment: ${isImportant ? 'YES' : 'NO'}`);
    console.log(`- Critical keywords found: ${hasCriticalKeywords}`);
    console.log(`- Deep conversation: ${isDeepConversation}`);
    console.log(`- New with critical request: ${isNewWithCriticalRequest}`);
    console.log(`- Random chance: ${randomChance}`);
    console.log(`- Emotional moment: ${isEmotionalMoment}`);
    console.log(`- History length: ${historyLength}`);

    return isImportant;
  }

  async makeGeminiRequest(url, prompt, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(`${url}?key=${GEMINI_API_KEY}`, {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        }, {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        });

        return response;
      } catch (error) {
        if (error.response?.status === 503 && attempt < retries) {
          console.log(`503 error on attempt ${attempt + 1}, retrying in ${(attempt + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
          continue;
        }
        throw error;
      }
    }
  }

  async generateNpcResponse(npcData, conversationHistory, playerInput) {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please check your .env file and restart the development server.');
      }

      // Validate API key format (should start with 'AIza')
      if (!GEMINI_API_KEY.startsWith('AIza')) {
        throw new Error('Invalid API key format. Please check your Gemini API key.');
      }

      // Detect if this is an important moment
      const isImportantMoment = this.detectImportantMoment(playerInput, conversationHistory, npcData);

      // Build the prompt
      const characterProfile = `--- CHARACTER PROFILE ---
Name: ${npcData.name}
Race: ${npcData.race || 'Unknown'}
Profession: ${npcData.profession || 'Unknown'}
Personality: ${npcData.personality || 'No personality specified'}
Voice/Speech Pattern: ${npcData.voice || 'No specific voice pattern'}
Backstory: ${npcData.backstory || 'No backstory provided'}`;

      const conversationContext = conversationHistory.length > 0 
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
        : 'No previous conversation history.';

      const importantMomentNote = isImportantMoment 
        ? '\n\n⚠️ IMPORTANT MOMENT DETECTED: This conversation contains significant keywords or is a pivotal moment. Provide a more detailed, emotional, or consequential response that reflects the gravity of the situation.'
        : '';

      const finalPrompt = `You are an AI role-playing as a character in a fantasy RPG setting. 

${characterProfile}

--- CONVERSATION HISTORY ---
${conversationContext}

--- CURRENT INTERACTION ---
Player: ${playerInput}${importantMomentNote}

Instructions:
1. Respond as ${npcData.name} would, staying true to their personality, voice, and backstory
2. Keep responses natural and conversational
3. If this is a new conversation, introduce yourself appropriately
4. Respond in character and maintain consistency with previous interactions
5. Structure your response with proper paragraphs and formatting:
   - Use line breaks to separate different thoughts or topics
   - Use *italics* for emphasis or internal thoughts
   - Use **bold** for important points or strong emotions
   - Use \`code\` for any technical terms, names, or special references
6. Keep responses under 200 words and make them feel natural and in-character
7. If this is an important moment, provide more detailed and consequential responses`;

      // Try each model endpoint
      let lastError;
      for (const modelUrl of GEMINI_MODELS) {
        try {
          const response = await this.makeGeminiRequest(modelUrl, finalPrompt);
          
          if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const npcResponse = response.data.candidates[0].content.parts[0].text.trim();
            
            // Generate branching dialogue options for important moments
            let playerOptions = [];
            if (isImportantMoment) {
              try {
                const optionsPrompt = `Based on this critical conversation moment, generate 3 distinct dialogue options that would lead to COMPLETELY DIFFERENT story paths. Each option should represent a fundamentally different approach or choice the player could make.

Conversation Context:
${conversationContext}

Player: ${playerInput}
${npcData.name}: ${npcResponse}

Generate 3 dialogue options (max 8 words each) that represent different story branches:
1. A diplomatic/peaceful approach that builds trust and friendship
2. An aggressive/confrontational approach that creates tension and conflict
3. A neutral/observant approach that maintains distance and gathers information

Each option should lead to a different narrative direction and story outcome. Return only the options, one per line, no numbering or formatting.`;

                const optionsResponse = await this.makeGeminiRequest(GEMINI_MODELS[0], optionsPrompt);
                if (optionsResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                  const optionsText = optionsResponse.data.candidates[0].content.parts[0].text.trim();
                  playerOptions = optionsText.split('\n').filter(option => option.trim()).slice(0, 3);
                }
              } catch (error) {
                console.error('Error generating dialogue options:', error);
              }
            }

            return {
              npcResponse,
              playerOptions,
              isImportantMoment
            };
          }
        } catch (error) {
          lastError = error;
          console.log(`Failed with model ${modelUrl}:`, error.message);
          continue;
        }
      }

      throw lastError || new Error('All model endpoints failed');

    } catch (error) {
      console.error('Error generating NPC response:', error);
      throw error;
    }
  }

  async generateResponse(prompt) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    for (const modelUrl of GEMINI_MODELS) {
      try {
        const response = await this.makeGeminiRequest(modelUrl, prompt);
        const generatedText = response.data.candidates[0].content.parts[0].text.trim();
        return generatedText;
      } catch (error) {
        console.error(`Response generation failed with model ${modelUrl}:`, error);
        continue;
      }
    }
    
    throw new Error('All response generation attempts failed');
  }

  async translateText(text, targetLanguage = 'Spanish') {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const translationPrompt = `Translate the following text to ${targetLanguage}. Only return the translation, nothing else:

"${text}"`;

      let response = null;
      let lastError = null;

      // Try each model until one works
      for (const modelUrl of GEMINI_MODELS) {
        try {
          response = await this.makeGeminiRequest(modelUrl, translationPrompt);
          break;
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('All Gemini models failed');
      }

      let translation = '';
      if (response.data.candidates && response.data.candidates[0].content) {
        translation = response.data.candidates[0].content.parts[0].text.trim();
      } else {
        translation = 'Translation failed';
      }

      return translation;

    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error('Failed to translate text. Please check your API key and try again.');
    }
  }
}

export default new AIService(); 