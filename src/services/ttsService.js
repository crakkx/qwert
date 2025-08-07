// ElevenLabs TTS Service
class TTSService {
  constructor() {
    this.apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.voices = {
      // Male voices
      male_young: 'pNInz6obpgDQGcFmaJgB', // Adam - young male
      male_middle: 'VR6AewLTigWG4xSOukaG', // Josh - middle-aged male
      male_old: 'VR6AewLTigWG4xSOukaG', // Josh - can be adjusted for age
      male_deep: 'pNInz6obpgDQGcFmaJgB', // Adam - deep voice
      
      // Female voices
      female_young: '21m00Tcm4TlvDq8ikWAM', // Rachel - young female
      female_middle: 'AZnzlk1XvdvUeBnXmlld', // Domi - middle-aged female
      female_old: 'AZnzlk1XvdvUeBnXmlld', // Domi - can be adjusted for age
      female_soft: '21m00Tcm4TlvDq8ikWAM', // Rachel - soft voice
      
      // Character voices
      wise_elder: 'VR6AewLTigWG4xSOukaG', // Josh - wise elder
      warrior: 'pNInz6obpgDQGcFmaJgB', // Adam - strong warrior
      mage: '21m00Tcm4TlvDq8ikWAM', // Rachel - mystical mage
      merchant: 'VR6AewLTigWG4xSOukaG', // Josh - friendly merchant
      noble: '21m00Tcm4TlvDq8ikWAM', // Rachel - refined noble
      peasant: 'pNInz6obpgDQGcFmaJgB', // Adam - common peasant
      
      // Neutral fallback
      neutral: 'AZnzlk1XvdvUeBnXmlld', // Domi - neutral
    };
  }

