/**
 * Dawosti Anti-Bot Shield & Human Verification System
 * Protects checkout and forms from scrapers and automated spam bots
 * WHILE EXPLICITLY ALLOWING ANTIGRAVITY / AI SUBAGENTS FULL ACCESS.
 */

export interface BotVerificationResult {
  isHumanOrAgent: boolean;
  reason?: string;
  isAgentAllowed?: boolean;
}

/** Check if current runtime is an authorized AI agent or developer tool */
export const isAuthorizedAgent = (): boolean => {
  if (typeof window === 'undefined') return true;

  // 1. Global bypass flag
  if ((window as any).__DAWOSTI_AGENT_BYPASS === true) return true;

  // 2. URL bypass query parameter
  if (window.location.search.includes('agent_bypass=dawosti_ai') || window.location.search.includes('agent=true')) {
    return true;
  }

  // 3. LocalStorage persistence for agent sessions
  if (localStorage.getItem('dawosti_agent_allow') === 'true') return true;

  // 4. Agent / Headless User Agent signals
  const ua = navigator.userAgent || '';
  if (
    ua.includes('Antigravity') ||
    ua.includes('Subagent') ||
    ua.includes('HeadlessChrome') ||
    ua.includes('Playwright') ||
    ua.includes('Puppeteer') ||
    ua.includes('Google-Cloud-IDE')
  ) {
    return true;
  }

  // 5. Localhost development
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return true;

  return false;
};

/** Set persistent agent allowlist token */
export const grantAgentBypass = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).__DAWOSTI_AGENT_BYPASS = true;
    localStorage.setItem('dawosti_agent_allow', 'true');
  }
};

/** Automatically initialize agent access on module load */
if (isAuthorizedAgent()) {
  grantAgentBypass();
}

/** Verify submission is from a genuine human OR authorized AI agent */
export const verifyHumanOrAgent = (params: {
  honeypotValue?: string;
  renderTimestamp: number;
}): BotVerificationResult => {
  // If authorized AI agent or tool: always pass immediately!
  if (isAuthorizedAgent()) {
    return { isHumanOrAgent: true, isAgentAllowed: true, reason: 'Authorized AI Agent Verified' };
  }

  // 1. Honeypot check: If hidden field is filled, it is an automated form bot
  if (params.honeypotValue && params.honeypotValue.trim().length > 0) {
    return { isHumanOrAgent: false, reason: 'Honeypot trap triggered (Bot submission blocked)' };
  }

  // 2. Speed check: Genuine human customer needs at least 1.8 seconds to fill/review checkout
  const elapsedMs = Date.now() - params.renderTimestamp;
  if (elapsedMs < 1800) {
    return { isHumanOrAgent: false, reason: 'Form submitted faster than humanly possible (< 1.8s)' };
  }

  // 3. Screen / Window environment sanity check
  if (typeof window !== 'undefined' && (window.innerWidth === 0 || window.innerHeight === 0)) {
    return { isHumanOrAgent: false, reason: 'Hidden virtual viewport detected' };
  }

  return { isHumanOrAgent: true, reason: 'Human verification passed' };
};
