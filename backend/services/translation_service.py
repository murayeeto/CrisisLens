from config import config
from utils.logger import logger

class TranslationService:
    """Service for translating text using OpenAI."""
    
    LANGUAGE_CODES = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'zh': 'Chinese (Simplified)',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
    }
    
    @classmethod
    def translate_text(cls, text, target_language='en'):
        """
        Translate text to the target language using OpenAI.
        Returns the original text if translation fails or language is English.
        """
        # Return original text if target is English or no text provided
        if not text or target_language == 'en' or target_language not in cls.LANGUAGE_CODES:
            return text
        
        if not config.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured, returning original text")
            return text
        
        try:
            from openai import OpenAI
            import httpx
            
            # Create a client with explicit httpx config to avoid proxy issues
            # Use short timeout to prevent hanging requests
            client = OpenAI(
                api_key=config.OPENAI_API_KEY,
                http_client=httpx.Client(timeout=5.0)  # 5 second timeout per request
            )
            target_lang_name = cls.LANGUAGE_CODES.get(target_language, 'English')
            
            message = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a translator. Translate the following text to {target_lang_name}. Only provide the translated text, nothing else."
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                max_tokens=500,
                temperature=0.3,
                timeout=5,  # 5 second timeout for API call
            )
            
            translated = message.choices[0].message.content.strip()
            logger.info(f"✓ Translated text to {target_lang_name}")
            return translated
            
        except Exception as e:
            logger.warning(f"Translation error (timeout or API issue): {e}, returning original text")
            return text
    
    @classmethod
    def translate_event_summaries(cls, event, target_language='en'):
        """
        Translate all summary fields and title in an event to the target language.
        Modifies the event dict in place and returns it.
        """
        if target_language == 'en':
            return event
        
        # Fields that may contain summaries/text to translate
        summary_fields = ['title', 'aiSummary', 'impactAnalysis', 'howToHelp', 'watchGuidance']
        
        for field in summary_fields:
            if field in event and event[field]:
                event[field] = cls.translate_text(event[field], target_language)
        
        return event
