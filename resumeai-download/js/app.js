/* ── App Controller ─────────────────────────────────────────────────────────── */

let expCount = 0;

// ── Navigation ─────────────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.topbar-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const btn = document.querySelector(`[data-page="${id}"]`);
  if (btn) btn.classList.add('active');

  const apibar = document.getElementById('apibar');
  apibar.style.display = (id === 'home') ? 'none' : 'flex';
}

// ── API Key ────────────────────────────────────────────────────────────────────
function initApiKey() {
  const input = document.getElementById('apiKeyInput');
  const status = document.getElementById('apiKeyStatus');
  if (AppState.hasApiKey()) {
    input.value = AppState.getApiKey();
    setStatus(true);
  }
  input.addEventListener('input', () => {
    AppState.setApiKey(input.value.trim());
    setStatus(AppState.hasApiKey());
  });
  function setStatus(ok) {
    status.textContent = ok ? '✓ Key saved' : 'Paste your key';
    status.style.color = ok ? 'var(--green)' : 'var(--text2)';
  }
}

// ── Result tabs ────────────────────────────────────────────────────────────────
function switchRTab(id) {
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.rpanel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-rtab="${id}"]`).classList.add('active');
  document.getElementById(id).classList.add('active');
}

// ── CHECKER ────────────────────────────────────────────────────────────────────
async function runChecker() {
  const resume = document.getElementById('resumeInput').value.trim();
  const jd = document.getElementById('jdInput').value.trim();

  if (!resume) return showAlert('checkerAlert', 'Please paste your resume text.', 'error');
  if (!jd) return showAlert('checkerAlert', 'Please paste the job description.', 'error');
  if (!AppState.hasApiKey()) return showAlert('checkerAlert', 'Please enter your Groq API key above. Get one free at console.groq.com/keys', 'error');

  const btn = document.getElementById('checkBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analyzing...';

  const rs = document.getElementById('results-section');
  rs.className = 'show';
  rs.innerHTML = loadingHTML([
    'Running TF-IDF analysis...',
    'Computing cosine similarity...',
    'Detecting skills & keywords...',
    'AI deep analysis (Llama 3.3 70B)...',
    'Generating improvements...'
  ]);

  try {
    const steps = rs.querySelectorAll('.step-item');
    for (let i = 0; i < 3; i++) {
      if (steps[i]) steps[i].className = 'step-item done';
      if (steps[i+1]) steps[i+1].className = 'step-item cur';
      await delay(250);
    }

    const nlp = NLP.analyze(resume, jd);

    if (steps[3]) steps[3].className = 'step-item cur';
    const ai = await AI.deepAnalysis(resume, jd, nlp);
    if (steps[3]) steps[3].className = 'step-item done';
    if (steps[4]) steps[4].className = 'step-item cur';
    await delay(200);

    const finalScore = Math.round(nlp.overallScore * 0.4 + ai.aiOverallScore * 0.6);
    renderResults(nlp, ai, finalScore);
  } catch(e) {
    rs.innerHTML = `<div class="alert alert-error">⚠ ${e.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Check ATS Match';
}

