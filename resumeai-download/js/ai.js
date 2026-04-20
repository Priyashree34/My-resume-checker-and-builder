/**
 * AI Engine — Groq API (FREE - get key at console.groq.com/keys)
 * Model: llama-3.3-70b-versatile
 */
const AI = (() => {

  async function call(systemPrompt, userPrompt) {
    const apiKey = AppState.getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq API error ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return JSON.parse(text.replace(/^```json\s*/i,'').replace(/\s*```$/i,'').trim());
  }

  async function deepAnalysis(resumeText, jdText, nlpResult) {
    return await call(
      `You are an expert ATS system and senior technical recruiter with 15+ years experience. Analyze resumes with surgical precision. Always respond with a single valid JSON object only.`,
      `Analyze this resume against the job description deeply and provide detailed feedback.

== RESUME ==
${resumeText.substring(0, 2500)}

== JOB DESCRIPTION ==
${jdText.substring(0, 1800)}

== PRE-COMPUTED NLP SCORES ==
TF-IDF Cosine Similarity: ${nlpResult.overallScore}/100
Keyword Match: ${nlpResult.keywordScore}/100
Skills Match: ${nlpResult.skillsScore}/100
Matched Keywords (${nlpResult.matched.length}): ${nlpResult.matched.slice(0,15).join(', ')}
Missing Keywords: ${nlpResult.missing.slice(0,12).join(', ')}
Matched Skills: ${nlpResult.matchedSkills.join(', ') || 'none'}
Missing Skills: ${nlpResult.missingSkills.join(', ') || 'none'}

Return exactly this JSON:
{
  "aiOverallScore": <integer 0-100>,
  "verdict": "<Excellent Match|Strong Match|Good Match|Needs Work|Poor Match>",
  "verdictEmoji": "<✅|🟢|🟡|🟠|🔴>",
  "executiveSummary": "<3 sentences: overall fit, top strength, biggest gap>",
  "keyStrengths": ["<specific strength with evidence>","<strength>","<strength>"],
  "criticalGaps": ["<gap with concrete recommendation>","<gap>","<gap>"],
  "missingKeywordsRanked": [
    {"keyword":"<term>","importance":"<critical|high|medium>","context":"<why it matters>"},
    {"keyword":"<term>","importance":"<critical|high|medium>","context":"<why>"},
    {"keyword":"<term>","importance":"<critical|high|medium>","context":"<why>"},
    {"keyword":"<term>","importance":"<critical|high|medium>","context":"<why>"},
    {"keyword":"<term>","importance":"<critical|high|medium>","context":"<why>"}
  ],
  "bulletImprovements": [
    {"original":"<weak bullet from resume>","improved":"<action verb + what + quantified result>","principle":"<why better>"},
    {"original":"<weak bullet>","improved":"<improved>","principle":"<tip>"},
    {"original":"<weak bullet>","improved":"<improved>","principle":"<tip>"}
  ],
  "sectionFeedback": {
    "summary":"<feedback on summary>",
    "experience":"<feedback on experience>",
    "skills":"<feedback on skills>",
    "education":"<feedback on education>"
  },
  "atsWarnings": ["<ATS formatting issue if any>"],
  "quickWins": ["<actionable change #1>","<change #2>","<change #3>","<change #4>"],
  "interviewLikelyQuestions": ["<likely question based on gap>","<question>","<question>"]
}`
    );
  }

  async function buildResume(userData) {
    const expText = (userData.experiences||[])
      .filter(e => e.title||e.company)
      .map(e => `ROLE: ${e.title} at ${e.company}${e.location?', '+e.location:''} (${e.start}–${e.end})\nBULLETS:\n${e.bullets}`)
      .join('\n\n');

    return await call(
      `You are an elite professional resume writer and ATS optimization specialist. Write resumes that pass ATS systems and impress human recruiters. Always respond with a single valid JSON object only.`,
      `Build a complete ATS-optimized professional resume for this candidate.

NAME: ${userData.name}
TARGET TITLE: ${userData.targetTitle}
EMAIL: ${userData.email} | PHONE: ${userData.phone} | LOCATION: ${userData.location}
LINKEDIN: ${userData.linkedin||'N/A'} | GITHUB: ${userData.github||'N/A'}
YEARS EXP: ${userData.yearsExp||'N/A'}

EXPERIENCE:
${expText||'Not provided'}

EDUCATION: ${userData.degree} from ${userData.school}, ${userData.gradYear}${userData.gpa?', GPA: '+userData.gpa:''}
SKILLS: ${userData.skills}
CERTIFICATIONS: ${userData.certs||'None'}
PROJECTS: ${userData.projects||'None'}

TARGET JD:
${(userData.targetJD||'Write a strong general resume for the target title').substring(0,1500)}

RULES:
1. Summary: 3 powerful sentences — years+domain+strength | key tech skills | value proposition
2. Every bullet: strong past-tense action verb (Led/Built/Engineered/Optimized/Reduced/Increased/Delivered/Launched/Scaled/Designed/Architected/Automated/Mentored)
3. Add realistic quantified metrics (%, $, team size, users, time)
4. Inject JD keywords naturally throughout
5. Skills: most JD-relevant first

Return exactly this JSON:
{
  "professionalSummary": "<3 powerful keyword-rich sentences>",
  "skills": {
    "technical": ["skill1","skill2","...up to 16"],
    "soft": ["skill1","skill2","...up to 5"]
  },
  "experience": [
    {
      "title":"<title>","company":"<company>","location":"<location>","start":"<Month Year>","end":"<Month Year or Present>",
      "bullets":["<Action verb + what + metric>","<bullet>","<bullet>","<bullet>"]
    }
  ],
  "education": {"degree":"<degree>","school":"<school>","year":"<year>","gpa":"<gpa>","honors":"<honors if any>"},
  "certifications": ["<cert1>","<cert2>"],
  "projects": [
    {"name":"<name>","description":"<1-2 sentences with tech + impact>","tech":["tech1","tech2"]}
  ],
  "keywordsInjected": ["kw1","kw2","kw3","kw4","kw5","kw6"],
  "atsScore": <integer 0-100>
}`
    );
  }

  return { deepAnalysis, buildResume };
})();
