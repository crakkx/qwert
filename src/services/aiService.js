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
  detectImportantMoment(playerInput, conversationHistory, npcData, previousPaths = []) {
    const input = playerInput.toLowerCase();
    const historyLength = conversationHistory.length;
    
    // Keywords that indicate important moments
    const criticalKeywords = [
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
      'friend', 'ally', 'enemy', 'betrayal', 'trust',
      'choice', 'decide', 'decision', 'what if', 'should i',
      'tell me', 'explain', 'why', 'how', 'where', 'when'
    ];

    const emotionalKeywords = [
      'afraid', 'scared', 'angry', 'sad', 'happy', 'excited',
      'worried', 'concerned', 'hopeful', 'desperate', 'confused',
      'grateful', 'sorry', 'forgive', 'apologize'
    ];

    const actionKeywords = [
      'join', 'follow', 'leave', 'stay', 'go', 'come',
      'attack', 'defend', 'protect', 'save', 'rescue',
      'give', 'take', 'steal', 'buy', 'sell', 'trade'
    ];

    // Check for different types of important keywords
    const hasCriticalKeywords = criticalKeywords.some(keyword => input.includes(keyword));
    const hasEmotionalKeywords = emotionalKeywords.some(keyword => input.includes(keyword));
    const hasActionKeywords = actionKeywords.some(keyword => input.includes(keyword));

    // Check conversation patterns
    const isEarlyConversation = historyLength <= 3;
    const isMidConversation = historyLength > 3 && historyLength <= 8;
    const isDeepConversation = historyLength > 8;

    // Check if player is asking questions that could lead to branching
    const isAskingQuestions = input.includes('?') || 
                             input.includes('what') || input.includes('how') || 
                             input.includes('why') || input.includes('where') || 
                             input.includes('when') || input.includes('who');

    // Check if player is making decisions or choices
    const isMakingChoices = input.includes('choose') || input.includes('decide') || 
                           input.includes('should i') || input.includes('what if') ||
                           input.includes('rather') || input.includes('instead');

    // Check for story progression indicators
    const isStoryProgression = input.includes('next') || input.includes('then') || 
                              input.includes('after') || input.includes('continue') ||
                              input.includes('happen');

    // Avoid too frequent branching - check if we recently had an important moment
    const recentBranchingCooldown = previousPaths.length > 0 && 
                                   previousPaths[previousPaths.length - 1]?.timestamp &&
                                   (new Date() - new Date(previousPaths[previousPaths.length - 1].timestamp)) < 60000; // 1 minute cooldown

    // Calculate importance score
    let importanceScore = 0;
    
    if (hasCriticalKeywords) importanceScore += 3;
    if (hasEmotionalKeywords) importanceScore += 2;
    if (hasActionKeywords) importanceScore += 2;
    if (isAskingQuestions && isMidConversation) importanceScore += 2;
    if (isMakingChoices) importanceScore += 3;
    if (isStoryProgression) importanceScore += 1;
    if (isDeepConversation && (hasCriticalKeywords || hasEmotionalKeywords)) importanceScore += 2;
    if (isEarlyConversation && hasCriticalKeywords) importanceScore += 2;

    // Random factor for unpredictability (but controlled)
    if (historyLength > 5 && Math.random() < 0.15) importanceScore += 1;

    // Apply cooldown penalty
    if (recentBranchingCooldown) importanceScore = Math.max(0, importanceScore - 2);

    const isImportant = importanceScore >= 4;

    console.log(`Detecting important moment: ${isImportant ? 'YES' : 'NO'} (Score: ${importanceScore})`);
    console.log(`- Critical keywords: ${hasCriticalKeywords} (+3)`);
    console.log(`- Emotional keywords: ${hasEmotionalKeywords} (+2)`);
    console.log(`- Action keywords: ${hasActionKeywords} (+2)`);
    console.log(`- Asking questions (mid-convo): ${isAskingQuestions && isMidConversation} (+2)`);
    console.log(`- Making choices: ${isMakingChoices} (+3)`);
    console.log(`- Story progression: ${isStoryProgression} (+1)`);
    console.log(`- Deep conversation with key topics: ${isDeepConversation && (hasCriticalKeywords || hasEmotionalKeywords)} (+2)`);
    console.log(`- Early conversation with critical: ${isEarlyConversation && hasCriticalKeywords} (+2)`);
    console.log(`- Recent branching cooldown: ${recentBranchingCooldown} (-2)`);
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

  async generateNpcResponse(npcData, conversationHistory, playerInput, previousPaths = []) {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please check your .env file and restart the development server.');
      }

      // Validate API key format (should start with 'AIza')
      if (!GEMINI_API_KEY.startsWith('AIza')) {
        throw new Error('Invalid API key format. Please check your Gemini API key.');
      }

      // Detect if this is an important moment
      const isImportantMoment = this.detectImportantMoment(playerInput, conversationHistory, npcData, previousPaths);

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

      // Build relationship and path context
      const relationshipContext = previousPaths.length > 0 
        ? `\n--- RELATIONSHIP & PATH CONTEXT ---
Current Relationship Status: ${this.getRelationshipDescription(previousPaths)}
Previous Path Choices Summary: ${this.getPathSummary(previousPaths)}
Relationship Trend: ${this.getRelationshipTrend(previousPaths)}
Expected NPC Attitude: ${this.getNPCAttitudeBasedOnHistory(previousPaths, npcData)}\n`
        : '';

      const importantMomentNote = isImportantMoment 
        ? '\n\n⚠️ CRITICAL CONVERSATION MOMENT: This is a branching point that will significantly impact the story direction and character relationships. Generate a response that acknowledges the weight of this moment and reflects the current relationship dynamics.'
        : '';

      const finalPrompt = `You are an AI role-playing as a character in a fantasy RPG setting with dynamic relationship and consequence systems.

${characterProfile}
${relationshipContext}
--- CONVERSATION HISTORY ---
${conversationContext}

--- CURRENT INTERACTION ---
Player: ${playerInput}${importantMomentNote}

RESPONSE GUIDELINES:
1. **Character Consistency**: Respond as ${npcData.name} would, staying true to their personality, voice, and backstory
2. **Relationship Awareness**: Your response should reflect the current relationship status and how previous player choices have affected your attitude toward them
3. **Consequence Acknowledgment**: If the player has made consistent diplomatic/aggressive/neutral choices, your NPC should remember and react accordingly
4. **Emotional Range**: Adjust your emotional tone based on relationship history - be warmer to trusted allies, colder to those who've been hostile
5. **Natural Progression**: Allow relationships to evolve naturally based on player actions
6. **Formatting Guidelines**:
   - Use line breaks to separate different thoughts or topics
   - Use *italics* for emphasis, internal thoughts, or emotional undertones
   - Use **bold** for important points, strong emotions, or crucial information
   - Use \`special terms\` for names, places, or technical references
7. **Response Length**: Keep responses 150-250 words for important moments, 100-150 for regular interactions
8. **Story Impact**: If this is an important moment, acknowledge how the conversation might change your relationship or future interactions

Remember: Your character has a memory of past interactions and should respond with appropriate emotional intelligence based on the established relationship dynamics.`;

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
                // Build context including previous paths to influence future choices
                const pathContext = previousPaths.length > 0 
                  ? `\n--- PREVIOUS PATH CHOICES ---\n${previousPaths.map(p => `${p.choice} (${p.path} path)`).join('\n')}\n`
                  : '';

                const optionsPrompt = `You are creating branching dialogue for an RPG conversation system. Based on this critical conversation moment, generate 3 distinct dialogue options that will create MEANINGFUL STORY CONSEQUENCES and lead to different character relationships and plot outcomes.

CHARACTER CONTEXT:
${characterProfile}
${pathContext}
CONVERSATION HISTORY:
${conversationContext}

CURRENT MOMENT:
Player: ${playerInput}
${npcData.name}: ${npcResponse}

Generate 3 dialogue options that represent fundamentally different approaches with lasting consequences:

1. DIPLOMATIC PATH (🤝): An option that builds trust, shows empathy, and seeks cooperation. This should lead to friendship, alliances, and peaceful resolutions.

2. AGGRESSIVE PATH (⚔️): An option that creates tension, shows dominance, or challenges the NPC. This should lead to conflict, rivalry, and confrontational outcomes.

3. CUNNING/NEUTRAL PATH (👁️): An option that maintains distance, gathers information, or takes a strategic approach. This should lead to cautious relationships and information-gathering opportunities.

REQUIREMENTS:
- Each option should be 4-12 words long
- Options should feel natural and in-character for a player
- Each option should clearly indicate the intended path through tone and word choice
- Avoid generic responses - make them specific to this conversation context
- Consider the NPC's personality and how they might react differently to each approach

Return ONLY the 3 dialogue options, one per line, no numbering or additional text:`;

                const optionsResponse = await this.makeGeminiRequest(GEMINI_MODELS[0], optionsPrompt);
                if (optionsResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                  const optionsText = optionsResponse.data.candidates[0].content.parts[0].text.trim();
                  playerOptions = optionsText.split('\n').filter(option => option.trim()).slice(0, 3);
                  
                  // Clean up options - remove any numbering or formatting
                  playerOptions = playerOptions.map(option => 
                    option.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim()
                  ).filter(option => option.length > 0);
                }
              } catch (error) {
                console.error('Error generating dialogue options:', error);
                // Fallback options if AI generation fails
                playerOptions = [
                  "I understand and want to help you.",
                  "That's not my problem to deal with.",
                  "Tell me more about this situation."
                ];
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

  // Helper methods for relationship and path analysis
  getRelationshipDescription(pathHistory) {
    if (pathHistory.length === 0) return 'Neutral - No significant interactions yet';
    
    const latest = pathHistory[pathHistory.length - 1];
    const relationshipMap = {
      'hostile': 'Hostile - The NPC views the player as an enemy or threat',
      'suspicious': 'Suspicious - The NPC is wary and distrustful of the player',
      'neutral': 'Neutral - The NPC has no strong feelings toward the player',
      'friendly': 'Friendly - The NPC likes and trusts the player',
      'trusted': 'Trusted - The NPC deeply trusts and respects the player'
    };
    
    return relationshipMap[latest.newRelationship] || 'Unknown relationship status';
  }

  getPathSummary(pathHistory) {
    if (pathHistory.length === 0) return 'No previous choices recorded';
    
    const pathCounts = pathHistory.reduce((acc, path) => {
      acc[path.path] = (acc[path.path] || 0) + 1;
      return acc;
    }, {});

    const total = pathHistory.length;
    const diplomatic = pathCounts.diplomatic || 0;
    const aggressive = pathCounts.aggressive || 0;
    const neutral = pathCounts.neutral || 0;

    let dominantPath = 'mixed approach';
    if (diplomatic > aggressive && diplomatic > neutral) {
      dominantPath = 'primarily diplomatic approach';
    } else if (aggressive > diplomatic && aggressive > neutral) {
      dominantPath = 'primarily aggressive approach';
    } else if (neutral > diplomatic && neutral > aggressive) {
      dominantPath = 'primarily cautious/neutral approach';
    }

    return `${total} choices made - ${dominantPath} (Diplomatic: ${diplomatic}, Aggressive: ${aggressive}, Neutral: ${neutral})`;
  }

  getRelationshipTrend(pathHistory) {
    if (pathHistory.length < 2) return 'No trend established yet';
    
    const recent = pathHistory.slice(-3);
    const impacts = recent.map(p => p.impact || 0);
    const avgImpact = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
    
    if (avgImpact > 0.5) return 'Improving - Recent actions have strengthened the relationship';
    if (avgImpact < -0.5) return 'Deteriorating - Recent actions have damaged the relationship';
    return 'Stable - Relationship has remained relatively consistent';
  }

  getNPCAttitudeBasedOnHistory(pathHistory, npcData) {
    if (pathHistory.length === 0) {
      return `Should respond according to their base personality: ${npcData.personality || 'neutral disposition'}`;
    }

    const latest = pathHistory[pathHistory.length - 1];
    const relationshipStatus = latest.newRelationship;
    
    const recentPaths = pathHistory.slice(-3);
    const pathTypes = recentPaths.map(p => p.path);
    const dominantRecentPath = this.getMostFrequent(pathTypes);

    const attitudeMap = {
      'hostile': {
        'diplomatic': 'Grudgingly acknowledge diplomatic efforts but remain hostile and suspicious',
        'aggressive': 'Respond with open hostility, anger, and possibly threats',
        'neutral': 'Cold, dismissive, and unwilling to engage meaningfully'
      },
      'suspicious': {
        'diplomatic': 'Cautiously consider diplomatic overtures but remain guarded',
        'aggressive': 'Become more defensive and possibly escalate to hostility',
        'neutral': 'Maintain distance and respond with short, wary answers'
      },
      'neutral': {
        'diplomatic': 'Be open to friendly interaction and show growing warmth',
        'aggressive': 'Become more cautious and potentially defensive',
        'neutral': 'Maintain polite but unremarkable interactions'
      },
      'friendly': {
        'diplomatic': 'Respond warmly, offer help, and show genuine care',
        'aggressive': 'Express disappointment or hurt but try to de-escalate',
        'neutral': 'Remain friendly but perhaps with slight confusion about mixed signals'
      },
      'trusted': {
        'diplomatic': 'Show deep appreciation, offer valuable assistance or information',
        'aggressive': 'Express shock and deep hurt, questioning the betrayal',
        'neutral': 'Maintain trust but seek clarification about the player\'s intentions'
      }
    };

    return attitudeMap[relationshipStatus]?.[dominantRecentPath] || 
           'Respond according to your natural personality and the established relationship';
  }

  getMostFrequent(array) {
    if (array.length === 0) return 'neutral';
    
    const frequency = array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
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