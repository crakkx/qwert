# Text-to-Speech Setup Guide

This project now includes ElevenLabs Text-to-Speech (TTS) functionality that allows NPCs to speak their responses aloud.

## Features Added

### 🎤 TTS Functionality
- **Auto-speak**: NPC responses are automatically spoken when TTS is enabled
- **Manual speak**: Click the "🔊 Speak" button on any NPC message to hear it
- **Voice selection**: Different voices are automatically selected based on NPC characteristics
- **Global toggle**: Enable/disable TTS for the entire chat session

### 🎨 Visual Enhancements
- **Redesigned header**: Removed shadows, added colorful gradients and animations
- **TTS controls**: Clean toggle button in the chat header
- **Message actions**: Speak and translate buttons for each NPC message

## Setup Instructions

### 1. Get ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Create a free account
3. Navigate to your profile settings
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Restart Your Development Server

After adding the environment variable, restart your React development server:

```bash
npm start
```

## How to Use

### Enabling TTS
1. Select an NPC to chat with
2. Click the "🔇 TTS OFF" button in the chat header
3. The button will change to "🔊 TTS ON" (green)
4. All future NPC responses will be automatically spoken

### Manual Speech
- Click the "🔊 Speak" button on any NPC message to hear it again
- The button shows "🔊 Speaking..." while audio is playing

### Voice Selection
The system automatically selects voices based on NPC characteristics:
- **Male voices**: Warriors, fighters, guards, dwarves, orcs
- **Female voices**: Healers, mages, sorcerers, elves, fairies
- **Neutral voice**: Default for other NPCs

## Troubleshooting

### TTS Not Working?
1. **Check API Key**: Ensure your ElevenLabs API key is correctly set in `.env`
2. **Restart Server**: Restart your development server after adding the API key
3. **Check Console**: Look for error messages in the browser console
4. **API Limits**: Free ElevenLabs accounts have usage limits

### Audio Not Playing?
1. **Browser Permissions**: Ensure your browser allows audio playback
2. **Volume**: Check your system and browser volume
3. **Network**: Ensure you have a stable internet connection

### Voice Selection Issues?
The voice selection is based on simple keyword matching. You can modify the logic in `src/services/ttsService.js` in the `getVoiceForNpc()` function.

## Customization

### Adding Custom Voices
1. Get voice IDs from your ElevenLabs dashboard
2. Update the `voices` object in `src/services/ttsService.js`
3. Modify the `getVoiceForNpc()` function for custom voice selection logic

### Voice Settings
You can customize voice parameters in the TTS service:
- `stability`: Controls voice consistency (0.0 - 1.0)
- `similarity_boost`: Controls voice similarity (0.0 - 1.0)
- `style`: Controls voice style (0.0 - 1.0)
- `use_speaker_boost`: Enhances speaker clarity

## API Usage

The free ElevenLabs plan includes:
- 10,000 characters per month
- Access to all voices
- Real-time voice cloning

Monitor your usage in the ElevenLabs dashboard to avoid hitting limits.

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is correct
3. Ensure you have sufficient ElevenLabs credits
4. Check your internet connection

The TTS functionality gracefully handles errors and won't break the chat experience if there are API issues.


