SUMMARIZE_EVENT_PROMPT = """
Analyze the following news article(s) and generate a crisis intelligence report in valid JSON format:

Articles:
{articles_text}

Location: {location}

Respond with ONLY valid JSON (no markdown, no extra text). Use this exact format:
{{
    "summary": "2-3 sentence clear summary covering what happened, where, and current status with key details",
    "category": "one of: natural_disaster, conflict, epidemic, accident, humanitarian, infrastructure, other",
    "severity": "one of: critical (mass casualties/deaths), high (extreme threat/major disruption), medium (significant impact/disruption), low (minor impact/concern), info (good news/resolved/non-threatening)",
    "affected_groups": ["group1", "group2", "group3"],
    "impact_analysis": "2-3 sentences on immediate and secondary impacts",
    "how_to_help": "specific, actionable aid suggestions",
    "watch_guidance": "key developments and indicators to monitor"
}}
"""

def build_event_analysis_prompt(articles_text: str, location: str) -> str:
    return SUMMARIZE_EVENT_PROMPT.format(
        articles_text=articles_text,
        location=location
    )
