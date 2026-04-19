import json
from config import config
from models import AIAnalysis
from utils.logger import logger
from utils.prompts import build_event_analysis_prompt

def generate_mock_analysis_from_text(articles_text: str, location: str) -> AIAnalysis:
    """
    Generate a mock analysis based on actual article text.
    Determines severity and event type from article keywords and content.
    """
    # Extract keywords from the articles to determine event type and severity
    text_lower = articles_text.lower()
    
    # Determine severity based on crisis keywords
    severity = "low"  # Default
    if any(word in text_lower for word in ["critical", "catastrophic", "devastating", "massive", "severe", "worst", "emergency", "thousands", "casualties", "deaths", "fatalities", "maximum"]):
        severity = "critical"
    elif any(word in text_lower for word in ["major", "significant", "widespread", "hundreds", "injured", "damage"]):
        severity = "high"
    elif any(word in text_lower for word in ["reported", "alert", "warning", "minor", "some", "affect"]):
        severity = "medium"
    else:
        severity = "info"
    
    # Determine event category and severity based on keywords
    event_type = "other"
    
    if any(word in text_lower for word in ["flood", "water", "rain", "monsoon", "inundation"]):
        event_type = "flooding"
        summary = f"Flooding has been reported in {location}. Local authorities are monitoring water levels and coordinating emergency response efforts. Residents in affected areas are advised to follow official evacuation orders and take necessary precautions."
        impact = f"Infrastructure and transportation affected in {location}. Local authorities are coordinating relief efforts and establishing temporary shelters."
        watch = "Monitor weather forecasts and water level updates. Follow local emergency alerts and evacuation guidance."
    
    elif any(word in text_lower for word in ["earthquake", "seismic", "magnitude", "tremor"]):
        event_type = "earthquake"
        summary = f"Seismic activity has been reported in {location}. Emergency response teams are assessing damage and providing aid to affected communities. Residents should follow official safety guidance."
        impact = f"Structural assessments underway in {location}. Emergency services coordinating rescue and medical response."
        watch = "Monitor seismic activity updates and official damage reports. Track aftershock warnings."
    
    elif any(word in text_lower for word in ["fire", "wildfire", "explosion", "burn", "petrochemical"]):
        event_type = "fire"
        summary = f"Fire activity has been reported in {location}. Emergency services are responding with evacuation orders in effect for nearby communities. Residents should stay alert to official guidance."
        impact = f"Evacuation alerts issued in {location}. Emergency crews coordinating response and establishing shelters for displaced residents."
        watch = "Monitor fire condition updates and air quality reports. Follow evacuation orders from local authorities."
    
    elif any(word in text_lower for word in ["hurricane", "cyclone", "typhoon", "storm", "tornado"]):
        event_type = "severe_weather"
        summary = f"Severe weather conditions are expected in {location}. Residents are advised to secure property and prepare emergency supplies. Local authorities are issuing weather warnings and preparing emergency resources."
        impact = f"Communities in {location} preparing for severe weather impact. Emergency services on high alert for rapid response."
        watch = "Monitor weather forecasts and official storm warnings. Track power outages and utility status reports."
    
    elif any(word in text_lower for word in ["volcano", "volcanic", "eruption", "lava", "ash"]):
        event_type = "volcanic"
        summary = f"Volcanic activity has been detected in {location}. Authorities have implemented evacuation procedures for nearby communities. Residents should monitor official alerts and follow emergency guidance."
        impact = f"Evacuation underway in {location}. Emergency services monitoring air quality and lava flow patterns."
        watch = "Monitor volcanic activity reports and ash advisories. Follow evacuation orders and air quality warnings."
    
    elif any(word in text_lower for word in ["tsunami", "tidal wave"]):
        event_type = "tsunami"
        summary = f"Tsunami warnings have been issued for {location}. Coastal communities are being advised to move to higher ground. Emergency services are coordinating evacuation procedures."
        impact = f"Coastal areas in {location} evacuated. Emergency services on standby for rescue operations."
        watch = "Monitor tsunami warning center updates. Follow coastal evacuation orders and marine weather alerts."
    
    elif any(word in text_lower for word in ["landslide", "mudslide"]):
        event_type = "landslide"
        summary = f"Landslide hazards have been reported in {location}. Local authorities are monitoring at-risk areas and implementing precautionary measures. Residents in vulnerable zones are advised to remain alert."
        impact = f"Transportation routes affected in {location}. Search and rescue teams on standby for emergency response."
        watch = "Monitor weather forecasts for rainfall. Follow updates on road conditions and evacuation status."
    
    elif any(word in text_lower for word in ["drought", "water crisis"]):
        event_type = "drought"
        summary = f"Severe drought conditions have been reported in {location}. This poses significant risks to water supplies, agriculture, and food security. Authorities are implementing water conservation measures."
        impact = f"Water scarcity affecting communities in {location}. Agricultural impact widespread. Humanitarian concerns escalating."
        watch = "Monitor precipitation forecasts and water availability reports. Track humanitarian aid coordination efforts."
    
    elif any(word in text_lower for word in ["accident", "crash", "incident", "emergency"]):
        event_type = "accident"
        summary = f"An emergency incident has been reported in {location}. Local authorities and emergency services are responding to the situation. More details are emerging as the situation develops."
        impact = f"Emergency response underway in {location}. Traffic and transportation may be affected in the immediate area."
        watch = "Follow local news for incident updates. Monitor traffic reports and emergency announcements."
    
    else:
        # Generic event summary based on location
        summary = f"An event has been reported in {location}. Local authorities are monitoring the situation and coordinating an appropriate response based on the nature of the incident."
        impact = f"Situation developing in {location}. Emergency services are assessing and responding accordingly."
        watch = "Monitor local news and official announcements for updates on this developing situation."
    
    return AIAnalysis(
        summary=summary,
        category=event_type,
        severity=severity,
        affected_groups=["residents", "local authorities", "emergency services"],
        impact_analysis=impact,
        how_to_help="Support recognized humanitarian organizations. Follow official guidance from local authorities. Share accurate information to help keep community informed.",
        watch_guidance=watch
    )

class OpenAIService:
    @staticmethod
    def generate_event_analysis(articles_text: str, location: str) -> AIAnalysis:
        """
        Use OpenAI to generate structured event analysis.
        Falls back to intelligent mock data based on article content if API fails.
        """
        if config.USE_MOCK_DATA or not config.OPENAI_API_KEY:
            logger.info("Generating mock AI analysis from article content")
            return generate_mock_analysis_from_text(articles_text, location)
        
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
            logger.error(f"OpenAI error: {e}. Using intelligent mock analysis.")
            return generate_mock_analysis_from_text(articles_text, location)

openai_service = OpenAIService()