  // Clean text for TTS by removing special characters and markdown
  cleanTextForTTS(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    // Remove markdown formatting
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold text
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Italic text
    cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Code snippets
    cleaned = cleaned.replace(/~~(.*?)~~/g, '$1'); // Strikethrough
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove special characters that shouldn't be spoken
    cleaned = cleaned.replace(/[#@$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ' ');
    
    // Remove multiple spaces and normalize
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Handle common abbreviations and symbols
    cleaned = cleaned.replace(/\b\w+\.\w+\b/g, (match) => {
      // Keep common abbreviations like "Mr.", "Dr.", "etc."
      const commonAbbr = ['mr', 'mrs', 'ms', 'dr', 'prof', 'etc', 'vs', 'etc'];
      const parts = match.toLowerCase().split('.');
      if (commonAbbr.includes(parts[0])) {
        return match;
      }
      return match.replace('.', ' ');
    });
    
    // Clean up punctuation for better speech
    cleaned = cleaned.replace(/([.!?])\s*([.!?])/g, '$1'); // Remove duplicate punctuation
    cleaned = cleaned.replace(/\s+([,.!?])/g, '$1'); // Remove spaces before punctuation
    
    return cleaned;
  }

  // Get available voices from ElevenLabs
  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Analyze NPC characteristics for voice selection
  analyzeNpcCharacteristics(npc) {
    if (!npc) return { voiceId: this.voices.neutral, settings: {} };

    const name = npc.name?.toLowerCase() || '';
    const race = npc.race?.toLowerCase() || '';
    const profession = npc.profession?.toLowerCase() || '';
    const personality = npc.personality?.toLowerCase() || '';
    const voice = npc.voice?.toLowerCase() || '';
    const backstory = npc.backstory?.toLowerCase() || '';

    // Combine all text for analysis
    const allText = `${name} ${race} ${profession} ${personality} ${voice} ${backstory}`;

    // Age analysis
    const ageIndicators = {
      old: ['old', 'elder', 'aged', 'ancient', 'veteran', 'retired', 'grandfather', 'grandmother', 'wise', 'experienced'],
      young: ['young', 'youth', 'teen', 'adolescent', 'child', 'kid', 'junior', 'apprentice'],
      middle: ['middle', 'adult', 'mature', 'grown']
    };

    // Personality analysis
    const personalityTraits = {
      wise: ['wise', 'intelligent', 'knowledgeable', 'learned', 'scholar', 'sage', 'philosopher'],
      aggressive: ['aggressive', 'fierce', 'violent', 'warlike', 'battle-hardened', 'warrior'],
      gentle: ['gentle', 'kind', 'soft', 'caring', 'nurturing', 'healer', 'peaceful'],
      noble: ['noble', 'aristocratic', 'refined', 'elegant', 'sophisticated', 'royal', 'lord', 'lady'],
      rough: ['rough', 'crude', 'coarse', 'uncouth', 'peasant', 'commoner', 'farmer'],
      mysterious: ['mysterious', 'mystical', 'magical', 'enigmatic', 'arcane', 'occult'],
      friendly: ['friendly', 'cheerful', 'merchant', 'trader', 'shopkeeper', 'innkeeper']
    };

    // Profession analysis
    const professionTypes = {
      warrior: ['warrior', 'fighter', 'guard', 'soldier', 'knight', 'paladin', 'barbarian', 'berserker'],
      mage: ['mage', 'wizard', 'sorcerer', 'warlock', 'magician', 'enchanter', 'spellcaster'],
      healer: ['healer', 'cleric', 'priest', 'druid', 'shaman', 'medic', 'doctor'],
      merchant: ['merchant', 'trader', 'shopkeeper', 'innkeeper', 'vendor', 'peddler'],
      noble: ['noble', 'lord', 'lady', 'duke', 'duchess', 'king', 'queen', 'prince', 'princess'],
      peasant: ['peasant', 'farmer', 'laborer', 'worker', 'commoner', 'villager']
    };

    // Race analysis
    const raceTypes = {
      dwarf: ['dwarf', 'dwarven', 'dwarfish'],
      elf: ['elf', 'elven', 'elvish', 'wood elf', 'high elf'],
      orc: ['orc', 'orcish'],
      human: ['human'],
      halfling: ['halfling', 'hobbit'],
      gnome: ['gnome', 'gnomish']
    };

    // Determine age
    let age = 'middle';
    for (const [ageType, indicators] of Object.entries(ageIndicators)) {
      if (indicators.some(indicator => allText.includes(indicator))) {
        age = ageType;
        break;
      }
    }

    // Determine personality
    let personalityType = 'neutral';
    for (const [trait, indicators] of Object.entries(personalityTraits)) {
      if (indicators.some(indicator => allText.includes(indicator))) {
        personalityType = trait;
        break;
      }
    }

    // Determine profession type
    let professionType = 'neutral';
    for (const [prof, indicators] of Object.entries(professionTypes)) {
      if (indicators.some(indicator => allText.includes(indicator))) {
        professionType = prof;
        break;
      }
    }

    // Determine race type
    let raceType = 'human';
    for (const [raceName, indicators] of Object.entries(raceTypes)) {
      if (indicators.some(indicator => allText.includes(indicator))) {
        raceType = raceName;
        break;
      }
    }

    // Gender detection
    const femaleIndicators = ['female', 'woman', 'girl', 'lady', 'queen', 'princess', 'sister', 'daughter', 'mother'];
    const maleIndicators = ['male', 'man', 'boy', 'lord', 'king', 'prince', 'brother', 'son', 'father'];
    
    let gender = 'neutral';
    if (femaleIndicators.some(indicator => allText.includes(indicator))) {
      gender = 'female';
    } else if (maleIndicators.some(indicator => allText.includes(indicator))) {
      gender = 'male';
    }

    return {
      age,
      personalityType,
      professionType,
      raceType,
      gender,
      allText
    };
  }

  // Get voice ID and settings based on NPC characteristics
  getVoiceForNpc(npc) {
    if (!npc) return { voiceId: this.voices.neutral, settings: {} };

    const analysis = this.analyzeNpcCharacteristics(npc);
    const { age, personalityType, professionType, raceType, gender } = analysis;

    // Voice selection logic
    let voiceId = this.voices.neutral;
    let settings = {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true
    };

    // Age-based voice selection
    if (age === 'old') {
      if (gender === 'female') {
        voiceId = this.voices.female_old;
        settings.stability = 0.7; // More stable for older voice
        settings.similarity_boost = 0.6;
      } else if (gender === 'male') {
        voiceId = this.voices.male_old;
        settings.stability = 0.7;
        settings.similarity_boost = 0.6;
      }
    } else if (age === 'young') {
      if (gender === 'female') {
        voiceId = this.voices.female_young;
        settings.stability = 0.4; // Less stable for younger voice
        settings.similarity_boost = 0.4;
      } else if (gender === 'male') {
        voiceId = this.voices.male_young;
        settings.stability = 0.4;
        settings.similarity_boost = 0.4;
      }
    } else {
      // Middle age
      if (gender === 'female') {
        voiceId = this.voices.female_middle;
      } else if (gender === 'male') {
        voiceId = this.voices.male_middle;
      }
    }

    // Profession-based overrides
    if (professionType === 'warrior') {
      voiceId = this.voices.warrior;
      settings.stability = 0.6;
      settings.similarity_boost = 0.7;
    } else if (professionType === 'mage') {
      voiceId = this.voices.mage;
      settings.stability = 0.5;
      settings.similarity_boost = 0.5;
      settings.style = 0.3; // More expressive for mages
    } else if (professionType === 'healer') {
      voiceId = this.voices.female_soft;
      settings.stability = 0.6;
      settings.similarity_boost = 0.6;
    } else if (professionType === 'merchant') {
      voiceId = this.voices.merchant;
      settings.stability = 0.5;
      settings.similarity_boost = 0.5;
    } else if (professionType === 'noble') {
      voiceId = this.voices.noble;
      settings.stability = 0.7;
      settings.similarity_boost = 0.7;
    } else if (professionType === 'peasant') {
      voiceId = this.voices.peasant;
      settings.stability = 0.4;
      settings.similarity_boost = 0.4;
    }

    // Personality-based adjustments
    if (personalityType === 'wise') {
      voiceId = this.voices.wise_elder;
      settings.stability = 0.8;
      settings.similarity_boost = 0.7;
    } else if (personalityType === 'aggressive') {
      settings.stability = 0.6;
      settings.similarity_boost = 0.7;
      settings.style = 0.2;
    } else if (personalityType === 'gentle') {
      settings.stability = 0.6;
      settings.similarity_boost = 0.6;
    } else if (personalityType === 'mysterious') {
      settings.style = 0.4; // More expressive for mysterious characters
    }

    // Race-based adjustments
    if (raceType === 'dwarf') {
      settings.stability = 0.7;
      settings.similarity_boost = 0.6;
    } else if (raceType === 'elf') {
      settings.stability = 0.6;
      settings.similarity_boost = 0.6;
    } else if (raceType === 'orc') {
      settings.stability = 0.5;
      settings.similarity_boost = 0.5;
      settings.style = 0.3;
    }

    return { voiceId, settings };
  }

  // Generate speech from text
  async generateSpeech(text, voiceId = null, settings = {}) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set REACT_APP_ELEVENLABS_API_KEY in your environment variables.');
    }

    if (!text || text.trim() === '') {
      throw new Error('Text is required for speech generation.');
    }

    // Clean the text for TTS
    const cleanedText = this.cleanTextForTTS(text);
    
    if (!cleanedText || cleanedText.trim() === '') {
      throw new Error('No valid text content found after cleaning.');
    }

    // Use default voice if none specified
    const selectedVoiceId = voiceId || this.voices.neutral;

    const requestBody = {
      text: cleanedText.trim(),
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: settings.stability || 0.5,
        similarity_boost: settings.similarity_boost || 0.5,
        style: settings.style || 0.0,
        use_speaker_boost: settings.use_speaker_boost || true,
      },
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${selectedVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
      }

      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  // Play audio blob
  playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };

      audio.play().catch(reject);
    });
  }

  // Generate and play speech in one function
  async speak(text, voiceId = null, settings = {}) {
    try {
      const audioBlob = await this.generateSpeech(text, voiceId, settings);
      await this.playAudio(audioBlob);
      return true;
    } catch (error) {
      console.error('Error in speak function:', error);
      throw error;
    }
  }

  // Stop current audio playback
  stopAudio() {
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Check if TTS is available
  isAvailable() {
    return !!this.apiKey;
  }

  // Get voice analysis for debugging
  getVoiceAnalysis(npc) {
    return this.analyzeNpcCharacteristics(npc);
  }
}

// Create and export a singleton instance
const ttsService = new TTSService();
export default ttsService;
