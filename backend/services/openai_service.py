import json
import re
from typing import Dict, List, Set
from config import config
from models import AIAnalysis
from utils.logger import logger
from utils.prompts import build_event_analysis_prompt

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "by", "for", "from",
    "has", "have", "in", "into", "is", "it", "its", "of", "on", "or", "that", "the",
    "their", "this", "to", "was", "were", "will", "with", "after", "before", "about",
    "over", "under", "during", "through", "amid", "more", "than", "new", "latest",
    "says", "say", "report", "reported", "reporting", "officials", "official", "local",
}

GENERIC_SUMMARY_PHRASES = [
    "has been reported in",
    "authorities are monitoring",
    "emergency services are responding",
    "residents are advised",
    "situation is developing",
    "coordinating emergency response",
    "more details are emerging",
]

CATEGORY_KEYWORDS = {
    "natural_disaster": [
        "flood", "flooding", "flash flood", "storm", "tornado", "hurricane", "cyclone",
        "typhoon", "earthquake", "wildfire", "fire", "heatwave", "landslide", "mudslide",
        "tsunami", "eruption", "volcanic", "drought", "monsoon", "ash",
    ],
    "conflict": [
        "conflict", "war", "attack", "missile", "shelling", "airstrike", "raid",
        "troops", "military", "violence", "fighters",
    ],
    "epidemic": [
        "outbreak", "virus", "disease", "epidemic", "pandemic", "cholera", "measles",
        "infection", "health emergency",
    ],
    "accident": [
        "crash", "collision", "explosion", "derailment", "accident", "industrial",
        "chemical", "spill", "collapse", "blast",
    ],
    "humanitarian": [
        "humanitarian", "aid", "relief", "displaced", "refugees", "shelter", "shortage",
        "famine", "food insecurity", "evacuation center",
    ],
    "infrastructure": [
        "power outage", "blackout", "airport", "rail", "bridge", "port", "highway",
        "road closure", "water system", "grid", "telecom", "utility",
    ],
}

FOLLOW_UP_KEYWORDS = [
    "hearing", "court", "judge", "lawsuit", "lawmakers", "visit", "investigation",
    "probe", "review", "response", "recovery", "rebuild", "aid", "anniversary",
    "memorial", "inspection",
]

IMPACT_PATTERNS = {
    "fatalities": ["fatalities", "killed", "dead", "deaths"],
    "injuries": ["injured", "hospitalized", "wounded"],
    "evacuations": ["evacuation", "evacuated", "evacuations", "shelter"],
    "closures": ["closed", "closure", "shutdown", "suspended", "blocked", "canceled"],
    "outages": ["outage", "blackout", "power cut", "without power"],
    "damage": ["damage", "destroyed", "collapsed", "washout", "devastated"],
    "response": ["rescue", "search", "crews", "response", "aid", "relief"],
    "accountability": ["hearing", "court", "investigation", "lawmakers", "visit", "probe", "review"],
}

AFFECTED_GROUP_PATTERNS = {
    "residents": ["resident", "residents", "community", "communities", "neighborhood"],
    "families": ["family", "families"],
    "campers and staff": ["camp", "campers", "staff"],
    "lawmakers": ["lawmakers", "legislators", "senators", "lawmakers"],
    "travelers": ["travelers", "travellers", "commuters", "drivers", "passengers"],
    "workers": ["workers", "employees", "staff", "crew", "crews"],
    "students": ["students", "school", "campus"],
    "patients": ["patients", "hospital", "clinic"],
    "emergency crews": ["firefighters", "responders", "rescue teams", "emergency crews"],
}

WATCH_GUIDANCE_BY_CATEGORY = {
    "natural_disaster": "Watch for official hazard updates, evacuation changes, closures, and confirmed damage figures.",
    "conflict": "Watch for verified security updates, evacuation guidance, and confirmed casualty or displacement figures.",
    "epidemic": "Watch for confirmed case trends, official health guidance, and any changes to local restrictions or hospital load.",
    "accident": "Watch for investigation findings, casualty updates, closures, and safety advisories.",
    "humanitarian": "Watch for aid access, displacement figures, shelter capacity, and official recovery updates.",
    "infrastructure": "Watch for restoration timelines, service disruptions, closures, and official repair updates.",
    "other": "Watch for confirmed updates from officials and local reporting as the situation develops.",
}


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _tokenize(text: str) -> Set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z][a-zA-Z'-]+", (text or "").lower())
        if len(token) > 2 and token not in STOPWORDS
    }


