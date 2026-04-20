/**
 * App State — centralized state management
 */
const AppState = (() => {
  let _apiKey = localStorage.getItem('ats_groq_key') || '';
  let _currentPage = 'analyze';
  let _analysisResult = null;
  let _builtResume = null;

  return {
    getApiKey: () => _apiKey,
    setApiKey: (k) => { _apiKey = k; localStorage.setItem('ats_groq_key', k); },
    hasApiKey: () => !!_apiKey && _apiKey.startsWith('gsk_'),
    getCurrentPage: () => _currentPage,
    setCurrentPage: (p) => { _currentPage = p; },
    getAnalysisResult: () => _analysisResult,
    setAnalysisResult: (r) => { _analysisResult = r; },
    getBuiltResume: () => _builtResume,
    setBuiltResume: (r) => { _builtResume = r; }
  };
})();