function renderResults(nlp, ai, finalScore) {
  const col = finalScore >= 75 ? 'var(--green)' : finalScore >= 50 ? 'var(--amber)' : 'var(--red)';
  const vbc = finalScore >= 75 ? 'vb-green' : finalScore >= 50 ? 'vb-amber' : 'vb-red';
  const C = 2 * Math.PI * 56;
  const dash = (finalScore / 100) * C;

  const bars = [
    {l:'Keyword Match', v:nlp.keywordScore, c:'var(--accent)'},
    {l:'Skills Match', v:nlp.skillsScore, c:'var(--green)'},
    {l:'Experience Quality', v:nlp.experienceScore, c:'var(--purple)'},
    {l:'Formatting', v:nlp.formatScore, c:'var(--amber)'},
  ];

  const kwHTML = (ai.missingKeywordsRanked||[]).map(k=>`
    <div class="kw-row">
      <div class="kw-name">${k.keyword}</div>
      <div class="kw-ctx">${k.context}</div>
      <div class="imp imp-${k.importance}">${k.importance}</div>
    </div>`).join('') || '<p style="color:var(--text3);font-size:13px">No critical missing keywords!</p>';

  const bulletHTML = (ai.bulletImprovements||[]).map(b=>`
    <div class="bcard">
      <div class="bcard-old">${b.original}</div>
      <div style="color:var(--green);font-size:12px;font-weight:600;margin-bottom:6px">↓ IMPROVED</div>
      <div class="bcard-new">${b.improved}</div>
      <div class="bcard-why">${b.principle}</div>
    </div>`).join('');

  const secFB = ai.sectionFeedback||{};
  const fbHTML = Object.entries(secFB).map(([s,t])=>`
    <div class="fb-row"><div class="fb-sec">${s}</div><div class="fb-txt">${t}</div></div>`).join('');

  const warnHTML = (ai.atsWarnings||[]).map(w=>`
    <div class="qw-item"><div class="qw-n" style="background:var(--amberGlow);color:var(--amber)">!</div><div class="qw-t">${w}</div></div>`)
    .join('') || '<p style="color:var(--text3);font-size:13px">No major ATS formatting issues detected.</p>';

  const qwHTML = (ai.quickWins||[]).map((w,i)=>`
    <div class="qw-item"><div class="qw-n">${i+1}</div><div class="qw-t">${w}</div></div>`).join('');

  const iqHTML = (ai.interviewLikelyQuestions||[]).map(q=>`
    <div class="qw-item">
      <div class="qw-n" style="background:var(--purpleGlow);color:var(--purple)">Q</div>
      <div class="qw-t">${q}</div>
    </div>`).join('');

  const secCheckHTML = Object.entries(nlp.sections||{}).map(([k,v])=>`
    <div class="sec-item">
      <span style="color:${v?'var(--green)':'var(--red)'};font-weight:700">${v?'✓':'✗'}</span>
      <span>${sectionLabel(k)}</span>
    </div>`).join('');

  document.getElementById('results-section').innerHTML = `
    <!-- Score Hero -->
    <div class="score-hero">
      <div class="score-ring-wrap">
        <svg viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="56" fill="none" stroke="var(--bg4)" stroke-width="10"/>
          <circle cx="65" cy="65" r="56" fill="none" stroke="${col}" stroke-width="10"
            stroke-dasharray="${dash} ${C}" stroke-linecap="round"/>
        </svg>
        <div class="score-ring-inner">
          <div class="score-num" style="color:${col}">${finalScore}</div>
          <div class="score-lbl">ATS Score</div>
        </div>
      </div>
      <div class="score-info" style="flex:1">
        <div class="verdict-badge ${vbc}">${ai.verdictEmoji||''} ${ai.verdict}</div>
        <h3>${ai.verdict}</h3>
        <p>${ai.executiveSummary}</p>
        <div class="score-bars-grid" style="margin-top:18px">
          ${bars.map(b=>`
          <div class="score-bar-row">
            <div class="sbl">${b.l}</div>
            <div class="sbt"><div class="sbf" style="width:${b.v}%;background:${b.c}"></div></div>
            <div class="sbp" style="color:${b.c}">${b.v}%</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Result Tabs -->
    <div class="rtabs">
      <button class="rtab active" data-rtab="rt-keywords" onclick="switchRTab('rt-keywords')">🔑 Keywords</button>
      <button class="rtab" data-rtab="rt-skills" onclick="switchRTab('rt-skills')">⚡ Skills</button>
      <button class="rtab" data-rtab="rt-bullets" onclick="switchRTab('rt-bullets')">✍ Bullet Fixes</button>
      <button class="rtab" data-rtab="rt-sections" onclick="switchRTab('rt-sections')">📋 Sections</button>
      <button class="rtab" data-rtab="rt-actions" onclick="switchRTab('rt-actions')">🎯 Action Plan</button>
    </div>

    <div class="rpanel active" id="rt-keywords">
      <div class="rcard">
        <div class="rcard-title">✅ Matched Keywords (${nlp.matched.length})</div>
        <div class="chips">${(nlp.matched||[]).map(k=>`<span class="chip chip-g">${k}</span>`).join('')||'<span style="color:var(--text3)">None detected</span>'}</div>
      </div>
      <div class="rcard">
        <div class="rcard-title">❌ Missing Keywords — Ranked by Importance</div>
        <div class="rcard-sub">Add these to boost your ATS score significantly</div>
        ${kwHTML}
      </div>
    </div>

    <div class="rpanel" id="rt-skills">
      <div class="rcard">
        <div class="rcard-title">✅ Skills You Have</div>
        <div class="chips">${(nlp.matchedSkills||[]).map(s=>`<span class="chip chip-g">${s}</span>`).join('')||'<span style="color:var(--text3)">No common skills detected</span>'}</div>
      </div>
      <div class="rcard">
        <div class="rcard-title">❌ Skills Required by JD (Missing)</div>
        <div class="chips" style="margin-bottom:16px">${(nlp.missingSkills||[]).map(s=>`<span class="chip chip-r">${s}</span>`).join('')||'<span style="color:var(--text3)">No major skill gaps!</span>'}</div>
      </div>
      <div class="rcard">
        <div class="rcard-title">💪 Key Strengths</div>
        ${(ai.keyStrengths||[]).map(s=>`<div class="qw-item"><div class="qw-n" style="background:var(--greenGlow);color:var(--green)">+</div><div class="qw-t">${s}</div></div>`).join('')}
      </div>
      <div class="rcard">
        <div class="rcard-title">⚠ Critical Gaps</div>
        ${(ai.criticalGaps||[]).map(s=>`<div class="qw-item"><div class="qw-n" style="background:var(--redGlow);color:var(--red)">!</div><div class="qw-t">${s}</div></div>`).join('')}
      </div>
    </div>

    <div class="rpanel" id="rt-bullets">
      <div class="rcard">
        <div class="rcard-title">AI-Enhanced Bullet Points</div>
        <div class="rcard-sub">Transform weak bullets into powerful, metric-driven ATS-friendly statements</div>
        ${bulletHTML||'<p style="color:var(--text3);font-size:13px">Your bullet points look strong!</p>'}
      </div>
    </div>

    <div class="rpanel" id="rt-sections">
      <div class="rcard">
        <div class="rcard-title">Section-by-Section Feedback</div>
        ${fbHTML}
      </div>
      <div class="rcard">
        <div class="rcard-title">ATS Formatting Warnings</div>
        ${warnHTML}
      </div>
      <div class="rcard">
        <div class="rcard-title">Resume Completeness Check</div>
        <div class="sec-grid" style="margin-top:10px">${secCheckHTML}</div>
      </div>
    </div>

    <div class="rpanel" id="rt-actions">
      <div class="rcard">
        <div class="rcard-title">⚡ Quick Wins — Do These First</div>
        ${qwHTML}
      </div>
      <div class="rcard">
        <div class="rcard-title">🎤 Likely Interview Questions (Based on Your Gaps)</div>
        ${iqHTML}
      </div>
    </div>
  `;
}

// ── BUILDER ────────────────────────────────────────────────────────────────────
function addExp() {
  const id = ++expCount;
  const div = document.createElement('div');
  div.className = 'exp-entry';
  div.id = 'exp-' + id;
  div.innerHTML = `
    <button class="exp-rm" onclick="document.getElementById('exp-${id}').remove()" title="Remove">✕</button>
    <div class="g2" style="margin-bottom:12px">
      <div class="field"><label>Job Title</label><input type="text" id="et${id}" placeholder="Senior Software Engineer"/></div>
      <div class="field"><label>Company</label><input type="text" id="ec${id}" placeholder="Acme Corp"/></div>
    </div>
    <div class="g3" style="margin-bottom:12px">
      <div class="field"><label>Location</label><input type="text" id="el${id}" placeholder="Remote / Jaipur"/></div>
      <div class="field"><label>Start Date</label><input type="text" id="es${id}" placeholder="Jan 2022"/></div>
      <div class="field"><label>End Date</label><input type="text" id="ee${id}" placeholder="Present"/></div>
    </div>
    <div class="field">
      <label>Key Responsibilities (one per line — AI will enhance these)</label>
      <textarea id="eb${id}" rows="4" placeholder="Built REST APIs handling 2M requests/day&#10;Led migration to microservices architecture&#10;Mentored junior developers and conducted code reviews"></textarea>
    </div>`;
  document.getElementById('expList').appendChild(div);
}

function collectData() {
  const exps = [];
  document.querySelectorAll('.exp-entry').forEach(el => {
    const id = el.id.replace('exp-','');
    exps.push({
      title: val(`et${id}`), company: val(`ec${id}`),
      location: val(`el${id}`), start: val(`es${id}`),
      end: val(`ee${id}`), bullets: val(`eb${id}`)
    });
  });
  return {
    name:val('bName'), targetTitle:val('bTitle'),
    email:val('bEmail'), phone:val('bPhone'),
    location:val('bLoc'), linkedin:val('bLinkedin'),
    github:val('bGithub'), yearsExp:val('bYears'),
    skills:val('bSkills'), certs:val('bCerts'),
    degree:val('bDegree'), school:val('bSchool'),
    gradYear:val('bYear'), gpa:val('bGpa'),
    projects:val('bProjects'), targetJD:val('bJD'),
    experiences:exps
  };
}

async function runBuilder() {
  const data = collectData();
  if (!data.name) return showAlert('builderAlert','Please enter your full name.','error');
  if (!data.targetTitle) return showAlert('builderAlert','Please enter your target job title.','error');
  if (!AppState.hasApiKey()) return showAlert('builderAlert','Please enter your Groq API key above. Get one free at console.groq.com/keys','error');

  const btn = document.getElementById('buildBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Building Resume...';

  const out = document.getElementById('builderOutput');
  out.style.display = 'block';
  out.innerHTML = loadingHTML([
    'Processing your information...',
    'Crafting professional summary...',
    'Enhancing bullet points...',
    'Injecting ATS keywords...',
    'Finalizing resume...'
  ]);

  try {
    const steps = out.querySelectorAll('.step-item');
    for (let i = 0; i < 5; i++) {
      if (steps[i]) steps[i].className = 'step-item cur';
      await delay(350);
      if (steps[i]) steps[i].className = 'step-item done';
    }
    const result = await AI.buildResume(data);
    result._meta = data;
    renderBuiltResume(result, out);
  } catch(e) {
    out.innerHTML = `<div class="alert alert-error">⚠ ${e.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '✨ Generate ATS Resume';
}

function renderBuiltResume(r, container) {
  const meta = r._meta || {};
  const techSkills = r.skills?.technical || [];
  const softSkills = r.skills?.soft || [];

  const expHTML = (r.experience||[]).map(e=>`
    <div style="margin-bottom:12px">
      <div class="rd-exp-hdr">
        <div>
          <div class="rd-exp-title">${e.title}</div>
          <div class="rd-exp-co">${e.company}${e.location?' · '+e.location:''}</div>
        </div>
        <div class="rd-exp-dates">${e.start} – ${e.end}</div>
      </div>
      <ul class="rd-bullets">${(e.bullets||[]).map(b=>`<li>${b}</li>`).join('')}</ul>
    </div>`).join('');

  const projHTML = (r.projects||[]).filter(p=>p.name).length > 0 ? `
    <div class="rd-sec">
      <div class="rd-sec-title">Projects</div>
      ${(r.projects||[]).map(p=>`
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="font-weight:700;font-size:11pt;color:#0f172a">${p.name}</div>
            <div style="font-size:9pt;color:#64748b">${(p.tech||[]).join(' · ')}</div>
          </div>
          <div class="rd-proj-desc">${p.description}</div>
        </div>`).join('')}
    </div>` : '';

  const certHTML = (r.certifications||[]).filter(c=>c).length > 0 ? `
    <div class="rd-sec">
      <div class="rd-sec-title">Certifications</div>
      <ul class="rd-bullets">${r.certifications.map(c=>`<li>${c}</li>`).join('')}</ul>
    </div>` : '';

  const edu = r.education || {};

  const resumeHTML = `
    <div class="resume-doc" id="resumeDoc">
      <div class="rd-name">${meta.name||'Your Name'}</div>
      <div class="rd-title">${meta.targetTitle||''}</div>
      <div class="rd-contact">
        ${[meta.email,meta.phone,meta.location,meta.linkedin,meta.github].filter(Boolean).map(x=>`<span>${x}</span>`).join('<span style="color:#cbd5e1">·</span>')}
      </div>
      <div class="rd-sec">
        <div class="rd-sec-title">Professional Summary</div>
        <div class="rd-summary">${r.professionalSummary||''}</div>
      </div>
      <div class="rd-sec">
        <div class="rd-sec-title">Technical Skills</div>
        <div class="rd-skills">
          ${techSkills.map(s=>`<span class="rd-skill">${s}</span>`).join('')}
          ${softSkills.map(s=>`<span class="rd-skill rd-skill-soft">${s}</span>`).join('')}
        </div>
      </div>
      ${(r.experience||[]).length?`
      <div class="rd-sec">
        <div class="rd-sec-title">Professional Experience</div>
        ${expHTML}
      </div>`:''}
      ${projHTML}
      <div class="rd-sec">
        <div class="rd-sec-title">Education</div>
        <div class="rd-exp-hdr">
          <div>
            <div class="rd-exp-title">${edu.degree||''}</div>
            <div class="rd-exp-co">${edu.school||''}${edu.honors?' · '+edu.honors:''}</div>
          </div>
          <div class="rd-exp-dates">${edu.year||''}${edu.gpa?' · GPA '+edu.gpa:''}</div>
        </div>
      </div>
      ${certHTML}
    </div>`;

  container.innerHTML = `
    <div class="rcard" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:${r.keywordsInjected?.length?'16px':'0'}">
        <div>
          <div style="font-size:16px;font-weight:700;margin-bottom:4px">Resume Generated!</div>
          <div style="font-size:13px;color:var(--text2)">Estimated ATS Score: <strong style="color:var(--green)">${r.atsScore||85}/100</strong></div>
        </div>
        <button class="btn btn-green" onclick="downloadPDF.call(this, event)">⬇ Download PDF</button>
      </div>
      ${r.keywordsInjected?.length?`
        <div style="border-top:1px solid var(--border);padding-top:14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--text2);margin-bottom:8px">Keywords Injected by AI</div>
          <div class="chips">${r.keywordsInjected.map(k=>`<span class="chip chip-b">${k}</span>`).join('')}</div>
        </div>` : ''}
    </div>
    <div class="preview-wrap">${resumeHTML}</div>
    <button class="btn btn-green btn-full" onclick="downloadPDF.call(this, event)" style="margin-top:4px">⬇ Download PDF Resume</button>
  `;
}

// ── PDF Download — saves directly to Downloads folder ─────────────────────────
function downloadPDF() {
  const doc = document.getElementById('resumeDoc');
  if (!doc) { alert('Please generate a resume first!'); return; }

  const btn = event?.target?.closest('button');
  const origText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating PDF...'; }

  // Build a full self-contained HTML string for the resume
  const resumeCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',Arial,sans-serif;background:white;color:#1a1a1a;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .resume-doc{width:100%;padding:0.55in 0.65in;background:white}
    .rd-name{font-size:24pt;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.1;margin-bottom:4px}
    .rd-title{font-size:11.5pt;color:#334155;font-weight:500;margin:5px 0 10px}
    .rd-contact{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:9.5pt;color:#475569;margin-bottom:14px;padding-bottom:12px;border-bottom:2pt solid #0f172a}
    .rd-sec{margin-bottom:14px}
    .rd-sec-title{font-size:8pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0f172a;padding-bottom:4px;border-bottom:0.75pt solid #cbd5e1;margin-bottom:9px}
    .rd-summary{font-size:10.5pt;color:#334155;line-height:1.6}
    .rd-skills{display:flex;flex-wrap:wrap;gap:5px}
    .rd-skill{background:#f1f5f9;border:0.5pt solid #cbd5e1;border-radius:3px;padding:2px 9px;font-size:9pt;color:#1e3a5f;font-weight:600;display:inline-block;margin:2px}
    .rd-skill-soft{background:#f0fdf4;border-color:#bbf7d0;color:#14532d}
    .rd-exp-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
    .rd-exp-title{font-weight:700;font-size:11pt;color:#0f172a}
    .rd-exp-co{font-size:10pt;color:#475569}
    .rd-exp-dates{font-size:9.5pt;color:#64748b;white-space:nowrap;margin-left:8px}
    .rd-bullets{margin:5px 0 10px 16px;padding-left:4px}
    .rd-bullets li{font-size:10pt;color:#334155;line-height:1.5;margin-bottom:3px}
    .rd-proj-desc{font-size:10pt;color:#475569;margin-top:3px;line-height:1.5}
  `;

  // Use html2pdf.js loaded from CDN
  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => doPDF(doc, resumeCSS, btn, origText);
    script.onerror = () => fallbackPrint(doc, btn, origText);
    document.head.appendChild(script);
  } else {
    doPDF(doc, resumeCSS, btn, origText);
  }
}

function doPDF(doc, css, btn, origText) {
  const workerName = (document.getElementById('bName')?.value || 'Resume').trim().replace(/\s+/g,'_');

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:0;left:-9999px;width:794px;height:1px;border:none;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open();
  iDoc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{width:794px;background:white;overflow-x:hidden;}
      ${css}
      .resume-doc{
        width:794px !important;
        padding:40px 52px !important;
        background:white;
        box-shadow:none !important;
      }
    </style>
  </head><body>
    ${doc.outerHTML}
  </body></html>`);
  iDoc.close();

  setTimeout(() => {
    const target = iDoc.body;

    const opt = {
      margin:       0,
      filename:     workerName + '_Resume.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(target).save()
      .then(() => {
        document.body.removeChild(iframe);
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
      })
      .catch(err => {
        console.error('html2pdf error:', err);
        document.body.removeChild(iframe);
        fallbackPrint(document.getElementById('resumeDoc'), btn, origText);
      });
  }, 900);
}

function fallbackPrint(doc, btn, origText) {
  if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  // Open print dialog as fallback
  const w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><title>Resume</title><style>body{font-family:Arial,sans-serif;padding:0.5in}@media print{body{padding:0}}</style></head><body>' + doc.outerHTML + '</body></html>');
  w.document.close();
  setTimeout(() => { w.print(); }, 600);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function loadingHTML(steps) {
  return `<div class="loading-box">
    <div class="spinner" style="width:36px;height:36px;border-width:3px;margin-bottom:16px"></div>
    <h4>Working on it...</h4>
    <div class="steps-list">
      ${steps.map((s,i)=>`<div class="step-item${i===0?' cur':''}">${s}</div>`).join('')}
    </div>
  </div>`;
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (el) { el.className = `alert alert-${type}`; el.textContent = msg; el.style.display='block'; }
}

function sectionLabel(k) {
  return {hasEmail:'Email address',hasPhone:'Phone number',hasSummary:'Professional summary',
    hasExperience:'Work experience',hasEducation:'Education section',
    hasSkills:'Skills section',hasMetrics:'Quantified metrics',hasActionVerbs:'Action verbs'}[k]||k;
}

const val = id => (document.getElementById(id)?.value||'').trim();
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApiKey();
  addExp();
  document.getElementById('apibar').style.display = 'none';
});
