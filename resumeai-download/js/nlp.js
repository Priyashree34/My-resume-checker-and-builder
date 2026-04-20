/**
 * NLP Engine — Real TF-IDF + Cosine Similarity (no server needed)
 */

const NLP = (() => {

  // ── Stop words ──────────────────────────────────────────────────────────────
  const STOP_WORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','being','have','has','had','do',
    'does','did','will','would','could','should','may','might','shall','can',
    'not','this','that','these','those','i','we','you','he','she','it','they',
    'my','our','your','his','her','its','their','me','us','him','them','who',
    'which','what','how','when','where','why','about','into','through','during',
    'including','until','against','among','throughout','despite','towards',
    'upon','concerning','as','also','both','each','more','most','other','some',
    'such','than','then','there','use','used','using','able','across','after',
    'all','already','although','always','any','because','before','between',
    'even','every','few','first','following','given','however','important',
    'including','like','make','many','new','no','only','per','plus','provide',
    'since','strong','support','well','within','without','work','year','years'
  ]);

  // ── Tokenize ─────────────────────────────────────────────────────────────────
  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s\+\#\.]/g, ' ')
      .split(/\s+/)
      .map(t => t.replace(/[^a-z0-9\+\#]/g, ''))
      .filter(t => t.length > 2 && !STOP_WORDS.has(t));
  }

  // ── Term Frequency ────────────────────────────────────────────────────────────
  function tf(tokens) {
    const freq = {};
    tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    const max = Math.max(...Object.values(freq), 1);
    const result = {};
    for (const [t, c] of Object.entries(freq)) result[t] = c / max;
    return result;
  }

  // ── IDF across two docs ───────────────────────────────────────────────────────
  function idf(allTokenSets) {
    const N = allTokenSets.length;
    const df = {};
    allTokenSets.forEach(tokens => {
      new Set(tokens).forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
    const result = {};
    for (const [t, count] of Object.entries(df)) {
      result[t] = Math.log((N + 1) / (count + 1)) + 1;
    }
    return result;
  }

  // ── TF-IDF vector ─────────────────────────────────────────────────────────────
  function tfidfVector(tokens, idfMap) {
    const tfMap = tf(tokens);
    const vec = {};
    for (const [t, tfVal] of Object.entries(tfMap)) {
      vec[t] = tfVal * (idfMap[t] || 1);
    }
    return vec;
  }

  // ── Cosine similarity ─────────────────────────────────────────────────────────
  function cosineSimilarity(vecA, vecB) {
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dot = 0, magA = 0, magB = 0;
    allTerms.forEach(t => {
      const a = vecA[t] || 0;
      const b = vecB[t] || 0;
      dot  += a * b;
      magA += a * a;
      magB += b * b;
    });
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // ── Extract n-grams (bigrams) ─────────────────────────────────────────────────
  function bigrams(tokens) {
    const bg = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bg.push(tokens[i] + '_' + tokens[i+1]);
    }
    return bg;
  }

  // ── Main analysis function ────────────────────────────────────────────────────
  function analyze(resumeText, jdText) {
    const resumeTokens = tokenize(resumeText);
    const jdTokens = tokenize(jdText);
    const resumeBigrams = bigrams(resumeTokens);
    const jdBigrams = bigrams(jdTokens);

    const allTokens  = [...resumeTokens, ...resumeBigrams];
    const allJdTokens = [...jdTokens, ...jdBigrams];

    const idfMap = idf([allTokens, allJdTokens]);
    const resumeVec = tfidfVector(allTokens, idfMap);
    const jdVec     = tfidfVector(allJdTokens, idfMap);

    const rawSim = cosineSimilarity(resumeVec, jdVec);
    const overallScore = Math.min(100, Math.round(rawSim * 180));

    // ── Keyword matching ──────────────────────────────────────────────────────
    const jdTermSet  = new Set(jdTokens);
    const resumeTermSet = new Set(resumeTokens);

    const matched  = [...jdTermSet].filter(t => resumeTermSet.has(t) && t.length > 3);
    const missing  = [...jdTermSet].filter(t => !resumeTermSet.has(t) && t.length > 3);

    // Sort missing by IDF weight (most important first)
    const sortedMissing = missing
      .map(t => ({ term: t, weight: idfMap[t] || 0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(x => x.term);

    const keywordScore = Math.min(100, Math.round((matched.length / Math.max(jdTermSet.size, 1)) * 130));

    // ── Skills detection ──────────────────────────────────────────────────────
    const TECH_SKILLS = [
      'python','javascript','typescript','java','golang','rust','c++','c#','ruby','php','swift','kotlin',
      'react','angular','vue','nextjs','nodejs','express','django','fastapi','flask','spring',
      'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins','cicd',
      'sql','postgresql','mysql','mongodb','redis','elasticsearch','kafka','spark','hadoop',
      'machine learning','deep learning','nlp','tensorflow','pytorch','scikit','pandas','numpy',
      'git','linux','bash','rest','graphql','microservices','agile','scrum','devops',
      'html','css','sass','tailwind','webpack','figma','photoshop','excel','tableau','powerbi',
      'salesforce','jira','confluence','slack','testing','selenium','jest','pytest'
    ];

    const resumeLower = resumeText.toLowerCase();
    const jdLower = jdText.toLowerCase();

    const jdSkills     = TECH_SKILLS.filter(s => jdLower.includes(s));
    const matchedSkills = jdSkills.filter(s => resumeLower.includes(s));
    const missingSkills = jdSkills.filter(s => !resumeLower.includes(s));

    const skillsScore = jdSkills.length > 0
      ? Math.min(100, Math.round((matchedSkills.length / jdSkills.length) * 100))
      : 50;

    // ── Section detection ─────────────────────────────────────────────────────
    const sections = {
      hasEmail:      /\b[\w.]+@[\w.]+\.\w+\b/.test(resumeText),
      hasPhone:      /(\+?\d[\d\s\-\(\)]{7,})/.test(resumeText),
      hasSummary:    /(summary|objective|profile|about)/i.test(resumeText),
      hasExperience: /(experience|employment|work history)/i.test(resumeText),
      hasEducation:  /(education|degree|university|college|bachelor|master)/i.test(resumeText),
      hasSkills:     /(skills|technologies|competencies|expertise)/i.test(resumeText),
      hasMetrics:    /\d+%|\d+x|\$[\d,]+|\d+ (users|clients|projects|team)/i.test(resumeText),
      hasActionVerbs:/(led|built|developed|managed|increased|reduced|designed|implemented|created|launched|improved|achieved|delivered|optimized|scaled|mentored)/i.test(resumeText),
    };

    const sectionCount = Object.values(sections).filter(Boolean).length;
    const formatScore = Math.round((sectionCount / 8) * 100);
    const experienceScore = Math.round(
      ((sections.hasExperience ? 40 : 0) +
       (sections.hasMetrics    ? 35 : 0) +
       (sections.hasActionVerbs? 25 : 0))
    );

    // ── Bullet point extraction ───────────────────────────────────────────────
    const bullets = resumeText
      .split('\n')
      .map(l => l.replace(/^[\s\-•*·▪►]+/, '').trim())
      .filter(l => l.length > 30 && l.length < 300)
      .slice(0, 6);

    return {
      overallScore,
      keywordScore,
      skillsScore,
      experienceScore,
      formatScore,
      matched: matched.slice(0, 20),
      missing: sortedMissing,
      matchedSkills,
      missingSkills,
      sections,
      bullets,
      rawSimilarity: rawSim
    };
  }

  return { analyze, tokenize };
})();
