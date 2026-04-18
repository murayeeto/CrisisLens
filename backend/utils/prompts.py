SUMMARIZE_EVENT_PROMPT = """
Analyze the following news article(s) and generate a crisis intelligence report in valid JSON format:

Articles:
{articles_text}

Location: {location}

Respond with ONLY valid JSON (no markdown, no extra text). Use this exact format:
{{
    "summary": "1-2 sentence professional summary of the event",
    "category": "one of: natural_disaster, conflict, epidemic, accident, humanitarian, infrastructure, other",
    "affected_groups": ["group1", "group2", "group3"],
    "impact_analysis": "2-3 sentences on immediate and secondary impacts",
    "how_to_help": "specific, actionable aid or support suggestions",
    "watch_guidance": "key indicators or developments to monitor"
}}
"""

def build_event_analysis_prompt(articles_text: str, location: str) -> str:
    return SUMMARIZE_EVENT_PROMPT.format(
        articles_text=articles_text,
        location=location
    )
