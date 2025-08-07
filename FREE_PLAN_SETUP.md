# Free Plan Setup Guide

## 🎯 What Changed for Free Plan Compatibility

### ❌ Removed (Blaze Plan Dependencies)
- Firebase Functions (required Blaze plan for external API calls)
- Serverless backend architecture
- Complex deployment process

### ✅ Added (Free Plan Compatible)
- Direct frontend integration with Gemini API
- Simplified architecture
- Environment variable configuration
- No credit card required

## 🏗️ New Architecture

```
Before (Blaze Plan):
React Frontend → Firebase Functions → Gemini API → Firestore

Now (Free Plan):
React Frontend → Gemini API → Firestore
```

## 🔧 Key Changes Made

### 1. AI Service Integration
- Created `src/services/aiService.js` for direct Gemini API calls
- Moved AI logic from Firebase Functions to frontend
- Added proper error handling and API key validation

### 2. Updated Components
- Modified `ChatWindow.js` to use new AI service
- Removed Firebase Functions dependencies
- Updated error messages for better user experience

### 3. Configuration Changes
- Removed Functions from `firebase.json`
- Updated `firebase.js` to remove Functions import
- Added environment variable support for API key

### 4. Documentation Updates
- Updated README.md for free plan compatibility
- Created new QUICK_START.md for simplified setup
- Added troubleshooting for common issues

## 🚀 Benefits of Free Plan Setup

### ✅ Advantages
- **No Credit Card Required**: Completely free to use
- **Simpler Setup**: Fewer moving parts, easier deployment
- **Faster Development**: Direct API calls, no function deployment
- **Lower Latency**: No function cold starts
- **Easier Debugging**: All logic in frontend code

### ⚠️ Considerations
- **API Key Exposure**: API key is in frontend (use environment variables)
- **Rate Limiting**: Subject to browser-based rate limits
- **Security**: Less secure than server-side API calls

## 🔒 Security Best Practices

### For Development
1. Use `.env` file for API keys
2. Add `.env` to `.gitignore`
3. Never commit API keys to version control

### For Production
1. Consider using a proxy service
2. Implement rate limiting
3. Add user authentication
4. Use environment variables in hosting platform

## 📊 Free Plan Limits

### Firebase Firestore (Free Tier)
- **Storage**: 1GB
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day

### Firebase Hosting (Free Tier)
- **Storage**: 10GB
- **Transfer**: 360MB/day
- **Custom domains**: 1

### Google Gemini API
- **Rate limits**: Varies by plan
- **Quota**: Check Google AI Studio dashboard

## 🎮 Usage Examples

### Creating an NPC
```javascript
// NPC data structure
const npcData = {
  name: "Kaelen",
  race: "Wood Elf",
  profession: "Retired Royal Guard",
  personality: "Grumpy, cynical, distrustful of magic",
  voice: "Speaks in short, gruff sentences",
  backstory: "Lost his leg in the Great War"
};
```

### Chatting with NPC
```javascript
// AI service usage
const { npcResponse, playerOptions } = await aiService.generateNpcResponse(
  npcData,
  conversationHistory,
  playerInput
);
```

## 🔧 Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Check `.env` file exists
   - Verify `REACT_APP_GEMINI_API_KEY` is set
   - Restart development server

2. **CORS Errors**
   - Ensure Firebase project is configured
   - Check domain is allowed in Firebase console

3. **Rate Limiting**
   - Check Gemini API quota
   - Implement client-side rate limiting

4. **Firestore Errors**
   - Verify firestore.rules are deployed
   - Check Firebase project configuration

## 🚀 Next Steps

1. **Set up environment variables**
2. **Deploy to Firebase Hosting**
3. **Test with real NPCs**
4. **Monitor usage and limits**
5. **Consider production optimizations**

## 📞 Support

For issues specific to the free plan setup:
1. Check the main README.md
2. Review QUICK_START.md
3. Verify environment variables
4. Test with Firebase emulators 