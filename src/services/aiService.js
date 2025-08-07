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

      const finalPrompt = `You are an AI role-playing as a character in a fantasy RPG setting. 

${characterProfile}

--- CONVERSATION HISTORY ---
${conversationContext}

--- CURRENT INTERACTION ---
Player: ${playerInput}

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
7. Format your response with clear paragraphs and proper spacing

Generate ${npcData.name}'s response to the player's message. Structure it with proper formatting and paragraphs.`;

      console.log('Sending request to Gemini API...');
      
      let response = null;
      let lastError = null;

      // Try each model until one works
      for (const modelUrl of GEMINI_MODELS) {
        try {
          console.log(`Trying model: ${modelUrl.split('/').pop()}`);
          response = await this.makeGeminiRequest(modelUrl, finalPrompt);
          console.log(`Success with model: ${modelUrl.split('/').pop()}`);
          break;
        } catch (error) {
          console.log(`Failed with model ${modelUrl.split('/').pop()}: ${error.response?.status || error.message}`);
          lastError = error;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('All Gemini models failed');
      }

      let npcResponse = '';
      let playerOptions = [];

      if (response.data.candidates && response.data.candidates[0].content) {
        npcResponse = response.data.candidates[0].content.parts[0].text.trim();
        
        // Try to parse JSON response for dialogue options
        try {
          const jsonMatch = npcResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.npc_response && parsed.player_options) {
              npcResponse = parsed.npc_response;
              playerOptions = parsed.player_options;
            }
          }
        } catch (e) {
          // If JSON parsing fails, use the response as-is
          console.log('Response is not JSON format, using as plain text');
        }
      } else {
        npcResponse = "I'm not sure how to respond to that right now.";
      }

      return {
        npcResponse,
        playerOptions
      };

    } catch (error) {
      console.error('Error generating NPC response:', error);
      
      // Provide more specific error messages
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 400) {
          throw new Error('Invalid request to Gemini API. Please check your API key and request format.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. Please check your Gemini API key and ensure it has the correct permissions.');
        } else if (error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.response.status === 503) {
          throw new Error('Gemini API service is temporarily unavailable. Please try again in a few moments.');
        } else {
          throw new Error(`Gemini API error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from Gemini API. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Error setting up request: ${error.message}`);
      }
    }
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