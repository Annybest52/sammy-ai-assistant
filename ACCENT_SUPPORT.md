# 🌍 Multi-Accent Support

## Overview

Sammy now supports multiple accents and languages to improve speech recognition accuracy for international customers!

## Supported Accents

### English Variants (25+ countries)
- 🇺🇸 **American English** (`en-US`) - Default
- 🇬🇧 **British English** (`en-GB`)
- 🇳🇬 **Nigerian English** (`en-NG`)
- 🇨🇦 **Canadian English** (`en-CA`)
- 🇦🇺 **Australian English** (`en-AU`)
- 🇳🇿 **New Zealand English** (`en-NZ`)
- 🇮🇳 **Indian English** (`en-IN`)
- 🇵🇰 **Pakistani English** (`en-PK`)
- 🇿🇦 **South African English** (`en-ZA`)
- 🇮🇪 **Irish English** (`en-IE`)
- 🇸🇬 **Singapore English** (`en-SG`)
- 🇵🇭 **Philippine English** (`en-PH`)

### Spanish Variants
- 🇪🇸 **Spanish (Spain)** (`es-ES`)
- 🇲🇽 **Spanish (Mexico)** (`es-MX`)
- 🇦🇷 **Spanish (Argentina)** (`es-AR`)
- 🇨🇴 **Spanish (Colombia)** (`es-CO`)

### Portuguese Variants
- 🇵🇹 **Portuguese (Portugal)** (`pt-PT`)
- 🇧🇷 **Portuguese (Brazil)** (`pt-BR`)

### Other European Languages
- 🇫🇷 **French (France)** (`fr-FR`)
- 🇩🇪 **German** (`de-DE`)
- 🇮🇹 **Italian** (`it-IT`)
- 🇳🇱 **Dutch** (`nl-NL`)
- 🇵🇱 **Polish** (`pl-PL`)
- 🇷🇺 **Russian** (`ru-RU`)

## How It Works

### Auto-Detection
- **Automatically detects** your browser's language/accent
- Uses your system language preference
- Falls back to US English if not detected

### Manual Selection (Future)
- Users can manually select their accent
- Preference saved in browser
- Improves accuracy for specific accents

## Technical Details

### Frontend
- Uses Web Speech API with language-specific recognition
- Accent preference stored in `localStorage`
- Automatically sends accent to backend via WebSocket

### Backend
- Receives accent preference per session
- Uses accent-specific name/email extraction patterns
- Handles accent-specific speech recognition errors

## Benefits

1. **Better Accuracy**: Speech recognition tuned for specific accents
2. **International Support**: Works better for non-US customers
3. **Name Recognition**: Better handling of names from different cultures
4. **Email Parsing**: Improved email recognition for various accents

## Examples

### Nigerian English (`en-NG`)
- Recognizes patterns like "na me be [name]", "my name na", "i be"
- Better handling of Nigerian names
- Improved email recognition
- Phone format: +234 or 0 followed by numbers

### Pakistani English (`en-PK`)
- Recognizes patterns like "mera naam", "mera name"
- Better handling of Pakistani/Indian names
- Phone format: +92 or 0 followed by numbers
- Improved email recognition for .com domains

### Indian English (`en-IN`)
- Recognizes patterns like "mera naam", "name hai"
- Better handling of Indian names
- Phone format: +91 or 0 followed by 10 digits
- Improved email recognition

### British English (`en-GB`)
- Recognizes patterns like "I'm called", "my name's"
- Better handling of British names
- Phone format: +44 or 0 followed by numbers
- Recognizes "dot" instead of "." in emails

### Spanish (`es-ES`, `es-MX`)
- Recognizes patterns like "me llamo", "mi nombre es", "soy"
- Better handling of Spanish names
- Improved recognition for Spanish speakers

### Portuguese (`pt-PT`, `pt-BR`)
- Recognizes patterns like "meu nome é", "eu sou", "chamo-me"
- Better handling of Portuguese/Brazilian names
- Improved recognition for Portuguese speakers

## Future Enhancements

- [ ] Manual accent selection UI
- [ ] Accent-specific voice responses
- [ ] More language support
- [ ] Accent-specific name corrections database

## Testing

To test different accents:
1. Change your browser language settings
2. Refresh the page
3. The bot will automatically use the detected accent
4. Test speech recognition accuracy

---

**Note**: Accent support improves speech recognition but the bot still responds in English. Full multi-language responses are a future enhancement.

