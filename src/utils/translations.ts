/**
 * Templated Translation Dictionary & Utilities for Causal-Chain Explanations.
 * 
 * Scope: Translates explanatory sentences (Health Score reasons, Red Flag narratives,
 * Suitability causal chains, suggested remedial actions) into Tamil ('ta').
 * 
 * All proper nouns (holding names, tickers, broker names, ISINs, rupee figures, dates)
 * and UI chrome remain untouched in both languages.
 */

export type LanguageCode = 'en' | 'ta';

/** Exact phrase translations */
const PHRASE_MAP_TA: Record<string, string> = {
  // ── Causal Chain: Causes ──
  '40% concentration in one REIT': 'ஒரே REIT-ல் 40% செறிவு',
  'Mandatory 3-year lock-in period': 'கட்டாய 3 வருட லாக்-இன் காலம்',
  'Large-cap core banking allocation': 'பெரிய நிறுவன வங்கிப் பங்கு ஒதுக்கீடு',
  'Tier-1 IT export revenue generator': 'முன்னணி IT ஏற்றுமதி வருவாய் ஈட்டுபவர்',
  'Sovereign backing zero default risk': 'அரசு உத்தரவாதத்துடன் பூஜ்ஜிய கடன் தவறுதல் அபாயம்',
  '2.1% active mutual fund expense ratio': '2.1% செயலில் உள்ள மியூச்சுவல் ஃபண்ட் செலவு விகிதம் (TER)',
  'T+1 liquid cash-equivalent buffer': 'T+1 உடனடி திரவ ரொக்க சேமிப்பு',

  // ── Causal Chain: Mechanisms ──
  'rate-sensitive asset class': 'வட்டி விகித மாற்றங்களுக்கு அதிக உணர்திறன் கொண்ட சொத்து பிரிவு',
  'Stated liquidity horizon is 18 months': 'குறிப்பிடப்பட்ட பணப்புழக்க காலக்கெடு 18 மாதங்கள்',
  'Stable net interest margin (NIM)': 'நிலையான நிகர வட்டி வரம்பு (NIM)',
  'USD earnings hedge against INR depreciation': 'ரூபாய் மதிப்பு சரிவுக்கு எதிரான டாலர் வருவாய் பாதுகாப்பு',
  'Fixed bi-annual coupon cashflow': 'நிலையான அரையாண்டு கூப்பன் பணப்பாய்வு',
  'Regular plan distributor commission recurring annual drag': 'வழக்கமான திட்ட விநியோகஸ்தர் கமிஷனின் தொடர் வருடாந்திர இழப்பு',
  'Short-term overnight & treasury debt instruments': 'குறுகிய கால கருவூல கடன் பத்திரங்கள்',

  // ── Causal Chain: Impacts ──
  '-15% estimated value per +1% rate move': '+1% வட்டி விகித உயர்வுக்கு -15% மதிப்பிடப்பட்ட மதிப்பு இழப்பு',
  'High risk of forced secondary market liquidation penalty': 'இரண்டாம் நிலை சந்தையில் நஷ்டத்தில் விற்க வேண்டிய அதிக அபாயம்',
  'Acts as portfolio stabilizer during market volatility': 'சந்தை ஏற்ற இறக்கங்களின் போது போர்ட்ஃபோலியோவை நிலைநிறுத்துகிறது',
  'Provides growth upside with low default risk': 'குறைந்த கடன் அபாயத்துடன் வளர்ச்சி வாய்ப்பை வழங்குகிறது',
  'Guarantees regular income flow regardless of market crashes': 'சந்தை சரிவுகளைப் பொருட்படுத்தாமல் நிலையான வருமான ஓட்டத்தை உறுதி செய்கிறது',
  '₹3,600/year higher cost vs 0.3% direct index alternative': '0.3% நேரடி குறியீட்டு மாற்றை விட ஆண்டுக்கு ₹3,600 கூடுதல் செலவு',
  'Acts as primary emergency liquidity cushion for living expenses': 'வாழ்வாதார செலவுகளுக்கான முதன்மை அவசரகால திரவ பாதுகாப்பாக செயல்படுகிறது',

  // ── Causal Chain: Priya Sharma CAS Holdings (casParser.ts) ──
  // Reliance Industries
  'Large-cap energy & retail conglomerate': 'பெரிய நிறுவன ஆற்றல் & சில்லறை விற்பனை தொகுப்பு நிறுவனம்',
  'Stable cash flow generation': 'நிலையான பணப்புழக்க உருவாக்கம்',
  '+5% projected return': '+5% கணிக்கப்பட்ட வருமானம்',
  // HDFC Bank (CAS version)
  'Tier-1 private banking anchor': 'முன்னணி தனியார் வங்கி அங்கர்',
  'High credit quality': 'உயர் கடன் தரம்',
  'Core portfolio stability': 'முக்கிய போர்ட்ஃபோலியோ நிலைத்தன்மை',
  // Infosys (CAS version)
  'IT services exporter': 'IT சேவைகள் ஏற்றுமதியாளர்',
  'USD revenue hedge': 'டாலர் வருவாய் பாதுகாப்பு',
  'Short-term margin headwind': 'குறுகிய கால லாப வரம்பு சவால்',
  // PFC Bond
  'AAA quasi-sovereign bond': 'AAA அரை-இறையாண்மை பத்திரம்',
  'Fixed coupon till 2029': '2029 வரை நிலையான கூப்பன்',
  'Predictable income stream': 'கணிக்கக்கூடிய வருமான ஓட்டம்',
  // Embassy REIT (CAS version)
  'Grade-A office REIT': 'தரம்-A அலுவலக REIT',
  'Interest-rate sensitive yield': 'வட்டி விகித உணர்திறன் கொண்ட வருவாய்',
  'Moderate RBI rate sensitivity': 'மிதமான RBI வட்டி விகித உணர்திறன்',
  // Grid InvIT (CAS version)
  '3-year lock-in InvIT via RM': 'RM வழி 3 வருட லாக்-இன் InvIT',
  'Illiquid tenure mismatch': 'திரவமற்ற காலகட்ட முரண்பாடு',
  'High illiquidity risk': 'அதிக திரவமின்மை ஆபத்து',
  // Parag Parikh Flexi Cap (CAS version)
  'Diversified flexi-cap fund': 'பன்முகப்படுத்தப்பட்ட ஃப்ளெக்சி-கேப் ஃபண்ட்',
  'Multi-cap + international allocation': 'மல்டி-கேப் + சர்வதேச ஒதுக்கீடு',
  'Long-term wealth compounder': 'நீண்ட கால செல்வ வளர்ச்சி கருவி',

  // ── Causal Chain: Household / Partner Holdings (household.ts) ──
  // TCS (partner)
  'Blue-chip IT services exporter': 'முன்னணி தரமான IT சேவைகள் ஏற்றுமதியாளர்',
  'Stable cash flow and dividend generation': 'நிலையான பணப்புழக்கம் மற்றும் ஈவுத்தொகை உருவாக்கம்',
  'Acts as large-cap portfolio ballast': 'பெரிய நிறுவன போர்ட்ஃபோலியோ நிலையாக செயல்படுகிறது',
  // Reliance (partner version)
  'Diversified conglomerate exposure': 'பன்முகப்படுத்தப்பட்ட தொகுப்பு நிறுவன முதலீடு',
  'Retail & telecom domestic market dominance': 'சில்லறை & தொலைத்தொடர்பு உள்நாட்டு சந்தை ஆதிக்கம்',
  'Provides growth upside': 'வளர்ச்சி வாய்ப்பை வழங்குகிறது',
  // GOI Bond 2033 (partner)
  'Sovereign-backed fixed income': 'இறையாண்மை ஆதரவு நிலையான வருமானம்',
  'Semi-annual coupon payout': 'அரையாண்டு கூப்பன் செலுத்தல்',
  'Secures predictable household cash flow': 'குடும்பத்திற்கு கணிக்கக்கூடிய பணப்புழக்கத்தை உறுதிப்படுத்துகிறது',
  // Embassy REIT (partner version)
  'Commercial Grade-A real estate assets': 'வணிக தரம்-A ரியல் எஸ்டேட் சொத்துக்கள்',
  'Quarterly rental distributions': 'காலாண்டு வாடகை விநியோகம்',
  'Yield generator for household income': 'குடும்ப வருமானத்திற்கான வருவாய் ஈட்டு கருவி',
  // Parag Parikh (partner version)
  'Global flexi-cap mutual fund': 'உலகளாவிய ஃப்ளெக்சி-கேப் மியூச்சுவல் ஃபண்ட்',
  'Active value investing with US equity allocation': 'அமெரிக்க பங்கு ஒதுக்கீட்டுடன் செயலில் மதிப்பு முதலீடு',
  'Diversifies household equity beyond domestic indices': 'உள்நாட்டு குறியீடுகளுக்கு அப்பால் குடும்ப பங்கு பல்வகைப்படுத்தல்',

  // ── Health Score Factor Labels ──
  'Single-Holding Concentration': 'ஒற்றை முதலீட்டு செறிவு',
  'REIT / InvIT Rate Sensitivity': 'REIT / InvIT வட்டி விகித உணர்திறன்',
  'Lock-in Horizon Mismatch': 'லாக்-இன் காலக்கெடு முரண்பாடு',
  'Low Fixed Income Cushion': 'குறைந்த நிலையான வருமான பாதுகாப்பு',
  'Emergency Liquid Buffer Inadequacy': 'அவசரகால திரவ சேமிப்பு பற்றாக்குறை',
  'Asset Class Diversification': 'சொத்துப் பிரிவு பல்வகைப்படுத்தல்',
  'Disciplined Investment Behavior': 'ஒழுங்கான முதலீட்டு பழக்கம்',
  'Concentration Penalty': 'செறிவு அபராதம்',
  'Concentration Risk': 'செறிவு இடர்',
  'Liquidity Mismatch Penalty': 'பணப்புழக்க காலக்கெடு முரண்பாடு அபராதம்',
  'Liquidity Mismatch': 'பணப்புழக்க காலக்கெடு முரண்பாடு',
  'Volatility Exposure Penalty': 'ஏற்ற இறக்க வெளிப்பாடு அபராதம்',
  'Volatility Exposure': 'ஏற்ற இறக்க வெளிப்பாடு',
  'Diversification Gap Penalty': 'பல்வகைப்படுத்தல் இடைவெளி அபராதம்',
  'Diversification Gap': 'பல்வகைப்படுத்தல் இடைவெளி',
  'Positive Behavior Bonus': 'நேர்மறை முதலீட்டு பழக்க போனஸ்',
  'Insufficient Data': 'போதுமான தரவு இல்லை',
  'Risk Factor': 'இடர் காரணி',

  // ── Health Score Breakdown Reasons ──
  'Combined REIT/InvIT exposure is above 35% ceiling': 'ஒருங்கிணைந்த REIT/InvIT ஒதுக்கீடு 35% உச்சவரம்பிற்கு மேல் உள்ளது',
  'Grid InvIT 36-mo lockin vs 18-mo horizon': 'Grid InvIT 36 மாத லாக்-இன் vs 18 மாத காலக்கெடு',
  'Fixed income buffer is below 20% minimum': 'நிலையான வருமான பாதுகாப்பு சேமிப்பு 20% குறைந்தபட்ச அளவிற்கு கீழ் உள்ளது',
  'Thin liquid emergency buffer ahead of locked-in assets': 'லாக்-இன் சொத்துக்களுக்கு முன்னதாக குறைந்த அவசரகால திரவ சேமிப்பு உள்ளது',
  'Healthy asset class diversification across equities, bonds, and REITs': 'பங்குகள், பத்திரங்கள் மற்றும் REIT-களில் ஆரோக்கியமான சொத்து பல்வகைப்படுத்தல்',
  'Disciplined regular SIP and contribution behavior': 'ஒழுங்கான வழக்கமான SIP மற்றும் முதலீட்டு பங்களிப்பு பழக்கம்',
  'Recorded history of regular monthly contributions with no panic-selling during drawdowns. Added +8 pts.':
    'சந்தை சரிவுகளின் போது பீதி விற்பனை செய்யாமல் வழக்கமான மாதாந்திர முதலீட்டு வரலாறு பதிவு செய்யப்பட்டுள்ளது. +8 புள்ளிகள் சேர்க்கப்பட்டன.',
  'Portfolio is empty or total value is zero. Unable to calculate Health Score.':
    'போர்ட்ஃபோலியோ காலியாக உள்ளது அல்லது மொத்த மதிப்பு பூஜ்ஜியமாக உள்ளது. ஹெல்த் ஸ்கோரை கணக்கிட முடியவில்லை.',
  'No holdings or zero portfolio value found.':
    'முதலீடுகள் எதுவும் இல்லை அல்லது போர்ட்ஃபோலியோ மதிப்பு பூஜ்ஜியமாக உள்ளது.',

  // ── Health Score Suggestions ──
  'Consider rebalancing to reduce single-holding exposure below 20%.': 'ஒற்றை முதலீட்டு செறிவை 20%-க்கு கீழ் குறைக்க மறுசீரமைப்பைக் கவனியுங்கள்.',
  'Reduce REIT/InvIT allocation to limit interest-rate sensitivity.': 'வட்டி விகித உணர்திறனைக் குறைக்க REIT/InvIT ஒதுக்கீட்டைக் குறைக்கவும்.',
  'Confirm liquidity timeline or shift into liquid debt instruments.': 'பணப்புழக்க காலக்கெடுவை உறுதிப்படுத்தவும் அல்லது திரவ கடன் கருவிகளுக்கு மாற்றவும்.',
  'Increase allocation to sovereign bonds or high-grade debt.': 'அரசு பத்திரங்கள் அல்லது உயர்தர கடன்களுக்கான ஒதுக்கீட்டை அதிகரிக்கவும்.',
  'Maintain 3–6 months of living expenses in liquid cash before locking capital.': 'மூலதனத்தை லாக் செய்வதற்கு முன் 3–6 மாத வாழ்க்கைச் செலவுகளை திரவ ரொக்கமாகப் பராமரிக்கவும்.',
  'Consider liquid alternatives or extending target horizons to close the liquidity gap.':
    'பணப்புழக்க இடைவெளியை குறைக்க திரவ மாற்றுகளை பரிசீலிக்கவும் அல்லது முதலீட்டு காலக்கெடுவை நீட்டிக்கவும்.',
  'Add holdings in other asset classes (e.g. bonds, debt funds) to reach at least 3 distinct asset classes.':
    'குறைந்தது 3 தனித்துவமான சொத்துப் பிரிவுகளை அடைய மற்ற சொத்துப் பிரிவுகளில் (எ.கா. பத்திரங்கள், கடன் நிதிகள்) முதலீடுகளைச் சேர்க்கவும்.',
  'Upload a CAS statement or add portfolio holdings to calculate your Health Score.':
    'உங்கள் ஹெல்த் ஸ்கோரை கணக்கிட CAS அறிக்கையை பதிவேற்றவும் அல்லது முதலீடுகளை சேர்க்கவும்.',

  // ── Red Flag Titles ──
  'Liquidity mismatch on Grid InvIT': 'Grid InvIT-ல் பணப்புழக்க காலக்கெடு முரண்பாடு',
  'Rate Sensitivity Concentration': 'வட்டி விகித உணர்திறன் செறிவு',
  'Single holding concentration exceeds prudent limit': 'ஒற்றை முதலீட்டு செறிவு எச்சரிக்கை வரம்பை தாண்டியுள்ளது',
  'Thin Liquid Buffer Ahead of Illiquid Allocations': 'திரவமற்ற ஒதுக்கீடுகளுக்கு முன் குறைந்த திரவ சேமிப்பு',
  'REIT / InvIT concentration beyond comfort threshold': 'REIT / InvIT செறிவு வசதியான வரம்பிற்கு மேல் உள்ளது',
  '3-Year Lock-In Liquidity Mismatch': '3 வருட லாக்-இன் பணப்புழக்க காலக்கெடு முரண்பாடு',
  'Alternate Asset Concentration Risk': 'மாற்று சொத்து செறிவு இடர்',
  'Lock-in period may mismatch your liquidity horizon': 'லாக்-இன் காலம் உங்கள் பணப்புழக்க காலக்கெடுவுடன் முரண்படலாம்',

  // ── Red Flag Descriptions ──
  'This holding has a 3-year lock-in recommended by your Relationship Manager (Amit Verma), but you said you may need this money in 18 months.':
    'இந்த முதலீடு உங்கள் உறவு மேலாளரால் (Amit Verma) பரிந்துரைக்கப்பட்ட 3 வருட லாக்-இன் கொண்டுள்ளது, ஆனால் உங்களுக்கு 18 மாதங்களில் பணம் தேவைப்படலாம்.',
  '40% of total portfolio value is concentrated in a single REIT asset class.':
    'மொத்த போர்ட்ஃபோலியோ மதிப்பில் 40% ஒரே REIT சொத்துப் பிரிவில் குவிந்துள்ளது.',
  'RM mis-sold a 36-month lock-in InvIT (₹4,40,600 — 23.3% of portfolio) despite investor needing liquidity within 12 months.':
    'முதலீட்டாளருக்கு 12 மாதங்களுக்குள் பணப்புழக்கம் தேவைப்பட்ட போதிலும், உறவு மேலாளர் (RM) 36 மாத லாக்-இன் கொண்ட InvIT-ஐ (₹4,40,600 — போர்ட்ஃபோலியோவில் 23.3%) தவறாக விற்றுள்ளார்.',
  'Combined REIT/InvIT exposure is 37.7% (₹7,12,600), exceeding the recommended 20% ceiling for moderate retail profiles.':
    'ஒருங்கிணைந்த REIT/InvIT வெளிப்பாடு 37.7% (₹7,12,600) ஆக உள்ளது, இது மிதமான சில்லறை முதலீட்டாளர்களுக்கான பரிந்துரைக்கப்பட்ட 20% வரம்பிற்கு மேல் உள்ளது.',

  // ── Red Flag Suggested Actions ──
  'Consider shifting ₹50,000 into liquid short-duration G-Secs before Q3 horizon.':
    'Q3 காலக்கெடுவுக்கு முன் ₹50,000-ஐ குறுகிய கால திரவ அரசு பத்திரங்களுக்கு மாற்ற பரிசீலிக்கவும்.',
  'Rebalance 15% from REIT into high-grade corporate bonds or diversified equity index.':
    'REIT-லிருந்து 15%-ஐ உயர்தர கார்ப்பரேட் பத்திரங்கள் அல்லது பன்முகப்படுத்தப்பட்ட பங்கு குறியீட்டிற்கு மறுசீரமைக்கவும்.',
  'Request RM secondary market redemption or file a formal complaint through the prescribed channel.':
    'உறவு மேலாளரிடம் இரண்டாம் நிலை சந்தை மீட்பைக் கோரவும் அல்லது முறைப்படியான புகார் சேனல் மூலம் புகார் அளிக்கவும்.',
  'Trim InvIT post-lock-in period; rebalance into G-Secs or flexi-cap funds.':
    'லாக்-இன் காலத்திற்குப் பிறகு InvIT-ஐக் குறைக்கவும்; அரசு பத்திரங்கள் அல்லது ஃப்ளெக்சி-கேப் நிதிகளுக்கு மறுசீரமைக்கவும்.',
  'Reduce exposure in this holding and diversify into lower-correlation assets that better match the stated investment horizon.':
    'இந்த முதலீட்டின் வெளிப்பாட்டைக் குறைத்து, குறிப்பிட்ட முதலீட்டு காலக்கெடுவுக்கு பொருந்தக்கூடிய குறைந்த தொடர்பு கொண்ட சொத்துக்களில் பல்வகைப்படுத்தவும்.',
  'Confirm the intended liquidity window and consider reallocating a portion of this capital into liquid debt or cash equivalents.':
    'நோக்கம் கொண்ட பணப்புழக்க காலத்தை உறுதிப்படுத்தவும், இந்த மூலதனத்தின் ஒரு பகுதியை திரவ கடன் அல்லது ரொக்க சமமான கருவிகளுக்கு மாற்ற பரிசீலிக்கவும்.',
  'Rebalance a portion of the REIT / InvIT allocation into liquid sovereign debt or diversified equity funds to restore liquidity and reduce rate sensitivity.':
    'பணப்புழக்கத்தை மீட்டெடுக்கவும் வட்டி விகித உணர்திறனைக் குறைக்கவும் REIT / InvIT ஒதுக்கீட்டின் ஒரு பகுதியை திரவ அரசு பத்திரங்கள் அல்லது பன்முகப்படுத்தப்பட்ட பங்கு நிதிகளுக்கு மறுசீரமைக்கவும்.',
  'Evaluate liquidity requirements before locking in capital.':
    'மூலதனத்தை லாக் செய்வதற்கு முன் பணப்புழக்க தேவைகளை மதிப்பீடு செய்யவும்.',

  // ── Portfolio Story Timeline: Factor Labels ──
  'Debt Maturity Mismatch': 'கடன் முதிர்வு கால முரண்பாடு',
  'Credit Quality Upgrade': 'கடன் தரம் மேம்பாடு',

  // ── Portfolio Story Timeline: Event Reasons ──
  'New REIT purchase increased real estate & infrastructure concentration to 38.7%, exceeding the recommended 25% threshold.':
    'புதிய REIT கொள்முதல் ரியல் எஸ்டேட் & உள்கட்டமைப்பு செறிவை 38.7% ஆக அதிகரித்துள்ளது, இது பரிந்துரைக்கப்பட்ட 25% வரம்பிற்கு மேல் உள்ளது.',
  'Resolved lock-in mismatch by reallocating high-risk unrated bonds into 3-Year G-Secs matching stated liquidity horizon.':
    'அதிக இடர் மதிப்பற்ற பத்திரங்களை 3 வருட அரசு பத்திரங்களுக்கு மாற்றி லாக்-இன் முரண்பாடு தீர்க்கப்பட்டது.',
  'Exited speculative unrated corporate debentures, reducing portfolio credit default exposure.':
    'மதிப்பற்ற கார்ப்பரேட் கடன் பத்திரங்களிலிருந்து வெளியேறி கடன் தவறுதல் அபாயம் குறைக்கப்பட்டது.',

  // ── Portfolio Guardian Proactive Events: Causes (exact strings from SEED_NEWS_EVENTS) ──
  'RBI raised repo rate by +25 bps to combat headline inflation.':
    'RBI பணவீக்கத்தை கட்டுப்படுத்த ரெப்போ விகிதத்தை +25 bps உயர்த்தியுள்ளது.',
  'SEBI mandated stricter tax classification on InvIT capital repayments.':
    'SEBI InvIT மூலதன திருப்பிச் செலுத்தல்களில் கடுமையான வரி வகைப்பாட்டை கட்டாயமாக்கியுள்ளது.',
  'US enterprise software budgets contracted by 4.2% quarter-on-quarter.':
    'அமெரிக்க நிறுவன மென்பொருள் பட்ஜெட்கள் காலாண்டு அடிப்படையில் 4.2% சுருங்கியுள்ளன.',
  'Bumper agricultural grain yield.':
    'அதிகமான விவசாய தானிய மகசூல்.',

  // ── IPO / NFO Screener Causal Chains ──
  'Pre-application suitability analysis identifies potential portfolio allocation conflicts.':
    'விண்ணப்பத்திற்கு முந்தைய பொருத்தப்பாட்டு பகுப்பாய்வு போர்ட்ஃபோலியோ ஒதுக்கீட்டு முரண்பாடுகளை அடையாளம் காட்டுகிறது.',
  'Issue structure aligns well with current asset class targets and SEBI risk profile.':
    'வெளியீட்டு கட்டமைப்பு தற்போதைய சொத்துப் பிரிவு இலக்குகள் மற்றும் SEBI இடர் சுயவிவரத்துடன் நன்றாகப் பொருந்துகிறது.',

  // ── Nomination & Estate Readiness ──
  'Your family can access all holdings without a court-order claim process in the event of estate transfer.':
    'சொத்து பரிமாற்றத்தின் போது நீதிமன்ற உத்தரவு உரிமை கோரல் செயல்முறை இல்லாமல் உங்கள் குடும்பத்தினர் அனைத்து முதலீடுகளையும் அணுக முடியும்.',
  'Confirm nominee status for each account in Settings to protect your family from a lengthy legal claim process.':
    'நீண்ட சட்ட உரிமை கோரல் செயல்முறையிலிருந்து உங்கள் குடும்பத்தைப் பாதுகாக்க அமைப்புகளில் ஒவ்வொரு கணக்கிற்கும் நியமனதாரர் நிலையை உறுதிப்படுத்தவும்.',
};