def _sentence_case(text: str) -> str:
    cleaned = _normalize_whitespace(text)
    if not cleaned:
        return ""
    if ":" in cleaned:
        prefix, rest = cleaned.split(":", 1)
        if len(prefix.split()) <= 4 and len(rest.split()) >= 4:
            cleaned = rest.strip()
    if cleaned[-1] not in ".!?":
        cleaned += "."
    return cleaned


def _split_sentences(text: str) -> List[str]:
    normalized = _normalize_whitespace(text)
    if not normalized:
        return []

    parts = re.split(r"(?<=[.!?])\s+", normalized)
    cleaned_parts = []
    for part in parts:
        candidate = _normalize_whitespace(part)
        if not candidate:
            continue
        if candidate[-1] not in ".!?":
            candidate += "."
        cleaned_parts.append(candidate)
    return cleaned_parts


def _extract_article_blocks(articles_text: str) -> List[Dict[str, str]]:
    blocks: List[Dict[str, str]] = []
    current: Dict[str, str] = {}

    for raw_line in (articles_text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        lower = line.lower()
        if lower.startswith("title:"):
            if current:
                blocks.append(current)
                current = {}
            current["title"] = line.split(":", 1)[1].strip()
        elif lower.startswith("description:"):
            current["description"] = line.split(":", 1)[1].strip()
        elif lower.startswith("content:"):
            current["content"] = line.split(":", 1)[1].strip()
        else:
            current["description"] = _normalize_whitespace(f"{current.get('description', '')} {line}")

    if current:
        blocks.append(current)

    if not blocks and articles_text:
        blocks.append({"description": _normalize_whitespace(articles_text)})

    return blocks


def _has_generic_boilerplate(text: str) -> bool:
    lowered = (text or "").lower()
    return any(phrase in lowered for phrase in GENERIC_SUMMARY_PHRASES)


def analysis_needs_refresh(title: str, description: str, summary: str) -> bool:
    if not summary or len(summary.strip()) < 40:
        return True

    if _has_generic_boilerplate(summary):
        return True

    source_tokens = _tokenize(f"{title} {description}")
    summary_tokens = _tokenize(summary)
    if source_tokens and len(source_tokens.intersection(summary_tokens)) == 0:
        return True

    lowered_title = (title or "").lower()
    lowered_summary = (summary or "").lower()
    if any(keyword in lowered_title for keyword in FOLLOW_UP_KEYWORDS) and not any(
        keyword in lowered_summary for keyword in FOLLOW_UP_KEYWORDS
    ):
        return True

    return False


def _detect_category(text_lower: str) -> str:
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(2 for keyword in keywords if keyword in text_lower)
        if score:
            scores[category] = score

    if not scores:
        return "other"

    return max(scores, key=scores.get)


def _detect_severity(text_lower: str, is_follow_up_story: bool) -> str:
    critical_terms = [
        "fatalities", "deaths", "killed", "dead", "mass casualty", "catastrophic",
        "devastating", "worst", "collapse", "major disaster",
    ]
    high_terms = [
        "missing", "injured", "evacuation", "evacuated", "destroyed", "emergency",
        "rescue", "severe", "widespread", "major", "threatens", "threatened",
    ]
    medium_terms = [
        "warning", "watch", "advisory", "hearing", "investigation", "lawmakers",
        "visit", "recovery", "closure", "outage", "monitoring",
    ]
    info_terms = ["lifted", "reopened", "contained", "restored", "resolved"]

    if any(term in text_lower for term in critical_terms):
        return "critical"
    if any(term in text_lower for term in high_terms):
        return "high"
    if any(term in text_lower for term in medium_terms):
        return "medium"
    if any(term in text_lower for term in info_terms):
        return "info"
    return "medium" if is_follow_up_story else "low"


def _extract_affected_groups(text_lower: str, category: str) -> List[str]:
    groups = []
    for label, patterns in AFFECTED_GROUP_PATTERNS.items():
        if any(pattern in text_lower for pattern in patterns):
            groups.append(label)

    if not groups:
        defaults = {
            "natural_disaster": ["residents", "families", "emergency crews"],
            "conflict": ["residents", "families", "aid workers"],
            "epidemic": ["residents", "patients", "health workers"],
            "accident": ["residents", "workers", "emergency crews"],
            "humanitarian": ["families", "displaced people", "aid workers"],
            "infrastructure": ["residents", "travelers", "workers"],
            "other": ["residents", "officials"],
        }
        groups = defaults.get(category, ["residents", "officials"])

    return groups[:3]


def _sentence_score(sentence: str, title_tokens: Set[str], location: str, category: str) -> int:
    lowered = sentence.lower()
    score = 0

    if _has_generic_boilerplate(sentence):
        score -= 3

    if any(char.isdigit() for char in sentence):
        score += 2

    sentence_tokens = _tokenize(sentence)
    score += len(sentence_tokens.intersection(title_tokens)) * 2

    category_terms = CATEGORY_KEYWORDS.get(category, [])
    score += sum(1 for keyword in category_terms if keyword in lowered)

    for patterns in IMPACT_PATTERNS.values():
        if any(pattern in lowered for pattern in patterns):
            score += 1

    if location and location.lower() in lowered:
        score += 1

    if len(sentence.split()) < 6:
        score -= 1

    return score


def _select_best_sentence(candidates: List[str], title_tokens: Set[str], location: str, category: str, used: List[str]) -> str:
    best_sentence = ""
    best_score = -999
    used_tokens = set()
    for sentence in used:
        used_tokens.update(_tokenize(sentence))

    for sentence in candidates:
        sentence_tokens = _tokenize(sentence)
        overlap = len(sentence_tokens.intersection(used_tokens))
        overlap_ratio = (overlap / len(sentence_tokens)) if sentence_tokens else 0
        if used_tokens and overlap >= 2 and overlap_ratio >= 0.4:
            continue

        score = _sentence_score(sentence, title_tokens, location, category)
        if score > best_score:
            best_sentence = sentence
            best_score = score

    return best_sentence if best_score >= 0 else ""


def _impact_flags(text_lower: str) -> List[str]:
    flags = []
    for label, patterns in IMPACT_PATTERNS.items():
        if any(pattern in text_lower for pattern in patterns):
            flags.append(label)
    return flags


def _build_summary(title: str, narrative_sentences: List[str], location: str, category: str, is_follow_up_story: bool) -> str:
    title_sentence = _sentence_case(title)
    title_tokens = _tokenize(title)

    used: List[str] = []
    summary_parts: List[str] = []

    if is_follow_up_story and title_sentence:
        summary_parts.append(title_sentence)
        used.append(title_sentence)

    lead_sentence = _select_best_sentence(narrative_sentences, title_tokens, location, category, used)
    if lead_sentence:
        summary_parts.append(lead_sentence)
        used.append(lead_sentence)
    elif title_sentence and title_sentence not in summary_parts:
        summary_parts.append(title_sentence)
        used.append(title_sentence)

    second_sentence = _select_best_sentence(narrative_sentences, title_tokens, location, category, used)
    if second_sentence:
        summary_parts.append(second_sentence)
    elif len(summary_parts) == 1 and category == "natural_disaster":
        summary_parts.append(f"The latest coverage points to continuing impacts and response decisions in {location}.")
    elif len(summary_parts) == 1 and is_follow_up_story:
        summary_parts.append("The coverage is centered on accountability and recovery decisions tied to the event, not on a separate new emergency.")
    elif len(summary_parts) == 1:
        summary_parts.append(f"The story remains active in {location}, with coverage focused on concrete developments rather than broad alerts.")

    deduped: List[str] = []
    seen_tokens: List[Set[str]] = []
    for sentence in summary_parts:
        tokens = _tokenize(sentence)
        if any(
            len(tokens.intersection(existing)) >= 2 and (len(tokens.intersection(existing)) / len(tokens) if tokens else 0) >= 0.4
            for existing in seen_tokens
            if tokens
        ):
            continue
        deduped.append(sentence)
        seen_tokens.append(tokens)

    return " ".join(deduped[:2]).strip()


def _build_impact_analysis(text_lower: str, location: str, category: str, is_follow_up_story: bool) -> str:
    flags = _impact_flags(text_lower)

    if is_follow_up_story and "accountability" in flags:
        return (
            f"The near-term impact in {location} is continued scrutiny of the official response, "
            "with legal or political actions shaping recovery decisions and public confidence."
        )

    if "fatalities" in flags or "injuries" in flags:
        return (
            f"The incident is affecting people first, with casualty-related updates likely to drive the response in {location}. "
            "Transport, public services, or access to the area may also stay disrupted while assessments continue."
        )

    if "evacuations" in flags or "closures" in flags or "outages" in flags:
        return (
            f"Immediate impacts in {location} include disruptions to movement, daily operations, or access while officials manage the situation. "
            "Secondary effects could include shelter needs, service interruptions, or delayed recovery work."
        )

    if category == "humanitarian":
        return (
            f"The main concern in {location} is strain on affected communities and support systems. "
            "The next phase will likely depend on aid access, shelter capacity, and recovery coordination."
        )

    if category == "infrastructure":
        return (
            f"The key impact in {location} is operational disruption, especially if transport or utility systems remain degraded. "
            "Recovery pace will depend on inspections, repairs, and official clearance updates."
        )

    return (
        f"The practical impact in {location} depends on what officials confirm next, including the scale of disruption and who remains affected. "
        "Coverage suggests the situation is still evolving rather than fully resolved."
    )


def _build_how_to_help(category: str, is_follow_up_story: bool) -> str:
    if is_follow_up_story:
        return (
            "Follow verified local updates, avoid amplifying unconfirmed claims, and support established recovery or relief groups if the story is tied to an ongoing disaster."
        )

    if category in {"natural_disaster", "humanitarian"}:
        return (
            "Follow official local guidance, share only verified information, and donate through established relief organizations serving the affected area."
        )

    if category == "epidemic":
        return "Follow public-health guidance, avoid misinformation, and support trusted community health or aid organizations where needed."

    return "Rely on verified updates, avoid spreading rumors, and support trusted local responders or community organizations when appropriate."


def _build_watch_guidance(category: str, text_lower: str, is_follow_up_story: bool) -> str:
    if is_follow_up_story and "accountability" in _impact_flags(text_lower):
        return "Watch for findings from the hearing or review, outcomes from any official site visit, and changes to recovery or accountability measures."

    if "flood" in text_lower or "storm" in text_lower or "rain" in text_lower:
        return "Watch rainfall and river updates, evacuation changes, road closures, and confirmed damage assessments."

    if "wildfire" in text_lower or ("fire" in text_lower and "campfire" not in text_lower):
        return "Watch containment updates, wind shifts, evacuation zones, and air-quality advisories."

    if "earthquake" in text_lower or "aftershock" in text_lower:
        return "Watch aftershock advisories, structural inspection results, and confirmed casualty updates."

    return WATCH_GUIDANCE_BY_CATEGORY.get(category, WATCH_GUIDANCE_BY_CATEGORY["other"])


def generate_mock_analysis_from_text(articles_text: str, location: str) -> AIAnalysis:
    """
    Generate a grounded fallback analysis from article text.
    The output should stay faithful to the article title and description instead of
    falling back to generic disaster boilerplate.
    """
    blocks = _extract_article_blocks(articles_text)
    primary = blocks[0] if blocks else {}

    title = _normalize_whitespace(primary.get("title", ""))
    descriptions = [
        _normalize_whitespace(block.get("description", ""))
        for block in blocks
        if block.get("description")
    ]
    contents = [
        _normalize_whitespace(block.get("content", ""))
        for block in blocks
        if block.get("content")
    ]

    narrative_text = " ".join(part for part in descriptions + contents if part)
    combined_text = " ".join(part for part in [title, narrative_text, location] if part)
    text_lower = combined_text.lower()
    is_follow_up_story = any(keyword in text_lower for keyword in FOLLOW_UP_KEYWORDS)
    category = _detect_category(text_lower)
    severity = _detect_severity(text_lower, is_follow_up_story)
    affected_groups = _extract_affected_groups(text_lower, category)

    narrative_sentences = []
    for text in descriptions + contents:
        narrative_sentences.extend(_split_sentences(text))

    summary = _build_summary(title, narrative_sentences, location, category, is_follow_up_story)
    impact = _build_impact_analysis(text_lower, location, category, is_follow_up_story)
    watch = _build_watch_guidance(category, text_lower, is_follow_up_story)
    how_to_help = _build_how_to_help(category, is_follow_up_story)

    return AIAnalysis(
        summary=summary,
        category=category,
        severity=severity,
        affected_groups=affected_groups,
        impact_analysis=impact,
        how_to_help=how_to_help,
        watch_guidance=watch,
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

            blocks = _extract_article_blocks(articles_text)
            primary = blocks[0] if blocks else {}
            if analysis_needs_refresh(
                primary.get("title", ""),
                primary.get("description", ""),
                analysis.summary,
            ):
                logger.warning("OpenAI summary looked generic or misaligned; using grounded fallback analysis instead")
                return generate_mock_analysis_from_text(articles_text, location)
            
            logger.info(f"Generated AI analysis for location: {location}")
            return analysis
        
        except Exception as e:
            logger.error(f"OpenAI error: {e}. Using intelligent mock analysis.")
            return generate_mock_analysis_from_text(articles_text, location)

openai_service = OpenAIService()
