import json
from config import config
from models import AIAnalysis
from utils.logger import logger
from utils.prompts import build_event_analysis_prompt

MOCK_ANALYSIS = AIAnalysis(
    summary="A significant natural disaster has occurred in the region with immediate humanitarian needs.",
    category="natural_disaster",
    affected_groups=["residents", "workers", "travelers"],
    impact_analysis="Infrastructure damage is reported. Local authorities are coordinating emergency response. Secondary effects may include supply chain disruptions.",
    how_to_help="Donate to established relief organizations. Volunteer through official channels. Avoid unsolicited aid that complicates logistics.",
    watch_guidance="Monitor official emergency management updates. Track weather patterns. Watch for aftershocks or secondary hazards."
)

class OpenAIService:
    @staticmethod
    def generate_event_analysis(articles_text: str, location: str) -> AIAnalysis:
        """
        Use OpenAI to generate structured event analysis.
        Falls back to mock data if API fails or not configured.
        """
        if config.USE_MOCK_DATA or not config.OPENAI_API_KEY:
            logger.warning("Using mock AI analysis (set USE_MOCK_DATA=false and OPENAI_API_KEY to use real API)")
            return MOCK_ANALYSIS
        
        try:
            from openai import OpenAI
            client = OpenAI(api_key=config.OPENAI_API_KEY)
            
            prompt = build_event_analysis_prompt(articles_text, location)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a crisis intelligence analyst. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON from response
            try:
                analysis_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON if response has extra text
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group(0))
                else:
                    raise ValueError("Could not parse JSON from OpenAI response")
            
            analysis = AIAnalysis(
                summary=analysis_data.get("summary", "Event occurred in the region."),
                category=analysis_data.get("category", "other"),
                affected_groups=analysis_data.get("affected_groups", ["unknown"]),
                impact_analysis=analysis_data.get("impact_analysis", "Impact analysis ongoing."),
                how_to_help=analysis_data.get("how_to_help", "Follow official guidance."),
                watch_guidance=analysis_data.get("watch_guidance", "Monitor for updates.")
            )
            
            logger.info(f"Generated AI analysis for location: {location}")
            return analysis
        
        except Exception as e:
            logger.error(f"OpenAI error: {e}. Using mock analysis.")
            return MOCK_ANALYSIS

openai_service = OpenAIService()
