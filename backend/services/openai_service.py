import json
from config import config
from models import AIAnalysis
from utils.logger import logger
from utils.prompts import build_event_analysis_prompt
import random

MOCK_ANALYSES = [
    # Critical - Mass casualties
    AIAnalysis(
        summary="A major earthquake measuring 7.2 magnitude has devastated the region, causing extensive building collapses and infrastructure damage. Thousands reported missing, emergency services overwhelmed.",
        category="natural_disaster",
        severity="critical",
        affected_groups=["residents", "workers", "emergency responders"],
        impact_analysis="Widespread destruction across urban centers with power outages affecting 80% of region. Healthcare systems at capacity. Supply chains disrupted for essential goods.",
        how_to_help="Support international disaster relief organizations. Donate to recognized charities providing earthquake relief. Volunteer with search and rescue efforts.",
        watch_guidance="Monitor seismic activity, structural damage reports, and disease outbreak risks. Track hospital capacity and supply availability."
    ),
    # High - Extreme threat
    AIAnalysis(
        summary="A significant natural disaster has occurred in the region with widespread infrastructure damage. Emergency response efforts are underway by local authorities. Multiple population groups are affected and in need of humanitarian assistance.",
        category="natural_disaster",
        severity="high",
        affected_groups=["residents", "workers", "travelers"],
        impact_analysis="Infrastructure damage reported across transportation and utility systems. Supply chain disruptions expected. Emergency services are coordinating aid distribution and establishing shelters for displaced populations.",
        how_to_help="Support established relief organizations like Red Cross, Red Crescent, or Doctors Without Borders. Provide emergency supplies through verified humanitarian channels. Volunteer with local disaster relief coordination.",
        watch_guidance="Monitor official emergency updates and weather forecasts. Track casualty and displacement reports. Watch for secondary hazards or supply shortages in affected areas."
    ),
    # Medium - Significant impact
    AIAnalysis(
        summary="Significant flooding has affected several neighborhoods causing evacuations and property damage. Local authorities have established emergency shelters and are coordinating rescue operations for stranded residents.",
        category="natural_disaster",
        severity="medium",
        affected_groups=["residents", "farmers", "business owners"],
        impact_analysis="Flooding affecting rural and urban areas with road closures and bridge damage. Agriculture sector experiencing crop losses. Economic impact estimated in millions.",
        how_to_help="Support local relief organizations with donations. Volunteer for cleanup efforts after waters recede. Provide temporary housing resources if available.",
        watch_guidance="Track water level forecasts and weather warnings. Monitor affected area recovery updates. Watch for contamination and disease prevention efforts."
    ),
    # Low - Minor problems
    AIAnalysis(
        summary="Minor flooding in a few localized areas has caused some inconvenience to residents. Local authorities have implemented standard flood management procedures and road diversions are in place.",
        category="natural_disaster",
        severity="low",
        affected_groups=["commuters"],
        impact_analysis="Limited impact on transportation with some roads temporarily closed. Business operations continue with minor disruptions. No major casualties reported.",
        how_to_help="Avoid flood-affected areas to aid emergency response. Share accurate information with neighbors. Support local business recovery.",
        watch_guidance="Follow local weather updates and traffic advisories. Monitor road status for reopening information."
    ),
    # Info - Positive news
    AIAnalysis(
        summary="City successfully completes flood prevention infrastructure project, improving drainage systems and reducing flood risk for residents. Officials confirm readiness for upcoming monsoon season.",
        category="infrastructure",
        severity="info",
        affected_groups=["residents", "businesses"],
        impact_analysis="New infrastructure enhances regional resilience. Drainage capacity increased by 40%. Projected to prevent future flooding incidents.",
        how_to_help="Stay informed about emergency preparedness. Participate in community flood drills and awareness programs.",
        watch_guidance="Monitor infrastructure completion reports and safety announcements. Follow best practices for personal emergency preparedness."
    ),
]

def get_varied_mock_analysis() -> AIAnalysis:
    """Return a random mock analysis with varied severity levels"""
    return random.choice(MOCK_ANALYSES)

class OpenAIService:
    @staticmethod
    def generate_event_analysis(articles_text: str, location: str) -> AIAnalysis:
        """
        Use OpenAI to generate structured event analysis.
        Falls back to mock data if API fails or not configured.
        """
        if config.USE_MOCK_DATA or not config.OPENAI_API_KEY:
            logger.warning("Using mock AI analysis (set USE_MOCK_DATA=false and OPENAI_API_KEY to use real API)")
            return get_varied_mock_analysis()
        
        try:
            from openai import OpenAI
            # Initialize client with only api_key
            client = OpenAI(api_key=config.OPENAI_API_KEY)
            
            prompt = build_event_analysis_prompt(articles_text, location)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a crisis intelligence analyst. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=650
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
                severity=analysis_data.get("severity", "high"),
                affected_groups=analysis_data.get("affected_groups", ["unknown"]),
                impact_analysis=analysis_data.get("impact_analysis", "Impact analysis ongoing."),
                how_to_help=analysis_data.get("how_to_help", "Follow official guidance."),
                watch_guidance=analysis_data.get("watch_guidance", "Monitor for updates.")
            )
            
            logger.info(f"Generated AI analysis for location: {location}")
            return analysis
        
        except Exception as e:
            logger.error(f"OpenAI error: {e}. Using mock analysis.")
            return get_varied_mock_analysis()

openai_service = OpenAIService()
