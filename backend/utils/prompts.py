SUMMARIZE_EVENT_PROMPT = """
Analyze the following news article(s) and generate a crisis intelligence report in valid JSON format:

Articles:
{articles_text}

Location: {location}

Important rules:
- Ground every field in the provided title/description/content only.
- Treat the title as the strongest signal for the story's actual angle.
- Do not rewrite a legal, political, recovery, or accountability follow-up into a generic disaster alert unless the article explicitly says a new alert or incident is underway.
- Avoid boilerplate like "authorities are monitoring the situation" unless the article directly says that and it adds meaningful context.
- Make the summary concrete, specific, and clearly tied to this exact story.
- If the article is a follow-up story, say so plainly.

Respond with ONLY valid JSON (no markdown, no extra text). Use this exact format:
{{
    "summary": "2 sentences max, specific and grounded in this exact story, covering what happened, where, and what is current now",
    "category": "one of: natural_disaster, conflict, epidemic, accident, humanitarian, infrastructure, other",
    "severity": "one of: critical (mass casualties/deaths), high (extreme threat/major disruption), medium (significant impact/disruption), low (minor impact/concern), info (good news/resolved/non-threatening)",
    "affected_groups": ["group1", "group2", "group3"],
    "impact_analysis": "1-2 sentences on immediate and secondary impacts, specific to this story",
    "how_to_help": "specific, actionable aid suggestions; if no direct public action is justified, say so clearly and suggest verified relief/support channels only if relevant",
    "watch_guidance": "1 sentence on the most important next developments to monitor"
}}
"""

def build_event_analysis_prompt(articles_text: str, location: str) -> str:
    return SUMMARIZE_EVENT_PROMPT.format(
        articles_text=articles_text,
        location=location
    )
