from fastapi import APIRouter
router = APIRouter()

CULTURES = [
    {"id": "usa", "flag": "🇺🇸", "name": "United States", "directness": 80, "hierarchy": 30, "formality": 40,
     "norms": ["Lead with the bottom line first", "Brief small talk is expected", "Eye contact shows confidence", "Decision-makers speak directly"],
     "taboos": ["Never ask personal questions (salary, family, age)", "Avoid excessive modesty — own your wins", "Don't be vague — clarity is respected"],
     "tips":   ["Use 'I' statements to own your ideas", "Quantify achievements with numbers", "Follow up emails within 24h"],
     "greeting": "Hi [First Name]! / Good to meet you.",
     "phrases": ["Let's touch base later.", "Could you elaborate on that?", "I'll ping you on Slack.", "Let's align on the next steps.", "Can we take this offline?", "Thanks for flagging this."]},
    {"id": "japan", "flag": "🇯🇵", "name": "Japan", "directness": 20, "hierarchy": 90, "formality": 85,
     "norms": ["Bow as greeting (15° = peers, 30° = seniors)", "Use family name + san always", "Silence is respectful — don't fill it", "Decisions are made by consensus (nemawashi)"],
     "taboos": ["Never refuse directly — say 'It might be difficult'", "Avoid confrontation in meetings", "Don't be late — it is deeply disrespectful"],
     "tips":   ["Read the sub-text — 'interesting' may mean 'no'", "Prepare formal business cards (meishi)", "Let seniors speak first"],
     "greeting": "Hajimemashite. [Surname]-san, yoroshiku onegaishimasu.",
     "phrases": ["Otsukaresama desu (Thanks for your hard work)", "Shitsurei shimasu (Excuse me / Goodbye)", "Wakarimashita (I understand)", "Kento shite okimasu (I'll think about it)", "Arigatou gozaimasu (Thank you)"]},
    {"id": "germany", "flag": "🇩🇪", "name": "Germany", "directness": 95, "hierarchy": 50, "formality": 75,
     "norms": ["Punctuality is non-negotiable", "Use formal titles (Dr., Prof.) until invited otherwise", "Criticism of ideas is not personal — it's constructive", "Data and logic win arguments"],
     "taboos": ["Small talk is minimal and seen as wasting time", "Don't oversell — back claims with evidence", "Avoid exaggeration"],
     "tips":   ["Come over-prepared with facts", "Structure your argument: point → evidence → implication", "Shake hands firmly at start and end"],
     "greeting": "Guten Tag, Herr/Frau [Nachname].",
     "phrases": ["Genau (Exactly)", "Das macht Sinn (That makes sense)", "Ich stimme zu (I agree)", "Können wir das verschieben? (Can we postpone this?)", "Vielen Dank für Ihre Zeit (Thanks for your time)"]},
    {"id": "india", "flag": "🇮🇳", "name": "India", "directness": 45, "hierarchy": 75, "formality": 60,
     "norms": ["Relationship-building precedes business", "Seniority is addressed first", "Indirect 'yes' may mean 'I understand, not I agree'", "Flexibility on timelines is common"],
     "taboos": ["Don't publicly embarrass someone — face saving matters", "Avoid blunt criticism of seniors", "Don't skip relationship-building pleasantries"],
     "tips":   ["Use first name only after invited to", "Follow up persistently — it's expected", "Decisions may be delayed — be patient"],
     "greeting": "Namaste / Good morning, [Name]-ji.",
     "phrases": ["Let's prepone the meeting", "I will do the needful", "Please revert by tomorrow", "Out of station (Out of town)", "Kindly adjust (Please bear with it)"]},
    {"id": "uk", "flag": "🇬🇧", "name": "United Kingdom", "directness": 60, "hierarchy": 45, "formality": 65,
     "norms": ["Understatement is an art — 'not bad' = great", "Humour is used to ease tension", "Queue and take turns — interrupting is rude", "Self-deprecation is valued"],
     "taboos": ["Over-enthusiasm seems performative", "'How are you?' is a greeting, not a real question", "Avoid boastfulness"],
     "tips":   ["Read between the lines — 'interesting' can be negative", "Bring data but deliver with lightness", "A little humour goes a long way"],
     "greeting": "Good morning / Hello, [First Name].",
     "phrases": ["Cheers! (Thanks/Goodbye)", "Spot on (Exactly right)", "I'm gutted (I'm very disappointed)", "That's brilliant (That's great)", "Not my cup of tea (Not to my liking)"]},
    {"id": "brazil", "flag": "🇧🇷", "name": "Brazil", "directness": 55, "hierarchy": 65, "formality": 50,
     "norms": ["Warm greetings — hug or cheek kiss is common", "First names used quickly after meeting", "Relationships matter more than contracts", "Meetings often start late"],
     "taboos": ["Don't be too rigid about timelines", "Avoid discussing Argentina (football rivalry)", "Don't push decisions before trust is built"],
     "tips":   ["Invest in personal connection before pitching", "Show genuine interest in their life", "Follow up relationally, not just transactionally"],
     "greeting": "Olá! Tudo bem? / Hello! How are you?",
     "phrases": ["Com licença (Excuse me)", "Muito prazer (Nice to meet you)", "Você poderia me ajudar? (Could you help me?)", "Vamos marcar um café? (Shall we schedule a coffee?)", "Até logo (See you soon)", "Claro! (Of course!)"]},
]

@router.get("/")
async def list_cultures():
    return {"cultures": [{k: v for k, v in c.items() if k != "norms"} for c in CULTURES]}

@router.get("/{culture_id}")
async def get_culture(culture_id: str):
    c = next((x for x in CULTURES if x["id"] == culture_id), None)
    if not c:
        from fastapi import HTTPException
        raise HTTPException(404, "Culture not found")
        
    import datetime
    day_of_year = datetime.datetime.now().timetuple().tm_yday
    
    # Inject a deterministic daily phrase instead of the whole array
    resp = dict(c)
    phrases = c.get("phrases", [])
    if isinstance(phrases, list) and phrases:
        resp["daily_phrase"] = phrases[day_of_year % len(phrases)]
    
    return resp