/** Regex-based dynamic template pattern matchers for Tamil translation */
const PATTERN_RULES_TA: Array<{
  pattern: RegExp;
  translate: (match: RegExpMatchArray) => string;
}> = [
  // 1. Health Score: Concentration exceeding limit e.g. "Mindspace Business Parks REIT exceeds 20% max concentration limit"
  {
    pattern: /^(.+?)\s+exceeds\s+(\d+%)\s+max\s+concentration\s+limit$/i,
    translate: (m) => `${m[1]} அதிகபட்ச ${m[2]} செறிவு வரம்பை தாண்டியுள்ளது`,
  },
  // 2. Health Score: Lock-in vs horizon mismatch e.g. "Mindspace REIT has 36-month lock-in vs your shorter investment horizon"
  {
    pattern: /^(.+?)\s+has\s+(\d+[- ]month)\s+lock-in\s+vs\s+your\s+shorter\s+investment\s+horizon$/i,
    translate: (m) => `${m[1]} உங்கள் குறுகிய முதலீட்டு காலக்கெடுவை விட ${m[2]} லாக்-இன் கொண்டுள்ளது`,
  },
  // 3. Red Flag: Lock-in period mismatch e.g. "Grid InvIT is locked in for 36 months while the portfolio may require liquidity sooner."
  {
    pattern: /^(.+?)\s+is\s+locked\s+in\s+for\s+(\d+)\s+months\s+while\s+the\s+portfolio\s+may\s+require\s+liquidity\s+sooner\.$/i,
    translate: (m) => `${m[1]} ${m[2]} மாதங்களுக்கு லாக் செய்யப்பட்டுள்ளது, ஆனால் போர்ட்ஃபோலியோவிற்கு விரைவில் பணப்புழக்கம் தேவைப்படலாம்.`,
  },
  // 4. Red Flag: Single holding weight e.g. "Infosys represents 27.5% of the portfolio, above a prudent single-asset concentration ceiling for most retail investors."
  {
    pattern: /^(.+?)\s+represents\s+([\d.]+%\s+of\s+the\s+portfolio),\s+above\s+a\s+prudent\s+single-asset\s+concentration\s+ceiling\s+for\s+most\s+retail\s+investors\.$/i,
    translate: (m) => `${m[1]} போர்ட்ஃபோலியோவில் ${m[2]} கொண்டுள்ளது, இது பெரும்பாலான சில்லறை முதலீட்டாளர்களுக்கான எச்சரிக்கை வரம்பிற்கு மேல் உள்ளது.`,
  },
  // 5. Red Flag: SEBI suitability mismatch
  {
    pattern: /^Your\s+assessed\s+SEBI\s+risk\s+profile\s+is\s+(.+?),\s+but\s+(.+?)\s+is\s+categorized\s+(.+?)\s+on\s+the\s+SEBI\s+Riskometer\s+—\s+holding\s+this\s+higher-volatility\s+instrument\s+creates\s+an\s+investor\s+suitability\s+mismatch\.$/i,
    translate: (m) => `உங்கள் SEBI இடர் சுயவிவரம் ${m[1]}, ஆனால் ${m[2]} SEBI ரிஸ்கோமீட்டரில் ${m[3]} என வகைப்படுத்தப்பட்டுள்ளது — இந்த அதிக ஏற்ற இறக்க கருவியை வைத்திருப்பது பொருத்தமின்மையை உருவாக்குகிறது.`,
  },
  // 6. Red Flag: Emergency fund liquid buffer
  {
    pattern: /^Your\s+liquid\s+buffer\s+covers\s+~([\d.]+)\s+months\s+of\s+expenses\s+\(below\s+the\s+3-month\s+safety\s+threshold\)\.\s+Consider\s+this\s+before\s+committing\s+further\s+funds\s+to\s+illiquid\s+instruments\s+like\s+your\s+(.+?)\.$/i,
    translate: (m) => `உங்கள் திரவ சேமிப்பு ~${m[1]} மாத செலவுகளை மட்டுமே ஈடுசெய்கிறது (3 மாத பாதுகாப்பு வரம்பிற்கு கீழ்). ${m[2]} போன்ற லாக்-இன் கருவிகளில் கூடுதல் நிதியை ஒதுக்குவதற்கு முன் இதைக் கவனியுங்கள்.`,
  },
  // 7. Red Flag: Emergency fund suggested action
  {
    pattern: /^Maintain\s+at\s+least\s+3–6\s+months\s+of\s+living\s+expenses\s+\((.+?)\)\s+in\s+liquid\s+debt\s+funds\s+or\s+high-yield\s+savings\s+before\s+allocating\s+capital\s+to\s+locked-in\s+assets\.$/i,
    translate: (m) => `லாக்-இன் சொத்துக்களுக்கு மூலதனத்தை ஒதுக்குவதற்கு முன் குறைந்தபட்சம் 3–6 மாத வாழ்க்கைச் செலவுகளை (${m[1]}) திரவ கடன் நிதிகள் அல்லது உயர் சேமிப்பில் பராமரிக்கவும்.`,
  },
  // 8. Red Flag: REIT concentration %
  {
    pattern: /^Combined\s+REIT\s+and\s+InvIT\s+exposure\s+is\s+([\d.]+%\s+of\s+the\s+portfolio),\s+which\s+is\s+above\s+the\s+recommended\s+ceiling\s+for\s+a\s+(.+?)\s+risk\s+profile\.$/i,
    translate: (m) => `ஒருங்கிணைந்த REIT மற்றும் InvIT ஒதுக்கீடு ${m[1]} ஆக உள்ளது, இது ${m[2]} இடர் சுயவிவரத்திற்கான பரிந்துரைக்கப்பட்ட உச்சவரம்பிற்கு மேல் உள்ளது.`,
  },
  // 9. Guardian: Dynamic mechanism — "Your portfolio currently includes X, Y. These holdings match the Z signal..."
  {
    pattern: /^Your\s+portfolio\s+currently\s+includes\s+(.+?)\.\s+These\s+holdings\s+match\s+the\s+(.+?)\s+signal\s+and\s+can\s+transmit\s+the\s+market\s+event\s+into\s+your\s+asset\s+mix\.$/i,
    translate: (m) => `உங்கள் போர்ட்ஃபோலியோ தற்போது ${m[1]}-ஐ உள்ளடக்கியுள்ளது. இந்த முதலீடுகள் ${m[2]} சமிக்ஞையுடன் பொருந்துகின்றன மற்றும் சந்தை நிகழ்வை உங்கள் சொத்து கலவைக்கு அனுப்பலாம்.`,
  },
  // 10. Guardian: Dynamic impact — "This could shift the risk profile for X based on the current market condition..."
  {
    pattern: /^This\s+could\s+shift\s+the\s+risk\s+profile\s+for\s+(.+?)\s+based\s+on\s+the\s+current\s+market\s+condition,\s+without\s+implying\s+a\s+fixed\s+rupee\s+outcome\s+for\s+a\s+non-uploaded\s+or\s+demo\s+portfolio\.$/i,
    translate: (m) => `இது ${m[1]}-க்கான இடர் சுயவிவரத்தை தற்போதைய சந்தை நிலைமையின் அடிப்படையில் மாற்றலாம், இது ஒரு டெமோ போர்ட்ஃபோலியோவிற்கு நிலையான ரூபாய் விளைவை குறிக்கவில்லை.`,
  },

  // ── 11. Health Score Engine: Dynamic Concentration Reason ──
  {
    pattern: /^Holdings\s+exceeding\s+25%\s+threshold:\s*(.+?)\.\s*Deducted\s+([\d.]+)\s+pts\s*\(capped\s+at\s+25\)\.$/i,
    translate: (m) => `25% வரம்பை தாண்டிய முதலீடுகள்: ${m[1]}. ${m[2]} புள்ளிகள் கழிக்கப்பட்டன (அதிகபட்சம் 25).`,
  },
  // ── 12. Health Score Engine: Dynamic Liquidity Mismatch Reason ──
  {
    pattern: /^Illiquid\s+REIT\/InvIT\s+instruments\s+with\s+lock-in:\s*(.+?)\.\s*Deducted\s+([\d.]+)\s+pts\s*\(capped\s+at\s+30\)\.$/i,
    translate: (m) => `லாக்-இன் கொண்ட திரவமற்ற REIT/InvIT கருவிகள்: ${m[1]}. ${m[2]} புள்ளிகள் கழிக்கப்பட்டன (அதிகபட்சம் 30).`,
  },
  // ── 13. Health Score Engine: Dynamic Volatility Exposure Reason ──
  {
    pattern: /^Combined\s+REIT\s+\+\s+InvIT\s+\+\s+Equity\s+allocation\s+is\s+([\d.]+%)\s*\(exceeds\s+50%\s+threshold\s+by\s+([\d.]+%)\)\.\s*Deducted\s+([\d.]+)\s+pts\.$/i,
    translate: (m) => `ஒருங்கிணைந்த REIT + InvIT + பங்கு ஒதுக்கீடு ${m[1]} (50% வரம்பை விட ${m[2]} அதிகம்). ${m[3]} புள்ளிகள் கழிக்கப்பட்டன.`,
  },
  // ── 14. Health Score Engine: Dynamic Diversification Gap Reason ──
  {
    pattern: /^Only\s+(\d+)\s+distinct\s+asset\s+class(?:es)?\s+present\s*\((.+?)\)\.\s*Deducted\s+([\d.]+)\s+pts\.$/i,
    translate: (m) => `${m[1]} தனித்துவமான சொத்துப் பிரிவுகள் மட்டுமே உள்ளன (${m[2]}). ${m[3]} புள்ளிகள் கழிக்கப்பட்டன.`,
  },
  // ── 15. Health Score Engine: Dynamic Concentration Suggestion ──
  {
    pattern: /^Rebalance\s+single\s+holdings\s+above\s+25%\s+to\s+recover\s+up\s+to\s+([\d.]+)\s+points\.$/i,
    translate: (m) => `25%-க்கு மேல் உள்ள ஒற்றை முதலீடுகளை மறுசீரமைப்பதன் மூலம் அதிகபட்சமாக ${m[1]} புள்ளிகளை மீட்டெடுக்கலாம்.`,
  },
  // ── 16. Health Score Engine: Dynamic Volatility Suggestion ──
  {
    pattern: /^Trimming\s+market-sensitive\s+exposure\s+below\s+50%\s+can\s+recover\s+up\s+to\s+([\d.]+)\s+points\.$/i,
    translate: (m) => `சந்தை உணர்திறன் வெளிப்பாட்டை 50%-க்கு கீழ் குறைப்பதன் மூலம் அதிகபட்சமாக ${m[1]} புள்ளிகளை மீட்டெடுக்கலாம்.`,
  },
  // ── 17. Health Score Engine: Descriptions ──
  {
    pattern: /^High\s+concentration\s+in:\s*(.+)$/i,
    translate: (m) => `அதிக செறிவு: ${m[1]}`,
  },
  {
    pattern: /^Lock-in\s+restriction\s+detected\s+on:\s*(.+)$/i,
    translate: (m) => `லாக்-இன் கட்டுப்பாடு கண்டறியப்பட்டது: ${m[1]}`,
  },
  {
    pattern: /^([\d.]+%)\s+in\s+market\/rate-sensitive\s+assets\s+\(threshold:\s*50%\)$/i,
    translate: (m) => `சந்தை/வட்டி உணர்திறன் சொத்துக்களில் ${m[1]} (வரம்பு: 50%)`,
  },
  {
    pattern: /^Portfolio\s+has\s+only\s+(\d+)\s+distinct\s+asset\s+class(?:es)?$/i,
    translate: (m) => `போர்ட்ஃபோலியோவில் ${m[1]} தனித்துவமான சொத்துப் பிரிவுகள் மட்டுமே உள்ளன`,
  },

  // ── 18. Red Flag Title: Generic Lock-in e.g. "36-Month Product Lock-In" ──
  {
    pattern: /^(\d+)-Month\s+Product\s+Lock-In$/i,
    translate: (m) => `${m[1]} மாத தயாரிப்பு லாக்-இன்`,
  },
  // ── 19. Red Flag Title: Suitability risk mismatch on X ──
  {
    pattern: /^Suitability\s+risk\s+mismatch\s+on\s+(.+)$/i,
    translate: (m) => `${m[1]}-ல் பொருத்தப்பாட்டு இடர் முரண்பாடு`,
  },
  // ── 20. Red Flag Description: Mandatory lock-in ──
  {
    pattern: /^(.+?)\s+carries\s+a\s+mandatory\s+(\d+)-month\s+lock-in\s+restriction\.$/i,
    translate: (m) => `${m[1]} கட்டாய ${m[2]} மாத லாக்-இன் கட்டுப்பாட்டைக் கொண்டுள்ளது.`,
  },
  // ── 21. Red Flag Description: Combined REIT/InvIT exposure is X% (₹Y)... ──
  {
    pattern: /^Combined\s+REIT\/InvIT\s+exposure\s+is\s+([\d.]+%)\s*\((.+?)\),\s*exceeding\s+the\s+recommended\s+([\d.]+%)\s+ceiling\s+for\s+(.+?)\s+profiles?\.$/i,
    translate: (m) => `ஒருங்கிணைந்த REIT/InvIT வெளிப்பாடு ${m[1]} (${m[2]}) ஆக உள்ளது, இது ${m[4]} முதலீட்டாளர்களுக்கான பரிந்துரைக்கப்பட்ட ${m[3]} வரம்பிற்கு மேல் உள்ளது.`,
  },
  // ── 22. Red Flag Action: Review whether this asset fits your overall financial goals... ──
  {
    pattern: /^Review\s+whether\s+this\s+asset\s+fits\s+your\s+overall\s+financial\s+goals,\s+or\s+consider\s+reallocating\s+to\s+lower-risk\s+instruments\s+matching\s+your\s+(.+?)\s+profile\s+\(e\.g\.,\s+sovereign\s+debt\s+or\s+balanced\s+hybrid\s+funds\)\.$/i,
    translate: (m) => `இந்த சொத்து உங்கள் ஒட்டுமொத்த நிதி இலக்குகளுக்கு பொருந்துகிறதா என்பதை மதிப்பாய்வு செய்யவும் அல்லது உங்கள் ${m[1]} சுயவிவரத்திற்கு பொருந்தக்கூடிய குறைந்த ஆபத்துள்ள கருவிகளுக்கு (எ.கா., அரசு பத்திரங்கள் அல்லது சமச்சீர் நிதிகள்) மாற்ற பரிசீலிக்கவும்.`,
  },
  // ── 23. Nomination & Estate Readiness: All X accounts title ──
  {
    pattern: /^Nomination\s+&\s+Estate\s+Readiness\s+—\s+All\s+(\d+)\s+accounts?\s+ha(?:ve|s)\s+a\s+nominee\s+registered$/i,
    translate: (m) => `நியமனம் & சொத்து தயார்நிலை — அனைத்து ${m[1]} கணக்குகளிலும் நியமனதாரர் பதிவு செய்யப்பட்டுள்ளார்`,
  },
  // ── 24. Nomination & Estate Readiness: X of Y accounts title ──
  {
    pattern: /^Nomination\s+&\s+Estate\s+Readiness\s+—\s+(\d+)\s+of\s+(\d+)\s+accounts?\s+ha(?:ve|s)\s+a\s+nominee\s+registered$/i,
    translate: (m) => `நியமனம் & சொத்து தயார்நிலை — ${m[2]}-ல் ${m[1]} கணக்குகளில் மட்டுமே நியமனதாரர் பதிவு செய்யப்பட்டுள்ளார்`,
  },
  // ── 25. Nomination & Estate Readiness: Without a nominee warning ──
  {
    pattern: /^Without\s+a\s+nominee,\s+your\s+(.+?)\s+holding\s+may\s+require\s+a\s+lengthy\s+legal\s+claim\s+process\s+for\s+your\s+family\s+to\s+access\s+funds\.$/i,
    translate: (m) => `நியமனதாரர் இல்லாமல், உங்கள் ${m[1]} முதலீட்டிலிருந்து குடும்பத்தினர் நிதியை அணுக நீண்ட சட்ட உரிமை கோரல் செயல்முறை தேவைப்படலாம்.`,
  },
];

/**
 * Translates an explanation sentence or template phrase.
 * If lang is 'en' or no translation is available, returns the original text.
 */
export function translateExplanation(text?: string | null, lang: LanguageCode = 'en'): string {
  if (!text) return '';
  if (lang === 'en') return text;

  const trimmed = text.trim();

  // 1. Direct dictionary match
  if (PHRASE_MAP_TA[trimmed]) {
    return PHRASE_MAP_TA[trimmed];
  }

  // 2. Pattern-based template translation
  for (const rule of PATTERN_RULES_TA) {
    const match = trimmed.match(rule.pattern);
    if (match) {
      return rule.translate(match);
    }
  }

  // 3. Fallback to original text if no template rule matched
  return text;
}

/**
 * Returns the CSS font-family class for the chosen language.
 * When lang === 'ta', returns 'font-tamil'.
 */
export function getLanguageFontClass(lang: LanguageCode = 'en'): string {
  return lang === 'ta' ? 'font-tamil' : '';
}
