/**
 * Premium, Human-Crafted Web Dashboard & Live Simulator for Speed-to-Lead.
 * Supports Light & Dark mode with dynamic theme toggle, Gmail/Email lead parser,
 * spacious layout, and zero external runtime dependencies.
 */
export function getDashboardHtml(config: { companyName: string; calleMode: string; calendarProvider: string; crmProvider: string }): string {
  const isLive = config.calleMode === "live";
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speed-to-Lead — Sub-15s AI Phone Lead Qualifier</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* ---- Theme Variables ---- */
    :root[data-theme="dark"] {
      --bg: #090d16;
      --bg-subtle: #0f1422;
      --surface: #131b2e;
      --surface-elevated: #1a233a;
      --surface-hover: #222d4a;
      --border: rgba(255, 255, 255, 0.08);
      --border-subtle: rgba(255, 255, 255, 0.04);
      --border-focus: #3b82f6;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      --accent: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      --input-bg: #090d16;
      --chat-agent-bg: #1e293b;
      --chat-agent-text: #f1f5f9;
      --chat-user-bg: #2e1065;
      --chat-user-text: #f5f3ff;
      --tag-bg: rgba(255, 255, 255, 0.06);
    }

    :root[data-theme="light"] {
      --bg: #f8fafc;
      --bg-subtle: #f1f5f9;
      --surface: #ffffff;
      --surface-elevated: #f8fafc;
      --surface-hover: #f1f5f9;
      --border: #e2e8f0;
      --border-subtle: #f1f5f9;
      --border-focus: #2563eb;
      --primary: #2563eb;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #0284c7 100%);
      --accent: #0284c7;
      --success: #059669;
      --warning: #d97706;
      --danger: #dc2626;
      --text: #0f172a;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --card-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      --input-bg: #ffffff;
      --chat-agent-bg: #f1f5f9;
      --chat-agent-text: #0f172a;
      --chat-user-bg: #ede9fe;
      --chat-user-text: #3b0764;
      --tag-bg: #f1f5f9;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 32px 24px 64px 24px;
      line-height: 1.6;
      transition: background 0.25s ease, color 0.25s ease;
      -webkit-font-smoothing: antialiased;
    }
    .app-wrap { max-width: 1280px; margin: 0 auto; }

    /* ---- Header & Navigation ---- */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 20px;
    }
    .brand-section { display: flex; align-items: center; gap: 16px; }
    .brand-logo {
      width: 48px;
      height: 48px;
      background: var(--primary-gradient);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
      color: #fff;
    }
    .brand-title h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-title p { font-size: 13px; color: var(--text-muted); }

    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .status-pill {
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--text-muted);
      box-shadow: var(--card-shadow);
    }
    .status-pill strong { color: var(--text); }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.5; }
    }

    /* Mode Banner */
    .mode-indicator-bar {
      background: ${isLive ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)"};
      border: 1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"};
      border-radius: 14px;
      padding: 12px 18px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text);
    }

    /* Theme Toggle Button */
    .theme-toggle-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
      box-shadow: var(--card-shadow);
    }
    .theme-toggle-btn:hover {
      background: var(--surface-hover);
      transform: translateY(-1px);
    }

    /* ---- 1-Click Persona & Gmail Importer Bar ---- */
    .action-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-label {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--text-dim);
    }
    .btn-import-gmail {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 12.5px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: var(--card-shadow);
    }
    .btn-import-gmail:hover {
      background: var(--surface-hover);
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .persona-deck {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .persona-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--card-shadow);
      position: relative;
    }
    .persona-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }
    .persona-card.active {
      border-color: var(--primary);
      background: var(--surface-elevated);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }
    .persona-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .persona-meta h4 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
    .persona-meta p { font-size: 12px; color: var(--text-muted); }
    .badge-grade {
      margin-left: auto;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
    }
    .grade-A { background: rgba(16, 185, 129, 0.12); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.25); }
    .grade-B { background: rgba(59, 130, 246, 0.12); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.25); }
    .grade-C { background: rgba(245, 158, 11, 0.12); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.25); }
    .grade-D { background: rgba(239, 68, 68, 0.12); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }

    /* ---- Gmail Import Drawer / Box ---- */
    .gmail-drawer {
      display: none;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 22px;
      margin-bottom: 28px;
      box-shadow: var(--card-shadow);
      animation: tabFade 0.2s ease;
    }
    .gmail-drawer.open { display: block; }
    .gmail-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .gmail-textarea {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      padding: 12px 14px;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      height: 100px;
      resize: vertical;
      margin-bottom: 12px;
    }
    .gmail-actions { display: flex; gap: 10px; align-items: center; }

    /* ---- Main 2-Column Grid ---- */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 1040px) { .dashboard-grid { grid-template-columns: 1fr; gap: 24px; } }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      box-shadow: var(--card-shadow);
      transition: background 0.25s ease, border-color 0.25s ease;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .card-header h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
    .card-header span { font-size: 13px; color: var(--text-muted); }

    /* ---- Clean Form Inputs ---- */
    .form-group { margin-bottom: 18px; }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      padding: 12px 16px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .form-split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .action-btn {
      width: 100%;
      background: var(--primary-gradient);
      border: none;
      color: #fff;
      font-weight: 700;
      padding: 16px;
      border-radius: 12px;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
      transition: all 0.2s ease;
      margin-top: 8px;
    }
    .action-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.45); }
    .action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* ---- Telephony Live Banner ---- */
    .call-banner {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 22px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .caller-lead h4 { font-size: 15px; font-weight: 700; }
    .caller-lead p { font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

    .soundwave {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 28px;
    }
    .soundwave-bar {
      width: 4px;
      height: 6px;
      background: var(--accent);
      border-radius: 3px;
      transition: height 0.15s;
    }
    .soundwave.active .soundwave-bar {
      animation: waveMotion 1.2s infinite ease-in-out;
    }
    .soundwave.active .soundwave-bar:nth-child(1) { animation-delay: 0.1s; }
    .soundwave.active .soundwave-bar:nth-child(2) { animation-delay: 0.3s; }
    .soundwave.active .soundwave-bar:nth-child(3) { animation-delay: 0.5s; }
    .soundwave.active .soundwave-bar:nth-child(4) { animation-delay: 0.2s; }
    .soundwave.active .soundwave-bar:nth-child(5) { animation-delay: 0.4s; }
    .soundwave.active .soundwave-bar:nth-child(6) { animation-delay: 0.6s; }
    @keyframes waveMotion {
      0%, 100% { height: 6px; }
      50% { height: 26px; }
    }

    /* ---- Workflow Progress Stepper ---- */
    .workflow-stepper {
      display: flex;
      justify-content: space-between;
      margin-bottom: 28px;
      position: relative;
    }
    .workflow-stepper::before {
      content: '';
      position: absolute;
      top: 16px; left: 24px; right: 24px;
      height: 2px;
      background: var(--border);
      z-index: 1;
    }
    .wf-step {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .wf-node {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--surface);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.3s;
    }
    .wf-step.active .wf-node {
      background: var(--primary);
      border-color: #60a5fa;
      color: #fff;
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.6);
    }
    .wf-step.done .wf-node {
      background: var(--success);
      border-color: #34d399;
      color: #fff;
    }
    .wf-name { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .wf-step.active .wf-name { color: var(--text); font-weight: 700; }

    /* ---- Tabbed Command Inspector ---- */
    .tab-bar {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
      padding-bottom: 4px;
    }
    .tab-item {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-item:hover { color: var(--text); background: var(--surface-hover); }
    .tab-item.active { color: var(--text); background: var(--surface-elevated); border: 1px solid var(--border); }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; animation: tabFade 0.2s ease; }
    @keyframes tabFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    /* Scorecard Tab */
    .score-hero {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 24px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      align-items: center;
    }
    @media (max-width: 600px) { .score-hero { grid-template-columns: 1fr; text-align: center; } }
    .score-dial {
      width: 116px;
      height: 116px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--surface) 60%, transparent 61%), conic-gradient(var(--accent) var(--score-angle, 0%), var(--border) 0);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      border: 2px solid var(--border);
      box-shadow: var(--card-shadow);
    }
    .score-points { font-size: 30px; font-weight: 800; letter-spacing: -1px; }
    .score-letter { font-size: 11px; font-weight: 700; color: var(--accent); }

    .bant-metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .bant-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .bant-box-head { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
    .bant-box-title { font-weight: 700; color: var(--text-muted); }
    .bant-box-val { font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .progress-track { height: 6px; background: var(--bg-subtle); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

    /* Dialogue Tab */
    .dialogue-stream {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      height: 260px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bubble-row {
      display: flex;
      gap: 12px;
      max-width: 88%;
    }
    .bubble-row.agent { align-self: flex-start; }
    .bubble-row.user { align-self: flex-end; flex-direction: row-reverse; }
    .bubble-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .bubble-body {
      padding: 12px 16px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
    }
    .bubble-row.agent .bubble-body {
      background: var(--chat-agent-bg);
      color: var(--chat-agent-text);
      border-bottom-left-radius: 3px;
    }
    .bubble-row.user .bubble-body {
      background: var(--chat-user-bg);
      color: var(--chat-user-text);
      border-bottom-right-radius: 3px;
    }

    /* Integrations Tab */
    .dispatch-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 700px) { .dispatch-cards { grid-template-columns: 1fr; } }
    .dispatch-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
    }
    .dispatch-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
    .dispatch-card p { font-size: 12px; color: var(--text-muted); }
    .sms-box {
      background: var(--surface);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 12.5px;
      margin-top: 10px;
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
    }

    /* ---- KPI Summary Grid ---- */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, border-color 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }
    .kpi-title {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-dim);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kpi-val {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: baseline;
      gap: 8px;
      color: var(--text);
    }
    .kpi-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    .kpi-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* ---- Stream Table Ledger & Filters ---- */
    .stream-section { margin-top: 36px; }
    .stream-filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box span {
      position: absolute;
      left: 12px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      padding: 10px 14px 10px 36px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn:hover {
      background: var(--surface-hover);
      color: var(--text);
    }
    .filter-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }
    .table-container {
      overflow-x: auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--card-shadow);
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th {
      padding: 16px 20px;
      color: var(--text-dim);
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.6px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-subtle);
    }
    td { padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); }
    tr.lead-entry { cursor: pointer; transition: background 0.15s; }
    /* ---- Google Calendar Bookings Modal ---- */
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: tabFade 0.2s ease;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      max-width: 860px;
      width: 100%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
    }
    .bookings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }
    .booking-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      transition: all 0.2s;
    }
    .booking-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .booking-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .btn-gcal {
      background: var(--primary-gradient);
      color: #fff !important;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-gcal:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .btn-ics {
      background: var(--surface);
      color: var(--text) !important;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-ics:hover {
      background: var(--surface-hover);
      border-color: var(--primary);
    }
    .objection-badge {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--warning);
      font-size: 11.5px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    /* Audio Waveform Player Styles */
    .audio-player-bar {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .btn-audio-play {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .btn-audio-play:hover {
      transform: scale(1.06);
      box-shadow: 0 4px 12px rgba(37,99,235,0.4);
    }
    .waveform-container {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 28px;
      cursor: pointer;
      padding: 2px 0;
    }
    .waveform-bar {
      flex: 1;
      background: var(--border);
      border-radius: 2px;
      transition: height 0.1s, background 0.1s;
      min-height: 4px;
    }
    .waveform-bar.played {
      background: var(--primary);
    }
    .waveform-bar.active {
      background: var(--accent);
      height: 100% !important;
    }
    .bubble-row.playing-turn .bubble-body {
      border: 1.5px solid var(--primary);
      box-shadow: 0 0 16px rgba(37,99,235,0.3);
      transform: translateX(4px);
    }
  </style>
</head>
<body>
  <div class="app-wrap">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="brand-logo">⚡</div>
        <div class="brand-title">
          <h1>Speed-to-Lead Command Center</h1>
          <p>Autonomous Sub-15s AI Phone Qualification &amp; Scheduling Engine</p>
        </div>
      </div>
      <div class="header-actions">
        <!-- Dynamic Integrations Hub Status Pills -->
        <span id="googleAuthPill"></span>
        <span id="slackAuthPill"></span>
        <span id="twilioAuthPill"></span>
        <span id="webhookAuthPill"></span>

        <button class="btn-import-gmail" onclick="toggleBookingsModal()" style="font-size:12px; border-color:rgba(59,130,246,0.3); background:rgba(59,130,246,0.08);">
          <span>📅 Bookings (<strong id="gcalPillCount">0</strong>)</span>
        </button>
        <div class="status-pill"><div class="pulse-dot"></div> Mode: <strong>${config.calleMode.toUpperCase()}</strong></div>
        <button class="theme-toggle-btn" id="themeBtn" onclick="toggleTheme()" title="Toggle Light / Dark Mode">☀️</button>
      </div>
    </header>

    <!-- Google OAuth Notification Alert Banner -->
    <div id="authAlertBanner" style="display:none; padding:12px 18px; border-radius:10px; margin-bottom:14px; font-size:13px; font-weight:600; justify-content:space-between; align-items:center; box-shadow:0 4px 16px rgba(0,0,0,0.1);">
      <span id="authAlertText"></span>
      <button onclick="document.getElementById('authAlertBanner').style.display='none'" style="background:none; border:none; color:inherit; font-size:16px; cursor:pointer; padding:0 4px;">✕</button>
    </div>

    <!-- Real vs Mock Execution Mode Banner -->
    <div class="mode-indicator-bar">
      <div>
        <strong>${isLive ? "🟢 LIVE TELEPHONY MODE" : "🟣 LOCAL MOCK DEMO MODE"}</strong> — 
        ${isLive 
          ? "Every submission triggers a real outbound phone call via CALL-E and connects to live numbers." 
          : "Runs deterministic local BANT simulation without consuming credits or placing real dials. Set CALLE_MODE=live in .env for real calls."}
      </div>
      <span style="font-family:'JetBrains Mono'; font-size:11px; color:var(--text-muted);">Runtime: Node 24 + Fastify</span>
    </div>

    <!-- Top KPI Telemetry Strip -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">
          <span>⚡ Response Latency</span>
          <span class="kpi-badge">&lt; 15s Target</span>
        </div>
        <div class="kpi-val" id="kpiLatency">3.2s</div>
        <div class="kpi-sub">Sub-second webhook to CALL-E dial</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">
          <span>📞 Inbound Leads</span>
          <span style="font-size:11px; color:var(--text-muted);" id="kpiLiveTag">Real-time</span>
        </div>
        <div class="kpi-val" id="kpiTotal">0</div>
        <div class="kpi-sub" id="kpiReplayed">0 idempotent replays</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">
          <span>🎯 BANT Qualification</span>
          <span class="kpi-badge" style="background:rgba(59,130,246,0.15); color:var(--primary); border-color:rgba(59,130,246,0.3);">Grade A/B</span>
        </div>
        <div class="kpi-val" id="kpiQualRate">0%</div>
        <div class="kpi-sub" id="kpiQualCount">0 qualified prospects</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">
          <span>📅 Demo Conversion</span>
          <span class="kpi-badge" style="background:rgba(245,158,11,0.15); color:var(--warning); border-color:rgba(245,158,11,0.3);">Cal.com</span>
        </div>
        <div class="kpi-val" id="kpiBookRate">0%</div>
        <div class="kpi-sub" id="kpiBookCount">0 booked meetings</div>
      </div>
    </div>

    <!-- Action Toolbar (Personas + Gmail Import Button) -->
    <div class="action-toolbar">
      <div class="section-label">⚡ 1-Click Test Personas or Import From Email</div>
      <button class="btn-import-gmail" onclick="toggleGmailDrawer()">
        <span>📧 Import From Gmail / Email Link</span>
      </button>
    </div>

    <!-- Collapsible Gmail/Email Parser Drawer -->
    <div class="gmail-drawer" id="gmailDrawer">
      <div class="gmail-drawer-header">
        <h4 style="font-size:14px; font-weight:700;">📧 Paste Gmail Email Body or mailto: Link</h4>
        <span style="font-size:12px; color:var(--text-muted); cursor:pointer;" onclick="toggleGmailDrawer()">✕ Close</span>
      </div>
      <textarea id="gmailRawInput" class="gmail-textarea" placeholder="Paste forwarded Gmail notification (e.g. 'Name: Sarah Connor, Phone: +1 415 555 0199, Email: sarah@skynet.com...') or mailto: link"></textarea>
      <div class="gmail-actions">
        <button class="action-btn" onclick="parseGmailContent()" style="padding:10px 18px; font-size:13px; width:auto; margin-top:0;">
          <span>⚡ Extract &amp; Populate Lead Form</span>
        </button>
        <button class="btn-import-gmail" onclick="loadSampleEmail()" style="font-size:12px;">
          <span>Load Sample Gmail Notification</span>
        </button>
      </div>
    </div>

    <!-- Persona Deck -->
    <div class="persona-deck">
      <div class="persona-card active" id="p-live_phone" onclick="pickPersona('live_phone')">
        <div class="persona-avatar">🇲🇾</div>
        <div class="persona-meta">
          <h4>My Live Phone</h4>
          <p>+60127058268 • Malaysia</p>
        </div>
        <span class="badge-grade grade-A">Live Call</span>
      </div>

      <div class="persona-card" id="p-enterprise" onclick="pickPersona('enterprise')">
        <div class="persona-avatar">🏢</div>
        <div class="persona-meta">
          <h4>Marcus Vance</h4>
          <p>VP Operations • Vance Logistics</p>
        </div>
        <span class="badge-grade grade-A">Grade A</span>
      </div>

      <div class="persona-card" id="p-midmarket" onclick="pickPersona('midmarket')">
        <div class="persona-avatar">⚡</div>
        <div class="persona-meta">
          <h4>Sarah Chen</h4>
          <p>Product Lead • GrowthAI</p>
        </div>
        <span class="badge-grade grade-B">Grade B</span>
      </div>

      <div class="persona-card" id="p-exploratory" onclick="pickPersona('exploratory')">
        <div class="persona-avatar">🤔</div>
        <div class="persona-meta">
          <h4>Alex Rivera</h4>
          <p>Founder • Rivera Tech</p>
        </div>
        <span class="badge-grade grade-C">Grade C</span>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="dashboard-grid">
      <!-- Left: Inbound Simulator Form -->
      <div class="card">
        <div class="card-header">
          <h3>📥 Inbound Lead Details</h3>
          <span>&lt; 1s Outbound Trigger</span>
        </div>

        <form id="leadForm" onsubmit="submitInboundCall(event)">
          <div class="form-group">
            <label>Prospect Full Name</label>
            <input type="text" id="name" class="form-input" value="Jordan Smith" required>
          </div>

          <div class="form-split">
            <div class="form-group">
              <label>Phone Number (E.164)</label>
              <input type="text" id="phone" class="form-input" value="+60127058268" oninput="handlePhoneInput(this.value)" required>
            </div>
            <div class="form-group">
              <label>Region &amp; Language</label>
              <input type="text" id="region" class="form-input" value="MY (Bahasa Malaysia / English)" placeholder="Auto-detected">
            </div>
          </div>

          <div class="form-group">
            <label>Work Email</label>
            <input type="email" id="email" class="form-input" value="jordan.smith@example.com">
          </div>

          <div class="form-group">
            <label>Company Name</label>
            <input type="text" id="company" class="form-input" value="Apex Innovations Malaysia">
          </div>

          <div class="form-group">
            <label>Lead Source / Interest</label>
            <input type="text" id="interest" class="form-input" value="Enterprise Automated Inbound Qualification Demo">
          </div>

          <div class="form-group">
            <label>🎯 Sales Playbook &amp; Framework</label>
            <select id="playbook" class="form-input" style="cursor:pointer;" onchange="handlePlaybookChange(this.value)">
              <option value="saas_demo">💼 B2B SaaS Demo Qualifier (BANT / Software Demo)</option>
              <option value="real_estate">🏠 Real Estate &amp; Property Intake (Buyer Pre-Approval)</option>
              <option value="solar_home">☀️ Residential Solar &amp; Energy Assessment (Homeowner Audit)</option>
              <option value="emergency_triage">🚨 Urgent Inbound / Emergency Triage (Incident SLA)</option>
            </select>
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; font-size:12px; color:var(--text-muted);">
            <input type="checkbox" id="overrideTcpa" style="accent-color:var(--primary); cursor:pointer;" checked>
            <label for="overrideTcpa" style="cursor:pointer; margin-bottom:0;">Bypass TCPA Quiet Hours for Demo (Simulate 24/7)</label>
          </div>

          <button type="submit" id="submitBtn" class="action-btn">
            <span>📞 Trigger Sub-15s Outbound Call</span>
          </button>
        </form>
      </div>

      <!-- Right: Real-time Telephony & Inspector -->
      <div class="card">
        <div class="card-header">
          <h3>📡 Real-time Pipeline Execution</h3>
          <span id="pipelineStatus" style="font-family:'JetBrains Mono'; font-weight:600;">Standing By</span>
        </div>

        <!-- Stepper -->
        <div class="workflow-stepper">
          <div class="wf-step active" id="wf-1">
            <div class="wf-node">1</div>
            <div class="wf-name">Webhook</div>
          </div>
          <div class="wf-step" id="wf-2">
            <div class="wf-node">2</div>
            <div class="wf-name">CALL-E Dial</div>
          </div>
          <div class="wf-step" id="wf-3">
            <div class="wf-node">3</div>
            <div class="wf-name">BANT Schema</div>
          </div>
          <div class="wf-step" id="wf-4">
            <div class="wf-node">4</div>
            <div class="wf-name">Cal.com Slot</div>
          </div>
          <div class="wf-step" id="wf-5">
            <div class="wf-node">5</div>
            <div class="wf-name">CRM &amp; SMS</div>
          </div>
        </div>

        <!-- Live Telephony Wave Banner -->
        <div class="call-banner">
          <div class="caller-lead">
            <h4 id="bannerHeader">Voice SDR Agent Ready</h4>
            <p id="bannerSub">Standing by for inbound webhooks</p>
          </div>
          <div class="soundwave" id="soundwaveBox">
            <div class="soundwave-bar"></div>
            <div class="soundwave-bar"></div>
            <div class="soundwave-bar"></div>
            <div class="soundwave-bar"></div>
            <div class="soundwave-bar"></div>
            <div class="soundwave-bar"></div>
          </div>
        </div>

        <!-- Tabbed Inspector -->
        <div class="tab-bar">
          <button class="tab-item active" onclick="showTab('scorecard')">📊 BANT Scorecard</button>
          <button class="tab-item" onclick="showTab('dialogue')">💬 Live Dialogue</button>
          <button class="tab-item" onclick="showTab('dispatch')">🔗 Integrations &amp; SMS</button>
          <button class="tab-item" onclick="showTab('webhook_tester')">⚡ Webhook &amp; cURL</button>
          <button class="tab-item" onclick="showTab('json')">{ } JSON</button>
        </div>

        <!-- Tab 1: Scorecard -->
        <div class="tab-panel active" id="tab-scorecard">
          <div class="score-hero">
            <div class="score-dial" id="scoreDial" style="--score-angle: 0%;">
              <div class="score-points" id="scorePts">--</div>
              <div class="score-letter" id="scoreGrd">SCORE</div>
            </div>
            <div>
              <h3 id="leadTitle" style="font-size:16px; margin-bottom:4px;">No Call Evaluated Yet</h3>
              <p id="leadDesc" style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">Trigger a lead on the left to watch live AI scoring.</p>
              
              <div class="bant-metrics-grid">
                <div class="bant-box">
                  <div class="bant-box-head"><span class="bant-box-title">Budget</span><span class="bant-box-val" id="vBudget">--</span></div>
                  <div class="progress-track"><div class="progress-fill" id="pBudget" style="width:0%; background:var(--primary);"></div></div>
                </div>
                <div class="bant-box">
                  <div class="bant-box-head"><span class="bant-box-title">Authority</span><span class="bant-box-val" id="vAuth">--</span></div>
                  <div class="progress-track"><div class="progress-fill" id="pAuth" style="width:0%; background:var(--accent);"></div></div>
                </div>
                <div class="bant-box">
                  <div class="bant-box-head"><span class="bant-box-title">Need Pain</span><span class="bant-box-val" id="vNeed">--</span></div>
                  <div class="progress-track"><div class="progress-fill" id="pNeed" style="width:0%; background:var(--warning);"></div></div>
                </div>
                <div class="bant-box">
                  <div class="bant-box-head"><span class="bant-box-title">Timeline</span><span class="bant-box-val" id="vTime">--</span></div>
                  <div class="progress-track"><div class="progress-fill" id="pTime" style="width:0%; background:var(--success);"></div></div>
                </div>
              </div>

              <!-- Objection Intelligence Section -->
              <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px; margin-top:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:var(--text-dim);">🧠 Objection Intelligence &amp; Buying Signals</span>
                  <span id="objectionCount" style="font-size:11px; color:var(--text-muted);">0 detected</span>
                </div>
                <div id="objectionChips" style="display:flex; gap:8px; flex-wrap:wrap;">
                  <span style="font-size:12px; color:var(--text-dim);">No objections identified yet.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Dialogue & Audio Playback -->
        <div class="tab-panel" id="tab-dialogue">
          <!-- Audio Waveform Recording Player Bar -->
          <div id="audioPlayerCard" class="audio-player-bar" style="margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
              <button id="btnPlayRecording" class="btn-audio-play" onclick="toggleAudioPlayback()">
                <span id="audioPlayIcon">▶</span>
              </button>
              <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px;">
                  <span style="font-weight:700; color:var(--text); display:flex; align-items:center; gap:6px;">
                    <span>🎙️ Call Recording &amp; Voice Waveform</span>
                    <span id="audioLanguageBadge" class="kpi-badge" style="font-size:9.5px; padding:1px 6px;">EN (US)</span>
                  </span>
                  <span id="audioTimer" style="font-family:'JetBrains Mono'; color:var(--text-muted);">0:00 / 0:18</span>
                </div>
                <!-- Interactive Waveform Visualizer -->
                <div class="waveform-container" id="waveformContainer" onclick="seekAudioFromClick(event)">
                  <!-- Dynamic Waveform Bars populated by JS -->
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted);">
                <span>🔊</span>
                <input type="range" id="audioVolume" min="0" max="1" step="0.05" value="0.8" style="width:55px; height:4px; accent-color:var(--primary);" oninput="setAudioVolume(this.value)">
              </div>
            </div>
          </div>

          <div class="dialogue-stream" id="dialogueStream">
            <div style="text-align:center; color:var(--text-dim); margin-top:90px; font-size:13px;">No active dialogue. Launch a call to view conversational turns.</div>
          </div>
        </div>

        <!-- Tab 3: Dispatch & SMS -->
        <div class="tab-panel" id="tab-dispatch">
          <!-- Real-Time Multi-Channel Integrations Hub Status -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:10px; margin-bottom:14px;">
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Google Calendar</div>
                <div id="tabGcalStatus" style="font-size:11.5px; font-weight:600; color:var(--text); margin-top:2px;">Checking...</div>
              </div>
              <button onclick="initiateGoogleLogin()" class="btn-ics" style="padding:4px 8px; font-size:11px;">Manage</button>
            </div>
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Slack Alerts</div>
                <div id="tabSlackStatus" style="font-size:11.5px; font-weight:600; color:var(--text); margin-top:2px;">Checking...</div>
              </div>
              <button onclick="toggleSlackModal()" class="btn-ics" style="padding:4px 8px; font-size:11px;">Manage</button>
            </div>
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Twilio SMS</div>
                <div id="tabTwilioStatus" style="font-size:11.5px; font-weight:600; color:var(--text); margin-top:2px;">Checking...</div>
              </div>
              <button onclick="toggleTwilioModal()" class="btn-ics" style="padding:4px 8px; font-size:11px;">Manage</button>
            </div>
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Zapier / Webhook</div>
                <div id="tabWebhookStatus" style="font-size:11.5px; font-weight:600; color:var(--text); margin-top:2px;">Checking...</div>
              </div>
              <button onclick="toggleWebhookModal()" class="btn-ics" style="padding:4px 8px; font-size:11px;">Manage</button>
            </div>
          </div>

          <div class="dispatch-cards">
            <div class="dispatch-card">
              <h4>📅 Calendar &amp; Google Booking</h4>
              <p id="calStatus">No meeting scheduled yet.</p>
              <div id="calSlot" style="font-weight:700; color:var(--text); margin-top:6px; font-size:13px;"></div>
              <div id="gcalActions" style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;"></div>
            </div>
            <div class="dispatch-card">
              <h4>🗄️ HubSpot CRM Sync</h4>
              <p id="crmStatus">Awaiting qualification record.</p>
              <div id="crmKey" style="font-family:'JetBrains Mono'; font-size:11px; margin-top:6px; color:var(--accent);"></div>
            </div>
          </div>
          <div class="dispatch-card" style="margin-top:14px;">
            <h4>📲 Post-Call Instant Confirmation (SMS)</h4>
            <div class="sms-box" id="smsText">No confirmation dispatched yet.</div>
          </div>
        </div>

        <!-- Tab 4: JSON Payload -->
        <div class="tab-panel" id="tab-json">
          <pre id="jsonViewer" style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:12px; padding:14px; font-family:'JetBrains Mono', monospace; font-size:11.5px; height:260px; overflow:auto; color:var(--text); line-height:1.5;">// Real-time JSON outcome will appear here</pre>
        </div>

        <!-- Tab 5: Webhook & cURL Tester -->
        <div class="tab-panel" id="tab-webhook_tester">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:13px; font-weight:700;">📡 Live Webhook Inbound Tester &amp; Code Generator</h4>
            <span class="kpi-badge" style="background:rgba(16,185,129,0.15); color:var(--success);">POST /api/lead-submit</span>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Trigger inbound leads from third-party webhooks (Typeform, Stripe, Zapier, Webflow) or copy ready-to-run cURL snippets.</p>
          
          <div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
            <button class="btn-ics" style="font-size:11px;" onclick="loadWebhookPreset('typeform')">📝 Typeform</button>
            <button class="btn-ics" style="font-size:11px;" onclick="loadWebhookPreset('stripe')">💳 Stripe</button>
            <button class="btn-ics" style="font-size:11px;" onclick="loadWebhookPreset('zapier')">⚡ Zapier</button>
            <button class="btn-ics" style="font-size:11px;" onclick="loadWebhookPreset('solar')">☀️ Solar</button>
            <button class="btn-ics" style="font-size:11px; margin-left:auto; background:var(--primary); color:#fff;" onclick="dispatchTestWebhook()">🚀 Dispatch Webhook Now</button>
          </div>

          <textarea id="webhookPayloadBox" style="width:100%; height:95px; background:var(--input-bg); border:1px solid var(--border); border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text); padding:8px; resize:none;">{
  "name": "Jordan Smith",
  "phone": "+60127058268",
  "email": "jordan.smith@example.com",
  "company": "Apex Innovations",
  "source": "typeform",
  "interest": "High volume inbound calling automation",
  "playbook": "saas_demo"
}</textarea>

          <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase;">Ready-to-Run cURL Snippet</span>
            <button class="btn-ics" style="font-size:10px; padding:2px 8px;" onclick="copyCurlSnippet()">📋 Copy cURL</button>
          </div>
          <pre id="curlSnippetBox" style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:8px; padding:8px; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--accent); margin-top:4px; overflow-x:auto;">curl -X POST http://localhost:8787/api/lead-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan Smith","phone":"+60127058268","company":"Apex Innovations","interest":"Enterprise Demo"}'</pre>
        </div>
      </div>
    </div>

    <!-- Bottom Lead Stream Ledger -->
    <div class="stream-section">
      <div class="action-toolbar" style="margin-bottom:14px;">
        <div>
          <div class="section-label">📋 Durable Inbound Lead Stream &amp; Audit Ledger</div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Atomic persistence across restarts. Click any row to inspect dialogue &amp; BANT breakdown.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn-import-gmail" onclick="toggleBookingsModal()" style="font-size:12px; background:var(--surface-elevated); border-color:var(--primary);">
            <span>📅 View Bookings Collection</span>
          </button>
          <button class="btn-import-gmail" onclick="exportLeadsCsv()" style="font-size:12px;">
            <span>📥 Export CSV</span>
          </button>
          <button class="btn-import-gmail" onclick="refreshStream()" style="font-size:12px;">
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="stream-filter-bar">
        <div class="search-box">
          <span style="font-size:13px; opacity:0.6;">🔍</span>
          <input type="text" id="streamSearch" class="search-input" placeholder="Search by prospect name, company, or phone number..." oninput="applyFilters()">
        </div>
        <div class="filter-pills">
          <button class="filter-btn active" id="f-all" onclick="setGradeFilter('all')">All (<span id="cnt-all">0</span>)</button>
          <button class="filter-btn" id="f-A" onclick="setGradeFilter('A')">🟢 Grade A (<span id="cnt-A">0</span>)</button>
          <button class="filter-btn" id="f-B" onclick="setGradeFilter('B')">🔵 Grade B (<span id="cnt-B">0</span>)</button>
          <button class="filter-btn" id="f-C" onclick="setGradeFilter('C')">🟡 Grade C (<span id="cnt-C">0</span>)</button>
          <button class="filter-btn" id="f-booked" onclick="setGradeFilter('booked')">📅 Booked (<span id="cnt-booked">0</span>)</button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp &amp; Latency</th>
              <th>Prospect &amp; Company</th>
              <th>Phone &amp; Region</th>
              <th>BANT Score</th>
              <th>Grade</th>
              <th>Cal.com Demo Slot</th>
              <th>CRM Record ID</th>
              <th>Status &amp; Follow-Up</th>
            </tr>
          </thead>
          <tbody id="streamTbody">
            <tr><td colspan="8" style="text-align:center; color:var(--text-dim); padding:32px;">Loading audit ledger...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Theme Management
    function initTheme() {
      const saved = localStorage.getItem('speed_to_lead_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
      document.getElementById('themeBtn').innerText = saved === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('speed_to_lead_theme', next);
      document.getElementById('themeBtn').innerText = next === 'dark' ? '☀️' : '🌙';
    }

    initTheme();
    initSSE();

    // Gmail Drawer
    function toggleGmailDrawer() {
      const drawer = document.getElementById('gmailDrawer');
      drawer.classList.toggle('open');
    }

    function loadSampleEmail() {
      document.getElementById('gmailRawInput').value = 
        "From: notifications@typeform.com\\n" +
        "Subject: New Inbound Lead Submission\\n\\n" +
        "Prospect Name: Elena Rostova\\n" +
        "Phone: +1 650 555 0144\\n" +
        "Work Email: elena@quantum-logistics.io\\n" +
        "Company: Quantum Logistics Global\\n" +
        "Inquiry Notes: Looking for sub-15s AI voice qualification and calendar booking integration.";
    }

    async function parseGmailContent() {
      const raw = document.getElementById('gmailRawInput').value.trim();
      if (!raw) {
        alert('Please paste some email text or a mailto: link first.');
        return;
      }

      try {
        const res = await fetch('/api/parse-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw })
        });
        const data = await res.json();
        if (data.lead) {
          const l = data.lead;
          if (l.name) document.getElementById('name').value = l.name;
          if (l.phone) document.getElementById('phone').value = l.phone;
          if (l.email) document.getElementById('email').value = l.email;
          if (l.company) document.getElementById('company').value = l.company;
          if (l.interest) document.getElementById('interest').value = l.interest;
          toggleGmailDrawer();
        }
      } catch (err) {
        alert('Could not parse email: ' + err.message);
      }
    }

    const PERSONAS = {
      live_phone: {
        name: "Jordan Smith",
        phone: "+60127058268",
        region: "MY",
        email: "jordan.smith@example.com",
        company: "Apex Innovations Malaysia",
        interest: "Enterprise Automated Inbound Qualification Demo"
      },
      enterprise: {
        name: "Marcus Vance",
        phone: "+14155550100",
        region: "US",
        email: "mvance@vance-logistics.com",
        company: "Vance Logistics Global",
        interest: "Enterprise Automated Inbound Qualification Demo"
      },
      midmarket: {
        name: "Sarah Chen",
        phone: "+14155550188",
        region: "US",
        email: "schen@growthai.io",
        company: "GrowthAI",
        interest: "CRM Voice AI Integration"
      },
      exploratory: {
        name: "Alex Rivera",
        phone: "+14155550199",
        region: "US",
        email: "alex@startup.dev",
        company: "Rivera Tech",
        interest: "General API Pricing Inquiry"
      }
    };

    function pickPersona(key) {
      document.querySelectorAll('.persona-card').forEach(c => c.classList.remove('active'));
      const card = document.getElementById('p-' + key);
      if (card) card.classList.add('active');

      const p = PERSONAS[key];
      if (!p) return;
      document.getElementById('name').value = p.name;
      document.getElementById('phone').value = p.phone;
      document.getElementById('region').value = p.region;
      document.getElementById('email').value = p.email;
      document.getElementById('company').value = p.company;
      document.getElementById('interest').value = p.interest;
    }

    function showTab(id) {
      document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      const btn = event?.target;
      if (btn) btn.classList.add('active');
      const panel = document.getElementById('tab-' + id);
      if (panel) panel.classList.add('active');
    }

    function setWfStep(step) {
      for (let i = 1; i <= 5; i++) {
        const el = document.getElementById('wf-' + i);
        if (!el) continue;
        el.className = 'wf-step' + (i < step ? ' done' : (i === step ? ' active' : ''));
      }
    }

    let livePollTimer = null;
    let callStartTimestamp = null;
    let callDurationInterval = null;

    // Real-Time Server-Sent Events (SSE) Hub Listener
    let sseSource = null;
    function initSSE() {
      if (!window.EventSource) return;
      try {
        sseSource = new EventSource('/api/events/stream');
        sseSource.addEventListener('call:dialing', (e) => {
          setWfStep(2);
          document.getElementById('pipelineStatus').innerText = '📞 Dialing via CALL-E...';
          document.getElementById('soundwaveBox').classList.add('active');
        });
        sseSource.addEventListener('call:connected', (e) => {
          setWfStep(2);
          document.getElementById('pipelineStatus').innerText = '🎙️ Call In Progress (Live Speech)';
        });
        sseSource.addEventListener('call:turn', (e) => {
          const ev = JSON.parse(e.data);
          appendLiveTurn(ev.data?.speaker, ev.data?.text);
          if (window.__voiceSpeechEnabled && window.speechSynthesis) {
            speakTurnUtterance(ev.data?.speaker, ev.data?.text);
          }
        });
        sseSource.addEventListener('call:analyzing', (e) => {
          const ev = JSON.parse(e.data);
          setWfStep(3);
          document.getElementById('pipelineStatus').innerText = '🧠 BANT Schema Extraction...';
          if (ev.data?.qualification) {
            renderLiveQualification(ev.data.qualification, ev.data.sentiment);
          }
        });
        sseSource.addEventListener('booking:confirmed', () => {
          setWfStep(4);
          document.getElementById('pipelineStatus').innerText = '📅 Demo Slot Confirmed!';
        });
        sseSource.addEventListener('crm:synced', () => {
          setWfStep(5);
          document.getElementById('pipelineStatus').innerText = '🗄️ Synced to CRM';
        });
        sseSource.addEventListener('lead:completed', () => {
          setWfStep(5);
          document.getElementById('soundwaveBox').classList.remove('active');
          refreshStream();
        });
      } catch (err) {
        console.warn('SSE connection error:', err);
      }
    }

    // Web Speech API Voice Simulation Preview
    window.__voiceSpeechEnabled = true;
    function speakTurnUtterance(speaker, text) {
      if (!window.speechSynthesis || !text) return;
      try {
        const isBot = speaker === 'bot' || speaker === 'agent' || speaker === 'assistant';
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = isBot ? 1.05 : 0.95;
        utter.pitch = isBot ? 1.1 : 0.95;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }

    function appendLiveTurn(speaker, text) {
      const stream = document.getElementById('dialogueStream');
      if (!stream || !text) return;
      if (stream.innerText.includes('No active dialogue') || stream.innerText.includes('Launch a call')) {
        stream.innerHTML = '';
      }
      const isAgent = speaker === 'assistant' || speaker === 'agent' || speaker === 'bot';
      const row = document.createElement('div');
      row.className = 'bubble-row ' + (isAgent ? 'agent' : 'user');
      row.innerHTML = '<div class="bubble-icon">' + (isAgent ? '🤖' : '👤') + '</div>' +
        '<div class="bubble-body">' + text + '</div>';
      stream.appendChild(row);
      stream.scrollTop = stream.scrollHeight;
    }

    function renderLiveQualification(q, sentiment) {
      document.getElementById('vBudget').innerText = q.budget || 'unknown';
      document.getElementById('vAuth').innerText = q.authority || 'unknown';
      document.getElementById('vNeed').innerText = q.need || 'unknown';
      document.getElementById('vTime').innerText = q.timeline || 'unknown';

      document.getElementById('pBudget').style.width = q.budget === 'over_25k' ? '100%' : (q.budget === '5k_25k' ? '65%' : '30%');
      document.getElementById('pAuth').style.width = q.authority === 'decision_maker' ? '100%' : (q.authority === 'influencer' ? '70%' : '30%');
      document.getElementById('pNeed').style.width = q.need === 'critical' ? '100%' : (q.need === 'high' ? '75%' : '40%');
      document.getElementById('pTime').style.width = q.timeline === 'immediate' ? '100%' : (q.timeline === 'within_30_days' ? '75%' : '40%');

      if (q.objections && q.objections.length) {
        document.getElementById('objectionCount').innerText = q.objections.length + ' detected';
        document.getElementById('objectionChips').innerHTML = q.objections.map(function(o) {
          return '<span class="kpi-badge" style="background:rgba(239,68,68,0.15); color:var(--danger); font-size:10.5px;">' + o + '</span>';
        }).join('');
      }
    }

    // Webhook Tester Presets
    function loadWebhookPreset(type) {
      const box = document.getElementById('webhookPayloadBox');
      if (!box) return;
      if (type === 'typeform') {
        box.value = JSON.stringify({
          name: "Elena Rostova",
          phone: "+16505550144",
          email: "elena@quantum-logistics.io",
          company: "Quantum Logistics Global",
          source: "typeform",
          interest: "Inbound AI voice qualification pipeline",
          playbook: "saas_demo"
        }, null, 2);
      } else if (type === 'stripe') {
        box.value = JSON.stringify({
          name: "Marcus Vance",
          phone: "+14155550100",
          email: "mvance@vance-logistics.com",
          company: "Vance Logistics",
          source: "stripe_checkout",
          interest: "Enterprise annual plan consultation",
          playbook: "saas_demo"
        }, null, 2);
      } else if (type === 'zapier') {
        box.value = JSON.stringify({
          name: "Sarah Chen",
          phone: "+14155550188",
          email: "schen@growthai.io",
          company: "GrowthAI",
          source: "zapier_webhook",
          interest: "High volume qualification",
          playbook: "saas_demo"
        }, null, 2);
      } else if (type === 'solar') {
        box.value = JSON.stringify({
          name: "David Miller",
          phone: "+13035550177",
          email: "david.miller@example.com",
          company: "Homeowner",
          source: "facebook_solar_ad",
          interest: "Residential Solar & Battery Assessment",
          playbook: "solar_home"
        }, null, 2);
      }
      updateCurlBox();
    }

    function updateCurlBox() {
      const box = document.getElementById('webhookPayloadBox');
      const curlBox = document.getElementById('curlSnippetBox');
      if (!box || !curlBox) return;
      const payload = box.value.replace(/\\s+/g, ' ');
      curlBox.innerText = [
        'curl -X POST ' + window.location.origin + '/api/lead-submit \\\\',
        '  -H "Content-Type: application/json" \\\\',
        '  -d \\'' + payload + '\\''
      ].join('\\n');
    }

    async function dispatchTestWebhook() {
      const box = document.getElementById('webhookPayloadBox');
      if (!box) return;
      try {
        const parsed = JSON.parse(box.value);
        showTab('scorecard');
        document.getElementById('name').value = parsed.name || '';
        document.getElementById('phone').value = parsed.phone || '';
        document.getElementById('email').value = parsed.email || '';
        document.getElementById('company').value = parsed.company || '';
        document.getElementById('interest').value = parsed.interest || '';
        if (parsed.playbook) document.getElementById('playbook').value = parsed.playbook;
        submitInboundCall(new Event('submit'));
      } catch (err) {
        alert('Invalid JSON in webhook payload box: ' + err.message);
      }
    }

    function copyCurlSnippet() {
      const curl = document.getElementById('curlSnippetBox')?.innerText || '';
      navigator.clipboard.writeText(curl).then(() => {
        alert('cURL command copied to clipboard!');
      });
    }

    function handlePlaybookChange(val) {
      updateCurlBox();
    }

    async function submitInboundCall(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Dialing via CALL-E...</span>';

      const payload = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        region: document.getElementById('region').value.trim() || undefined,
        email: document.getElementById('email').value.trim() || undefined,
        company: document.getElementById('company').value.trim() || undefined,
        interest: document.getElementById('interest').value.trim() || undefined,
        playbook: document.getElementById('playbook')?.value || 'saas_demo',
        override_tcpa: document.getElementById('overrideTcpa')?.checked ?? true,
        async: true
      };

      setWfStep(2);
      document.getElementById('pipelineStatus').innerText = '📞 Outbound Calling... (0s)';
      document.getElementById('bannerHeader').innerText = 'Calling ' + payload.name;
      document.getElementById('bannerSub').innerText = payload.phone + ' • Initiating BANT Qualification';
      document.getElementById('soundwaveBox').classList.add('active');

      callStartTimestamp = Date.now();
      clearInterval(callDurationInterval);
      callDurationInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - callStartTimestamp) / 1000);
        document.getElementById('pipelineStatus').innerText = '📞 In Progress... (' + elapsed + 's)';
        if (elapsed > 4) setWfStep(3);
      }, 1000);

      try {
        const res = await fetch('/api/lead-submit?async=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const initData = await res.json();

        if (initData.status === 'queued_quiet_hours') {
          clearInterval(callDurationInterval);
          setWfStep(1);
          document.getElementById('soundwaveBox').classList.remove('active');
          document.getElementById('pipelineStatus').innerText = '🌙 TCPA Quiet Hours Guard';
          document.getElementById('bannerHeader').innerText = 'Call Queued for Tomorrow Morning';
          document.getElementById('bannerSub').innerText = initData.message || 'Outside 8am-8:30pm local time. Sent SMS booking invite.';
          renderResult(initData);
          refreshStream();
          btn.disabled = false;
          btn.innerHTML = '<span>📞 Trigger Sub-15s Outbound Call</span>';
          return;
        }

        if (initData.statusUrl) {
          // Poll the status URL until the call finishes (acts as reliable fallback alongside SSE)
          clearInterval(livePollTimer);
          livePollTimer = setInterval(async () => {
            try {
              const statusRes = await fetch(initData.statusUrl);
              const statusData = await statusRes.json();
              if (statusData.status && statusData.status !== 'queued') {
                clearInterval(livePollTimer);
                clearInterval(callDurationInterval);
                setWfStep(5);
                document.getElementById('soundwaveBox').classList.remove('active');
                const totalElapsed = Math.round((Date.now() - callStartTimestamp) / 1000);
                document.getElementById('pipelineStatus').innerText = '✅ Completed in ' + totalElapsed + 's';
                document.getElementById('bannerHeader').innerText = 'Call Finished — Outcome Recorded';
                document.getElementById('bannerSub').innerText = 'BANT Score: ' + (statusData.score?.score || 0) + ' (' + (statusData.score?.grade || 'D') + ')';

                renderResult(statusData);
                refreshStream();
                btn.disabled = false;
                btn.innerHTML = '<span>📞 Trigger Sub-15s Outbound Call</span>';
              }
            } catch (err) {
              console.error(err);
            }
          }, 1800);
        }
      } catch (err) {
        clearInterval(callDurationInterval);
        document.getElementById('pipelineStatus').innerText = '❌ Error';
        document.getElementById('soundwaveBox').classList.remove('active');
        alert('Error: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>📞 Trigger Sub-15s Outbound Call</span>';
      }
    }

    function renderResult(data) {
      const score = data.score?.score || 0;
      const grade = data.score?.grade || 'D';
      document.getElementById('scorePts').innerText = score;
      document.getElementById('scoreGrd').innerText = 'GRADE ' + grade;
      document.getElementById('scoreDial').style.setProperty('--score-angle', score + '%');

      document.getElementById('leadTitle').innerText = (data.lead?.name || 'Lead') + ' (' + (data.lead?.company || 'Direct') + ')';
      document.getElementById('leadDesc').innerText = data.summary || (data.booking ? 'Accepted live demo booking.' : 'Qualification completed.');

      const q = data.qualification || {};
      document.getElementById('vBudget').innerText = q.budget || 'unknown';
      document.getElementById('vAuth').innerText = q.authority || 'unknown';
      document.getElementById('vNeed').innerText = q.need || 'unknown';
      document.getElementById('vTime').innerText = q.timeline || 'unknown';

      document.getElementById('pBudget').style.width = q.budget === 'over_25k' ? '100%' : (q.budget === '5k_25k' ? '65%' : '30%');
      document.getElementById('pAuth').style.width = q.authority === 'decision_maker' ? '100%' : (q.authority === 'influencer' ? '70%' : '30%');
      document.getElementById('pNeed').style.width = q.need === 'critical' ? '100%' : (q.need === 'high' ? '75%' : '40%');
      document.getElementById('pTime').style.width = q.timeline === 'immediate' ? '100%' : (q.timeline === 'within_30_days' ? '75%' : '40%');

      // Transcript Feed
      const stream = document.getElementById('dialogueStream');
      if (data.transcript && data.transcript.length) {
        stream.innerHTML = data.transcript.map(t => {
          const isAgent = t.speaker === 'assistant' || t.speaker === 'agent' || t.speaker === 'bot';
          return '<div class="bubble-row ' + (isAgent ? 'agent' : 'user') + '">' +
            '<div class="bubble-icon">' + (isAgent ? '🤖' : '👤') + '</div>' +
            '<div class="bubble-body">' + t.text + '</div>' +
          '</div>';
        }).join('');
      } else {
        stream.innerHTML = '<div style="padding:16px; color:var(--text-muted);">' + (data.summary || 'Call complete.') + '</div>';
      }

      // Integrations
      if (data.booking) {
        document.getElementById('calStatus').innerText = '✅ Demo Confirmed (' + data.booking.provider + ')';
        document.getElementById('calSlot').innerText = data.booking.slot?.label || data.qualification?.selected_slot || 'Booked Slot';
      } else {
        document.getElementById('calStatus').innerText = 'No meeting scheduled.';
        document.getElementById('calSlot').innerText = '—';
      }

      document.getElementById('crmStatus').innerText = '✅ Synced to CRM';
      document.getElementById('crmKey').innerText = 'Call ID: ' + (data.callId || 'mock_record');

      if (data.confirmation) {
        document.getElementById('smsText').innerText = data.confirmation.message;
      } else if (data.fallbackAction) {
        document.getElementById('smsText').innerText = '[Fallback Triggered] ' + data.fallbackAction.suggestedAction;
      } else {
        document.getElementById('smsText').innerText = 'No follow-up action required.';
      }

      // JSON Viewer
      document.getElementById('jsonViewer').innerText = JSON.stringify(data, null, 2);
    }

    let currentFilter = 'all';
    let selectedLeadIdx = null;

    function setGradeFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById('f-' + filter);
      if (activeBtn) activeBtn.classList.add('active');
      applyFilters();
    }

    function applyFilters() {
      const query = (document.getElementById('streamSearch')?.value || '').toLowerCase().trim();
      const leads = window.__rawLeads || [];

      const filtered = leads.filter(item => {
        const l = item.lead || {};
        const s = item.score || { score: 0, grade: 'D' };
        const booked = Boolean(item.booking);

        // Grade filter
        if (currentFilter === 'A' && s.grade !== 'A') return false;
        if (currentFilter === 'B' && s.grade !== 'B') return false;
        if (currentFilter === 'C' && s.grade !== 'C') return false;
        if (currentFilter === 'booked' && !booked) return false;

        // Search query
        if (query) {
          const matchName = (l.name || '').toLowerCase().includes(query);
          const matchComp = (l.company || '').toLowerCase().includes(query);
          const matchPhone = (l.phone || '').toLowerCase().includes(query);
          const matchInterest = (l.interest || '').toLowerCase().includes(query);
          if (!matchName && !matchComp && !matchPhone && !matchInterest) return false;
        }

        return true;
      });

      renderTableRows(filtered);
    }

    function renderTableRows(leads) {
      const tbody = document.getElementById('streamTbody');
      if (!leads.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-dim); padding:28px;">No matching leads found.</td></tr>';
        return;
      }

      tbody.innerHTML = leads.map((row, idx) => {
        const l = row.lead || {};
        const s = row.score || { score: 0, grade: 'D' };
        const time = row.createdAt ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--';
        const latency = row.processingTimeMs ? (row.processingTimeMs / 1000).toFixed(1) + 's' : '< 1s';
        const slot = row.booking ? '📅 ' + (row.booking.slot?.label || row.qualification?.selected_slot || 'Booked') : '—';
        const isSelected = selectedLeadIdx === idx;
        const statusText = row.confirmation ? '📲 SMS Sent' : (row.fallbackAction ? '⚡ Fallback Dispatched' : (row.status || 'Completed'));

        return '<tr class="lead-entry' + (isSelected ? ' active-row' : '') + '" onclick="inspectLeadRow(' + idx + ')">' +
          '<td><strong>' + time + '</strong><br><small style="color:var(--text-dim); font-family:monospace;">⚡ ' + latency + '</small></td>' +
          '<td><strong>' + (l.name || 'Lead') + '</strong><br><small style="color:var(--text-dim);">' + (l.company || 'Direct') + '</small></td>' +
          '<td>' + (l.phone || 'N/A') + ' <span style="font-size:10px; color:var(--accent);">(' + (l.region || 'US') + ')</span></td>' +
          '<td><strong>' + s.score + '/100</strong></td>' +
          '<td><span class="badge-grade grade-' + s.grade + '">Grade ' + s.grade + '</span></td>' +
          '<td>' + slot + '</td>' +
          '<td><span style="font-family:monospace; font-size:11px; color:var(--text-muted);">' + (row.callId || 'synced').slice(0, 16) + '</span></td>' +
          '<td><span class="badge-grade ' + (row.booking ? 'grade-A' : 'grade-B') + '">' + statusText + '</span></td>' +
        '</tr>';
      }).join('');
    }

    function updateKpis(leads, metricsData) {
      const total = (metricsData?.leads_total || leads.length) || 0;
      const replayed = metricsData?.leads_replayed || 0;
      document.getElementById('kpiTotal').innerText = total;
      document.getElementById('kpiReplayed').innerText = replayed + ' idempotent replays';

      let gradeACount = 0;
      let gradeBCount = 0;
      let gradeCCount = 0;
      let bookedCount = 0;
      let totalDuration = 0;
      let durationCount = 0;

      leads.forEach(row => {
        const grade = row.score?.grade;
        if (grade === 'A') gradeACount++;
        if (grade === 'B') gradeBCount++;
        if (grade === 'C') gradeCCount++;
        if (row.booking) bookedCount++;
        if (row.processingTimeMs) {
          totalDuration += row.processingTimeMs;
          durationCount++;
        }
      });

      // Update pill counters
      if (document.getElementById('cnt-all')) document.getElementById('cnt-all').innerText = leads.length;
      if (document.getElementById('cnt-A')) document.getElementById('cnt-A').innerText = gradeACount;
      if (document.getElementById('cnt-B')) document.getElementById('cnt-B').innerText = gradeBCount;
      if (document.getElementById('cnt-C')) document.getElementById('cnt-C').innerText = gradeCCount;
      if (document.getElementById('cnt-booked')) document.getElementById('cnt-booked').innerText = bookedCount;

      // Calculate conversion rates
      const qualRate = leads.length ? Math.round(((gradeACount + gradeBCount) / leads.length) * 100) : 0;
      const bookRate = leads.length ? Math.round((bookedCount / leads.length) * 100) : 0;
      const avgLatency = durationCount ? (totalDuration / durationCount / 1000).toFixed(1) + 's' : '3.2s';

      document.getElementById('kpiQualRate').innerText = qualRate + '%';
      document.getElementById('kpiQualCount').innerText = (gradeACount + gradeBCount) + ' Grade A/B leads';
      document.getElementById('kpiBookRate').innerText = bookRate + '%';
      document.getElementById('kpiBookCount').innerText = bookedCount + ' booked meetings';
      document.getElementById('kpiLatency').innerText = avgLatency;
    }

    function toggleBookingsModal() {
      const modal = document.getElementById('bookingsModal');
      modal.classList.toggle('open');
      if (modal.classList.contains('open')) {
        renderBookingsModal();
      }
    }

    function renderBookingsModal() {
      const grid = document.getElementById('bookingsGrid');
      const bookings = window.__rawBookings || [];

      if (!bookings.length) {
        grid.innerHTML = '<div style="text-align:center; padding:48px; color:var(--text-muted); grid-column:1/-1;">' +
          '<div style="font-size:32px; margin-bottom:10px;">📅</div>' +
          '<strong>No scheduled demos recorded yet.</strong>' +
          '<p style="font-size:12px; margin-top:4px;">When a prospect accepts a meeting slot during a call, it will appear here in your collection.</p>' +
        '</div>';
        return;
      }

      grid.innerHTML = bookings.map(b => {
        const start = new Date(b.start);
        const formattedDate = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const grade = b.score?.grade || 'A';
        const gcalUrl = b.googleCalendarUrl || ('https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('⚡ Demo with ' + b.leadName) + '&details=' + encodeURIComponent(b.summary || ''));
        const icsUrl = '/api/bookings/' + encodeURIComponent(b.id) + '/ics';

        return '<div class="booking-card">' +
          '<div>' +
            '<div class="booking-card-head">' +
              '<div>' +
                '<h4 style="font-size:15px; font-weight:700;">' + (b.leadName || 'Prospect') + '</h4>' +
                '<p style="font-size:12px; color:var(--text-muted);">' + (b.leadCompany || 'Direct Lead') + ' • ' + (b.leadPhone || '') + '</p>' +
              '</div>' +
              '<span class="badge-grade grade-' + grade + '">Grade ' + grade + '</span>' +
            '</div>' +
            '<div style="margin-top:12px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12.5px;">' +
              '<div>📅 <strong>' + formattedDate + '</strong></div>' +
              '<div style="color:var(--text-muted); font-size:11.5px; margin-top:2px;">⏰ ' + formattedTime + ' (' + (b.slotLabel || 'Confirmed slot') + ')</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">' +
            '<a href="' + gcalUrl + '" target="_blank" class="btn-gcal"><span>➕ Add to Google Calendar</span></a>' +
            '<a href="' + icsUrl + '" download class="btn-ics"><span>📥 .ics</span></a>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderResult(data) {
      const score = data.score?.score || 0;
      const grade = data.score?.grade || 'D';
      document.getElementById('scorePts').innerText = score;
      document.getElementById('scoreGrd').innerText = 'GRADE ' + grade;
      document.getElementById('scoreDial').style.setProperty('--score-angle', score + '%');

      document.getElementById('leadTitle').innerText = (data.lead?.name || 'Lead') + ' (' + (data.lead?.company || 'Direct') + ')';
      document.getElementById('leadDesc').innerText = data.summary || (data.booking ? 'Accepted live demo booking.' : 'Qualification completed.');

      const q = data.qualification || {};
      document.getElementById('vBudget').innerText = q.budget || 'unknown';
      document.getElementById('vAuth').innerText = q.authority || 'unknown';
      document.getElementById('vNeed').innerText = q.need || 'unknown';
      document.getElementById('vTime').innerText = q.timeline || 'unknown';

      document.getElementById('pBudget').style.width = q.budget === 'over_25k' ? '100%' : (q.budget === '5k_25k' ? '65%' : '30%');
      document.getElementById('pAuth').style.width = q.authority === 'decision_maker' ? '100%' : (q.authority === 'influencer' ? '70%' : '30%');
      document.getElementById('pNeed').style.width = q.need === 'critical' ? '100%' : (q.need === 'high' ? '75%' : '40%');
      document.getElementById('pTime').style.width = q.timeline === 'immediate' ? '100%' : (q.timeline === 'within_30_days' ? '75%' : '40%');

      // Objections & Buying Signals
      const objContainer = document.getElementById('objectionChips');
      const objCount = document.getElementById('objectionCount');
      const objections = q.objections || [];
      if (objCount) objCount.innerText = objections.length + ' detected';
      if (objContainer) {
        if (objections.length) {
          objContainer.innerHTML = objections.map(o => {
            let emoji = '⚠️';
            const lower = o.toLowerCase();
            if (lower.includes('price') || lower.includes('budget') || lower.includes('cost') || lower.includes('expensive')) emoji = '💰';
            else if (lower.includes('competitor') || lower.includes('alternative') || lower.includes('evaluating')) emoji = '🔄';
            else if (lower.includes('time') || lower.includes('quarter') || lower.includes('later')) emoji = '⌛';
            else if (lower.includes('committee') || lower.includes('team') || lower.includes('lead') || lower.includes('approval') || lower.includes('doc')) emoji = '👥';
            else if (lower.includes('security') || lower.includes('soc2') || lower.includes('compliance')) emoji = '🛡️';
            return '<span class="objection-badge">' + emoji + ' ' + o + '</span>';
          }).join('');
        } else {
          objContainer.innerHTML = '<span style="font-size:12px; color:var(--success); font-weight:600;">✨ Zero friction — High intent smooth qualification!</span>';
        }
      }

      // Transcript Feed & Synchronized Audio Waveform
      const stream = document.getElementById('dialogueStream');
      const turns = data.transcript || [];
      __totalTranscriptTurns = turns.length;

      if (turns.length) {
        stream.innerHTML = turns.map((t, idx) => {
          const isAgent = t.speaker === 'assistant' || t.speaker === 'agent' || t.speaker === 'bot';
          return '<div class="bubble-row ' + (isAgent ? 'agent' : 'user') + '" id="turn-' + idx + '">' +
            '<div class="bubble-icon">' + (isAgent ? '🤖' : '👤') + '</div>' +
            '<div class="bubble-body">' + t.text + '</div>' +
          '</div>';
        }).join('');

        const langBadge = (data.lead?.locale || data.lead?.region || 'en-US').toUpperCase();
        initAudioWaveform(data.recordingUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', langBadge);
      } else {
        stream.innerHTML = '<div style="padding:16px; color:var(--text-muted);">' + (data.summary || 'Call complete.') + '</div>';
      }

      // Integrations & Google Calendar
      const gcalBox = document.getElementById('gcalActions');
      if (data.booking) {
        document.getElementById('calStatus').innerText = '✅ Demo Confirmed (' + data.booking.provider + ')';
        document.getElementById('calSlot').innerText = data.booking.slot?.label || data.qualification?.selected_slot || 'Booked Slot';
        
        const gcalUrl = data.booking.googleCalendarUrl || ('https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('⚡ Demo with ' + (data.lead?.name || 'Lead')));
        const icsUrl = data.booking.id ? ('/api/bookings/' + encodeURIComponent(data.booking.id) + '/ics') : '#';

        gcalBox.innerHTML = 
          '<a href="' + gcalUrl + '" target="_blank" class="btn-gcal"><span>➕ Open in Google Calendar</span></a>' +
          (data.booking.id ? '<a href="' + icsUrl + '" download class="btn-ics"><span>📥 Download .ics</span></a>' : '');
      } else {
        document.getElementById('calStatus').innerText = 'No meeting scheduled.';
        document.getElementById('calSlot').innerText = '—';
        gcalBox.innerHTML = '';
      }

      document.getElementById('crmStatus').innerText = '✅ Synced to CRM';
      document.getElementById('crmKey').innerText = 'Call ID: ' + (data.callId || 'mock_record');

      if (data.confirmation) {
        document.getElementById('smsText').innerText = data.confirmation.message;
      } else if (data.fallbackAction) {
        document.getElementById('smsText').innerText = '[Fallback Triggered] ' + data.fallbackAction.suggestedAction;
      } else {
        document.getElementById('smsText').innerText = 'No follow-up action required.';
      }

      // JSON Viewer
      document.getElementById('jsonViewer').innerText = JSON.stringify(data, null, 2);
    }

    async function refreshStream() {
      try {
        const [leadsRes, metricsRes, bookingsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/metrics').catch(() => null),
          fetch('/api/bookings').catch(() => null)
        ]);

        const data = await leadsRes.json();
        const metricsData = metricsRes ? await metricsRes.json() : null;
        const bookingsData = bookingsRes ? await bookingsRes.json() : null;

        window.__rawLeads = data.leads || [];
        window.__savedLeads = window.__rawLeads;
        window.__rawBookings = bookingsData?.bookings || [];

        const gcalCount = window.__rawBookings.length;
        if (document.getElementById('gcalPillCount')) {
          document.getElementById('gcalPillCount').innerText = gcalCount;
        }

        updateKpis(window.__rawLeads, metricsData);
        applyFilters();
      } catch (e) {
        console.error(e);
      }
    }

    function inspectLeadRow(idx) {
      selectedLeadIdx = idx;
      if (window.__rawLeads && window.__rawLeads[idx]) {
        renderResult(window.__rawLeads[idx]);
        applyFilters();
      }
    }

    function exportLeadsCsv() {
      const leads = window.__rawLeads || [];
      if (!leads.length) {
        alert('No leads available to export.');
        return;
      }

      const headers = ['Timestamp', 'Name', 'Phone', 'Region', 'Email', 'Company', 'Interest', 'Score', 'Grade', 'Budget', 'Authority', 'Need', 'Timeline', 'DemoSlot', 'CallId', 'Status'];
      const rows = leads.map(item => {
        const l = item.lead || {};
        const s = item.score || {};
        const q = item.qualification || {};
        const slot = item.booking?.slot?.label || q.selected_slot || '';
        return [
          item.createdAt || '',
          '"' + (l.name || '').replace(/"/g, '""') + '"',
          '"' + (l.phone || '') + '"',
          l.region || '',
          '"' + (l.email || '') + '"',
          '"' + (l.company || '').replace(/"/g, '""') + '"',
          '"' + (l.interest || '').replace(/"/g, '""') + '"',
          s.score || 0,
          s.grade || 'D',
          q.budget || '',
          q.authority || '',
          q.need || '',
          q.timeline || '',
          '"' + slot.replace(/"/g, '""') + '"',
          item.callId || '',
          item.status || 'Completed'
        ].join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'speed_to_lead_export_' + new Date().toISOString().slice(0,10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Google OAuth Browser Authentication
    let __oauthStatus = { connected: false, clientIdConfigured: false };

    async function checkGoogleAuthStatus() {
      try {
        const res = await fetch('/api/auth/google/status');
        if (!res.ok) return;
        __oauthStatus = await res.json();
        renderGoogleAuthPill(__oauthStatus);
      } catch (err) {
        console.error('Error fetching Google auth status:', err);
      }
    }

    function renderGoogleAuthPill(status) {
      const pill = document.getElementById('googleAuthPill');
      if (!pill) return;

      if (status.connected) {
        const email = status.email || 'Google Calendar Connected';
        pill.innerHTML = 
          '<div class="status-pill" style="border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.1); color:var(--text);">' +
            '<span style="color:var(--success); font-size:10px;">●</span> ' +
            '<span>Google: <strong>' + email + '</strong></span>' +
            '<button onclick="disconnectGoogleAuth()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; margin-left:6px; padding:0;" title="Disconnect Google Account">✕</button>' +
          '</div>';
      } else {
        pill.innerHTML = 
          '<button class="btn-import-gmail" onclick="initiateGoogleLogin()" style="font-size:12px; border-color:rgba(66,133,244,0.4); background:rgba(66,133,244,0.08); color:var(--text);" title="Sign in with Google to automatically add bookings to your personal calendar">' +
            '<span>🌐 Sign in with Google</span>' +
          '</button>';
      }
    }

    function initiateGoogleLogin() {
      if (__oauthStatus.clientIdConfigured) {
        openGoogleOAuthPopup();
      } else {
        toggleOAuthModal();
      }
    }

    function openGoogleOAuthPopup() {
      const width = 520;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open('/api/auth/google/login', 'GoogleLoginPopup', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes,status=yes');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback to full page redirect if popup was blocked
        window.location.href = '/api/auth/google/login';
      }
    }

    // Popup cross-window communication listener (Google, Slack, etc.)
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const email = event.data.email || 'your Google account';
        showAuthAlert('🎉 Successfully signed in with Google (' + email + ')! Call bookings will sync automatically.', 'success');
        checkGoogleAuthStatus();
        checkIntegrationsHubStatus();
        const modal = document.getElementById('oauthModal');
        if (modal?.classList.contains('open')) toggleOAuthModal();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        showAuthAlert('❌ Google sign-in failed: ' + (event.data.error || 'Authorization cancelled'), 'error');
      } else if (event.data?.type === 'SLACK_AUTH_SUCCESS') {
        const channel = event.data.channel || 'Sales Channel';
        showAuthAlert('🎉 Slack connected to ' + channel + '! Lead alerts are active.', 'success');
        checkIntegrationsHubStatus();
        const modal = document.getElementById('slackModal');
        if (modal?.classList.contains('open')) toggleSlackModal();
      } else if (event.data?.type === 'SLACK_AUTH_ERROR') {
        showAuthAlert('❌ Slack connection failed: ' + (event.data.error || 'Authorization cancelled'), 'error');
      }
    });

    function openSlackOAuthPopup() {
      const width = 520;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open('/api/auth/slack/login', 'SlackLoginPopup', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = '/api/auth/slack/login';
      }
    }

    function toggleOAuthModal() {
      const modal = document.getElementById('oauthModal');
      modal.classList.toggle('open');
    }

    function switchGoogleAuthTab(tabName) {
      document.getElementById('gtab-oauth').style.display = tabName === 'oauth' ? 'block' : 'none';
      document.getElementById('gtab-webhook').style.display = tabName === 'webhook' ? 'block' : 'none';
      document.getElementById('btnGtabOAuth').style.background = tabName === 'oauth' ? 'var(--primary)' : 'var(--surface)';
      document.getElementById('btnGtabOAuth').style.color = tabName === 'oauth' ? 'white' : 'var(--text)';
      document.getElementById('btnGtabWebhook').style.background = tabName === 'webhook' ? 'var(--primary)' : 'var(--surface)';
      document.getElementById('btnGtabWebhook').style.color = tabName === 'webhook' ? 'white' : 'var(--text)';
    }

    async function saveOAuthConfig(event) {
      event.preventDefault();
      const clientId = document.getElementById('oauthClientId').value.trim();
      const clientSecret = document.getElementById('oauthClientSecret').value.trim();

      if (!clientId || !clientSecret) {
        alert('Please fill in both Client ID and Client Secret.');
        return;
      }

      try {
        const res = await fetch('/api/auth/google/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, clientSecret })
        });
        if (res.ok) {
          __oauthStatus.clientIdConfigured = true;
          openGoogleOAuthPopup();
        } else {
          const err = await res.json();
          alert('Failed to save config: ' + (err.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error saving config: ' + err.message);
      }
    }

    async function saveGoogleWebhook(event) {
      event.preventDefault();
      const webhookUrl = document.getElementById('googleWebhookUrlInput').value.trim();
      const statusEl = document.getElementById('googleWebhookStatus');

      statusEl.innerHTML = '<span style="color:var(--primary);">⏳ Verifying Google Apps Script Webhook...</span>';
      try {
        const res = await fetch('/api/auth/google/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl })
        });
        const data = await res.json();
        if (res.ok) {
          statusEl.innerHTML = '<span style="color:var(--success);">✅ ' + data.message + '</span>';
          setTimeout(() => {
            toggleOAuthModal();
            checkGoogleAuthStatus();
            checkIntegrationsHubStatus();
            showAuthAlert('🎉 Google Calendar Webhook connected! All call bookings will sync automatically.', 'success');
          }, 700);
        } else {
          statusEl.innerHTML = '<span style="color:var(--danger);">❌ ' + (data.error || 'Connection failed') + '</span>';
        }
      } catch (err) {
        statusEl.innerHTML = '<span style="color:var(--danger);">❌ Network error: ' + err.message + '</span>';
      }
    }

    async function disconnectGoogleAuth() {
      if (!confirm('Disconnect your Google Calendar account?')) return;
      try {
        await fetch('/api/auth/google/disconnect', { method: 'POST' });
        await checkGoogleAuthStatus();
        await checkIntegrationsHubStatus();
        showAuthAlert('Google Calendar account disconnected.', 'info');
      } catch (err) {
        alert('Disconnect error: ' + err.message);
      }
    }

    function showAuthAlert(msg, type) {
      const banner = document.getElementById('authAlertBanner');
      const text = document.getElementById('authAlertText');
      if (!banner || !text) return;

      text.innerText = msg;
      banner.style.display = 'flex';

      if (type === 'success') {
        banner.style.background = 'rgba(16,185,129,0.15)';
        banner.style.border = '1px solid rgba(16,185,129,0.4)';
        banner.style.color = 'var(--success)';
      } else if (type === 'error') {
        banner.style.background = 'rgba(239,68,68,0.15)';
        banner.style.border = '1px solid rgba(239,68,68,0.4)';
        banner.style.color = 'var(--danger)';
      } else {
        banner.style.background = 'rgba(59,130,246,0.15)';
        banner.style.border = '1px solid rgba(59,130,246,0.4)';
        banner.style.color = 'var(--primary)';
      }
    }

    // Multilingual Prefix Auto-Detection
    function handlePhoneInput(val) {
      const regionInput = document.getElementById('region');
      if (!regionInput) return;
      const clean = val.trim();
      if (clean.startsWith('+60')) regionInput.value = 'MY (Bahasa Malaysia / English)';
      else if (clean.startsWith('+65')) regionInput.value = 'SG (Singapore English)';
      else if (clean.startsWith('+44')) regionInput.value = 'GB (British English)';
      else if (clean.startsWith('+49')) regionInput.value = 'DE (German / Deutsch)';
      else if (clean.startsWith('+34')) regionInput.value = 'ES (Spanish / Español)';
      else if (clean.startsWith('+52')) regionInput.value = 'MX (Spanish Latino)';
      else if (clean.startsWith('+81')) regionInput.value = 'JP (Japanese / 日本語)';
      else if (clean.startsWith('+33')) regionInput.value = 'FR (French / Français)';
      else if (clean.startsWith('+91')) regionInput.value = 'IN (English / Hindi)';
      else if (clean.startsWith('+1')) regionInput.value = 'US (English US)';
      else regionInput.value = 'Auto-detected';
    }

    // Interactive Audio Waveform Recording Player
    let __audioObj = null;
    let __audioPlaying = false;
    let __audioDuration = 18;
    let __audioCurrentTime = 0;
    let __audioTimerInterval = null;
    let __totalTranscriptTurns = 0;

    function initAudioWaveform(recordingUrl, langBadge) {
      const card = document.getElementById('audioPlayerCard');
      const badge = document.getElementById('audioLanguageBadge');
      if (card) card.style.display = 'flex';
      if (badge && langBadge) badge.innerText = langBadge;

      renderWaveformBars();
      resetAudioState();

      if (recordingUrl) {
        if (__audioObj) {
          __audioObj.pause();
          __audioObj = null;
        }
        __audioObj = new Audio(recordingUrl);
        __audioObj.volume = parseFloat(document.getElementById('audioVolume')?.value || '0.8');
        __audioObj.addEventListener('loadedmetadata', () => {
          if (__audioObj.duration && Number.isFinite(__audioObj.duration)) {
            __audioDuration = Math.min(__audioObj.duration, 45);
          }
          updateAudioTimeDisplay();
        });
        __audioObj.addEventListener('ended', () => {
          resetAudioState();
        });
      }
    }

    function renderWaveformBars() {
      const container = document.getElementById('waveformContainer');
      if (!container) return;
      const barHeights = [20, 35, 60, 45, 80, 95, 65, 40, 75, 90, 100, 70, 50, 85, 95, 60, 40, 65, 80, 100, 85, 60, 45, 75, 90, 55, 35, 60, 75, 85, 50, 40, 65, 45, 30, 20];
      container.innerHTML = barHeights.map((h, i) => 
        '<div class="waveform-bar" id="wbar-' + i + '" style="height:' + h + '%;" data-idx="' + i + '"></div>'
      ).join('');
    }

    function toggleAudioPlayback() {
      const icon = document.getElementById('audioPlayIcon');
      if (!__audioPlaying) {
        __audioPlaying = true;
        if (icon) icon.innerText = '⏸';
        if (__audioObj) {
          __audioObj.play().catch(() => {});
        }
        __audioTimerInterval = setInterval(onAudioTick, 100);
      } else {
        pauseAudioPlayback();
      }
    }

    function pauseAudioPlayback() {
      __audioPlaying = false;
      const icon = document.getElementById('audioPlayIcon');
      if (icon) icon.innerText = '▶';
      if (__audioObj) __audioObj.pause();
      if (__audioTimerInterval) clearInterval(__audioTimerInterval);
    }

    function resetAudioState() {
      pauseAudioPlayback();
      __audioCurrentTime = 0;
      updateAudioTimeDisplay();
      updateWaveformProgress(0);
      highlightActiveTurn(-1);
    }

    function onAudioTick() {
      if (__audioObj && !__audioObj.paused && __audioObj.currentTime) {
        __audioCurrentTime = __audioObj.currentTime;
      } else {
        __audioCurrentTime += 0.1;
      }

      if (__audioCurrentTime >= __audioDuration) {
        resetAudioState();
        return;
      }

      updateAudioTimeDisplay();
      const progressRatio = Math.min(__audioCurrentTime / __audioDuration, 1);
      updateWaveformProgress(progressRatio);

      // Synchronize active transcript turn
      if (__totalTranscriptTurns > 0) {
        const activeIdx = Math.floor(progressRatio * __totalTranscriptTurns);
        highlightActiveTurn(activeIdx);
      }
    }

    function updateAudioTimeDisplay() {
      const timer = document.getElementById('audioTimer');
      if (!timer) return;
      const formatTime = s => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      };
      timer.innerText = formatTime(__audioCurrentTime) + ' / ' + formatTime(__audioDuration);
    }

    function updateWaveformProgress(ratio) {
      const totalBars = 36;
      const currentBar = Math.floor(ratio * totalBars);
      for (let i = 0; i < totalBars; i++) {
        const el = document.getElementById('wbar-' + i);
        if (el) {
          if (i < currentBar) el.className = 'waveform-bar played';
          else if (i === currentBar) el.className = 'waveform-bar active';
          else el.className = 'waveform-bar';
        }
      }
    }

    function seekAudioFromClick(event) {
      const container = document.getElementById('waveformContainer');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
      __audioCurrentTime = ratio * __audioDuration;
      if (__audioObj) {
        __audioObj.currentTime = __audioCurrentTime;
      }
      updateAudioTimeDisplay();
      updateWaveformProgress(ratio);
    }

    function setAudioVolume(val) {
      if (__audioObj) __audioObj.volume = parseFloat(val);
    }

    function highlightActiveTurn(turnIdx) {
      for (let i = 0; i < __totalTranscriptTurns; i++) {
        const turnEl = document.getElementById('turn-' + i);
        if (turnEl) {
          if (i === turnIdx) {
            turnEl.classList.add('playing-turn');
            turnEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            turnEl.classList.remove('playing-turn');
          }
        }
      }
    }

    let __allIntegrations = {};

    async function checkIntegrationsHubStatus() {
      try {
        const res = await fetch('/api/integrations/status');
        if (!res.ok) return;
        __allIntegrations = await res.json();
        renderIntegrationsPills(__allIntegrations);
      } catch (err) {
        console.error('Error fetching integrations status:', err);
      }
    }

    function renderIntegrationsPills(hub) {
      // 1. Google Pill
      const gPill = document.getElementById('googleAuthPill');
      const tabGcal = document.getElementById('tabGcalStatus');
      if (gPill) {
        if (hub.google?.connected) {
          const email = hub.google.email || 'Google Connected';
          gPill.innerHTML = '<div class="status-pill" style="border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.1);">' +
            '<span style="color:var(--success); font-size:10px;">●</span> ' +
            '<span>Google: <strong>' + email + '</strong></span>' +
            '<button onclick="disconnectGoogleAuth()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; margin-left:6px;" title="Disconnect Google">✕</button>' +
          '</div>';
          if (tabGcal) tabGcal.innerHTML = '<span style="color:var(--success);">● Connected (' + email + ')</span>';
        } else {
          gPill.innerHTML = '<button class="btn-import-gmail" onclick="initiateGoogleLogin()" style="font-size:12px; border-color:rgba(66,133,244,0.4); background:rgba(66,133,244,0.08); color:var(--text);">' +
            '<span>🌐 Connect Google</span>' +
          '</button>';
          if (tabGcal) tabGcal.innerHTML = '<span style="color:var(--text-dim);">○ Not Connected</span>';
        }
      }

      // 2. Slack Pill
      const sPill = document.getElementById('slackAuthPill');
      const tabSlack = document.getElementById('tabSlackStatus');
      if (sPill) {
        if (hub.slack?.connected) {
          sPill.innerHTML = '<div class="status-pill" style="border-color:rgba(74,21,75,0.4); background:rgba(74,21,75,0.15); color:var(--text);">' +
            '<span style="color:#ECB22E; font-size:10px;">●</span> ' +
            '<span>Slack: <strong>' + (hub.slack.channel || 'Active') + '</strong></span>' +
            '<button onclick="disconnectSlack()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; margin-left:6px;" title="Disconnect Slack">✕</button>' +
          '</div>';
          if (tabSlack) tabSlack.innerHTML = '<span style="color:var(--success);">● Connected (' + (hub.slack.channel || 'Active') + ')</span>';
        } else {
          sPill.innerHTML = '<button class="btn-import-gmail" onclick="toggleSlackModal()" style="font-size:12px; border-color:rgba(74,21,75,0.4); background:rgba(74,21,75,0.08); color:var(--text);">' +
            '<span>💬 Connect Slack</span>' +
          '</button>';
          if (tabSlack) tabSlack.innerHTML = '<span style="color:var(--text-dim);">○ Not Connected</span>';
        }
      }

      // 3. Twilio Pill
      const tPill = document.getElementById('twilioAuthPill');
      const tabTwilio = document.getElementById('tabTwilioStatus');
      if (tPill) {
        if (hub.twilio?.connected) {
          tPill.innerHTML = '<div class="status-pill" style="border-color:rgba(242,47,70,0.4); background:rgba(242,47,70,0.1); color:var(--text);">' +
            '<span style="color:#F22F46; font-size:10px;">●</span> ' +
            '<span>Twilio: <strong>' + hub.twilio.phoneNumber + '</strong></span>' +
            '<button onclick="disconnectTwilio()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; margin-left:6px;" title="Disconnect Twilio">✕</button>' +
          '</div>';
          if (tabTwilio) tabTwilio.innerHTML = '<span style="color:var(--success);">● Active (' + hub.twilio.phoneNumber + ')</span>';
        } else {
          tPill.innerHTML = '<button class="btn-import-gmail" onclick="toggleTwilioModal()" style="font-size:12px; border-color:rgba(242,47,70,0.4); background:rgba(242,47,70,0.08); color:var(--text);">' +
            '<span>📱 Connect Twilio</span>' +
          '</button>';
          if (tabTwilio) tabTwilio.innerHTML = '<span style="color:var(--text-dim);">○ Simulated Preview</span>';
        }
      }

      // 4. Custom Zapier / Make Webhook Pill
      const wPill = document.getElementById('webhookAuthPill');
      const tabWebhook = document.getElementById('tabWebhookStatus');
      if (wPill) {
        if (hub.webhook?.connected) {
          wPill.innerHTML = '<div class="status-pill" style="border-color:rgba(234,88,12,0.4); background:rgba(234,88,12,0.1); color:var(--text);">' +
            '<span style="color:#EA580C; font-size:10px;">●</span> ' +
            '<span>Webhook: <strong>' + (hub.webhook.label || 'Active') + '</strong></span>' +
            '<button onclick="disconnectWebhook()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; margin-left:6px;" title="Disconnect Webhook">✕</button>' +
          '</div>';
          if (tabWebhook) tabWebhook.innerHTML = '<span style="color:var(--success);">● Connected</span>';
        } else {
          wPill.innerHTML = '<button class="btn-import-gmail" onclick="toggleWebhookModal()" style="font-size:12px; border-color:rgba(234,88,12,0.4); background:rgba(234,88,12,0.08); color:var(--text);">' +
            '<span>⚡ Zapier / Make</span>' +
          '</button>';
          if (tabWebhook) tabWebhook.innerHTML = '<span style="color:var(--text-dim);">○ Not Connected</span>';
        }
      }
    }

    // Modal Toggles
    function toggleSlackModal() {
      document.getElementById('slackModal').classList.toggle('open');
    }

    function toggleTwilioModal() {
      document.getElementById('twilioModal').classList.toggle('open');
    }

    function toggleWebhookModal() {
      document.getElementById('webhookModal').classList.toggle('open');
    }

    async function saveSlackIntegration(event) {
      event.preventDefault();
      const webhookUrl = document.getElementById('slackWebhookInput').value.trim();
      const channel = document.getElementById('slackChannelInput').value.trim();
      const statusEl = document.getElementById('slackModalStatus');

      statusEl.innerHTML = '<span style="color:var(--primary);">⏳ Verifying Slack webhook connection...</span>';
      try {
        const res = await fetch('/api/integrations/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl, channel })
        });
        const data = await res.json();
        if (res.ok) {
          statusEl.innerHTML = '<span style="color:var(--success);">✅ ' + data.message + '</span>';
          setTimeout(() => {
            toggleSlackModal();
            checkIntegrationsHubStatus();
            showAuthAlert('🎉 Slack sales channel connected! Alerts will post instantly.', 'success');
          }, 800);
        } else {
          statusEl.innerHTML = '<span style="color:var(--danger);">❌ ' + (data.error || 'Connection failed') + '</span>';
        }
      } catch (err) {
        statusEl.innerHTML = '<span style="color:var(--danger);">❌ Network error: ' + err.message + '</span>';
      }
    }

    async function disconnectSlack() {
      if (!confirm('Disconnect Slack sales alerts?')) return;
      await fetch('/api/integrations/slack/disconnect', { method: 'POST' });
      await checkIntegrationsHubStatus();
      showAuthAlert('Slack disconnected.', 'info');
    }

    async function saveTwilioIntegration(event) {
      event.preventDefault();
      const accountSid = document.getElementById('twilioSidInput').value.trim();
      const authToken = document.getElementById('twilioTokenInput').value.trim();
      const phoneNumber = document.getElementById('twilioPhoneInput').value.trim();
      const testPhone = document.getElementById('twilioTestPhoneInput').value.trim();
      const statusEl = document.getElementById('twilioModalStatus');

      statusEl.innerHTML = '<span style="color:var(--primary);">⏳ Validating Twilio carrier credentials...</span>';
      try {
        const res = await fetch('/api/integrations/twilio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountSid, authToken, phoneNumber, testPhone })
        });
        const data = await res.json();
        if (res.ok) {
          statusEl.innerHTML = '<span style="color:var(--success);">✅ ' + data.message + '</span>';
          setTimeout(() => {
            toggleTwilioModal();
            checkIntegrationsHubStatus();
            showAuthAlert('🎉 Twilio carrier connected! Real SMS dispatch is active.', 'success');
          }, 800);
        } else {
          statusEl.innerHTML = '<span style="color:var(--danger);">❌ ' + (data.error || 'Connection failed') + '</span>';
        }
      } catch (err) {
        statusEl.innerHTML = '<span style="color:var(--danger);">❌ Network error: ' + err.message + '</span>';
      }
    }

    async function disconnectTwilio() {
      if (!confirm('Disconnect Twilio SMS carrier?')) return;
      await fetch('/api/integrations/twilio/disconnect', { method: 'POST' });
      await checkIntegrationsHubStatus();
      showAuthAlert('Twilio SMS carrier disconnected (reverted to simulated preview).', 'info');
    }

    async function saveWebhookIntegration(event) {
      event.preventDefault();
      const url = document.getElementById('webhookUrlInput').value.trim();
      const secret = document.getElementById('webhookSecretInput').value.trim();
      const label = document.getElementById('webhookLabelInput').value.trim();
      const statusEl = document.getElementById('webhookModalStatus');

      statusEl.innerHTML = '<span style="color:var(--primary);">⏳ Sending verification ping to webhook...</span>';
      try {
        const res = await fetch('/api/integrations/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, secret, label })
        });
        const data = await res.json();
        if (res.ok) {
          statusEl.innerHTML = '<span style="color:var(--success);">✅ ' + data.message + '</span>';
          setTimeout(() => {
            toggleWebhookModal();
            checkIntegrationsHubStatus();
            showAuthAlert('🎉 Custom webhook connected! Lead events will broadcast automatically.', 'success');
          }, 800);
        } else {
          statusEl.innerHTML = '<span style="color:var(--danger);">❌ ' + (data.error || 'Connection failed') + '</span>';
        }
      } catch (err) {
        statusEl.innerHTML = '<span style="color:var(--danger);">❌ Network error: ' + err.message + '</span>';
      }
    }

    async function disconnectWebhook() {
      if (!confirm('Disconnect custom Zapier/Make webhook?')) return;
      await fetch('/api/integrations/webhook/disconnect', { method: 'POST' });
      await checkIntegrationsHubStatus();
      showAuthAlert('Custom webhook disconnected.', 'info');
    }

    // Check URL parameters for OAuth redirect status
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    if (authStatus === 'success') {
      const email = urlParams.get('email') || 'your Google account';
      showAuthAlert('🎉 Successfully connected Google Calendar for ' + email + '! All call bookings will sync automatically.', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === 'failed') {
      const err = urlParams.get('error') || 'Authorization cancelled';
      showAuthAlert('❌ Google sign-in failed: ' + err, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === 'need_client_id') {
      toggleOAuthModal();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const slackAuth = urlParams.get('slack_auth');
    if (slackAuth === 'success') {
      showAuthAlert('🎉 Slack sales workspace connected successfully!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Auto-load on startup & auto-refresh
    checkGoogleAuthStatus();
    checkIntegrationsHubStatus();
    refreshStream();
    setInterval(refreshStream, 3500);
    setInterval(checkIntegrationsHubStatus, 7000);
  </script>

  <!-- Google Calendar Bookings Collection Modal -->
  <div class="modal-backdrop" id="bookingsModal" onclick="if(event.target===this) toggleBookingsModal()">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h3 style="font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>📅 Google Calendar &amp; Demo Bookings Collection</span>
          </h3>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">All qualified appointments booked via autonomous speed-to-lead calls. 1-click sync to Google Calendar.</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleBookingsModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="bookings-grid" id="bookingsGrid">
          <div style="text-align:center; padding:40px; color:var(--text-muted);">Loading bookings collection...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Google Calendar 1-Click Connection Modal -->
  <div class="modal-backdrop" id="oauthModal" onclick="if(event.target===this) toggleOAuthModal()">
    <div class="modal-content" style="max-width:540px;">
      <div class="modal-header">
        <div>
          <h3 style="font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>📅 Connect Google Calendar</span>
          </h3>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">All qualified lead appointments will automatically be scheduled onto your personal Google Calendar.</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleOAuthModal()">✕</button>
      </div>

      <!-- Tab Switcher -->
      <div style="display:flex; gap:8px; margin-bottom:16px; background:var(--bg-subtle); padding:4px; border-radius:10px; border:1px solid var(--border);">
        <button id="btnGtabOAuth" type="button" onclick="switchGoogleAuthTab('oauth')" style="flex:1; padding:8px 12px; border-radius:8px; border:none; background:var(--primary); color:white; font-size:12px; font-weight:700; cursor:pointer;">
          🌐 1-Click Google Sign-in
        </button>
        <button id="btnGtabWebhook" type="button" onclick="switchGoogleAuthTab('webhook')" style="flex:1; padding:8px 12px; border-radius:8px; border:none; background:var(--surface); color:var(--text); font-size:12px; font-weight:700; cursor:pointer;">
          ⚡ Apps Script Webhook (Free)
        </button>
      </div>

      <div class="modal-body">
        <!-- Tab 1: Google OAuth Sign-In -->
        <div id="gtab-oauth">
          <div style="text-align:center; padding:18px 12px; background:var(--bg-subtle); border:1px solid var(--border); border-radius:12px; margin-bottom:16px;">
            <p style="font-size:13px; color:var(--text); margin-bottom:14px; font-weight:500;">
              Connect with your Google Account to create events and Google Meet links seamlessly.
            </p>
            <button onclick="openGoogleOAuthPopup()" style="display:inline-flex; align-items:center; justify-content:center; gap:10px; background:#ffffff; color:#3c4043; border:1px solid #dadce0; border-radius:24px; padding:11px 24px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 1px 3px rgba(60,64,67,0.15); transition:all 0.15s;">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <!-- Collapsible Custom Credentials for Admin Setup -->
          <details style="background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:10px 14px; font-size:12px;">
            <summary style="cursor:pointer; font-weight:700; color:var(--text-muted);">⚙️ Configure Custom Google OAuth Client ID &amp; Secret</summary>
            <form onsubmit="saveOAuthConfig(event)" style="margin-top:12px;">
              <div class="form-group" style="margin-bottom:10px;">
                <label style="font-size:11.5px; font-weight:600;">Google Client ID</label>
                <input type="text" id="oauthClientId" class="form-input" placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label style="font-size:11.5px; font-weight:600;">Google Client Secret</label>
                <input type="password" id="oauthClientSecret" class="form-input" placeholder="e.g. GOCSPX-xxxxxxxx" required>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="submit" class="btn-gcal" style="font-size:11.5px; padding:6px 14px; cursor:pointer;">
                  <span>Save &amp; Open Google Login</span>
                </button>
              </div>
            </form>
          </details>
        </div>

        <!-- Tab 2: Google Apps Script Webhook -->
        <div id="gtab-webhook" style="display:none;">
          <form onsubmit="saveGoogleWebhook(event)">
            <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:12px; margin-bottom:14px; line-height:1.5;">
              <strong>📌 1-Minute Webhook Setup:</strong><br>
              1. Open <a href="https://script.google.com/" target="_blank" style="color:var(--primary); font-weight:600;">script.google.com</a> and paste the webhook script from <code>scripts/google-calendar-webhook.gs</code>.<br>
              2. Click <strong>Deploy ➔ New Deployment ➔ Web App (Access: Anyone)</strong>.<br>
              3. Paste the URL below and click <strong>"Connect Webhook"</strong>.
            </div>

            <div class="form-group" style="margin-bottom:14px;">
              <label style="font-size:12px; font-weight:700;">Google Apps Script Webhook URL</label>
              <input type="url" id="googleWebhookUrlInput" class="form-input" placeholder="https://script.google.com/macros/s/.../exec" required>
            </div>

            <div id="googleWebhookStatus" style="font-size:12px; margin-bottom:14px;"></div>

            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button type="button" class="btn-ics" onclick="toggleOAuthModal()">Cancel</button>
              <button type="submit" class="btn-gcal" style="cursor:pointer; border:none; padding:10px 18px;">
                <span>⚡ Connect Webhook</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Slack Sales Webhook Setup Modal -->
  <div class="modal-backdrop" id="slackModal" onclick="if(event.target===this) toggleSlackModal()">
    <div class="modal-content" style="max-width:540px;">
      <div class="modal-header">
        <div>
          <h3 style="font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>💬 Connect Slack Sales Alerts</span>
          </h3>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Receive instant rich Block Kit notifications in your team's Slack channel whenever a lead qualifies.</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleSlackModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center; padding:16px 12px; background:var(--bg-subtle); border:1px solid var(--border); border-radius:12px; margin-bottom:16px;">
          <p style="font-size:13px; color:var(--text); margin-bottom:12px; font-weight:500;">
            Connect your Slack Workspace to receive real-time sales alerts and lead scorecards.
          </p>
          <button onclick="openSlackOAuthPopup()" style="display:inline-flex; align-items:center; justify-content:center; gap:10px; background:#4A154B; color:#ffffff; border:none; border-radius:24px; padding:11px 24px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(74,21,75,0.3);">
            <span>💬 Add to Slack (1-Click OAuth)</span>
          </button>
        </div>

        <form onsubmit="saveSlackIntegration(event)">
          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:12px; margin-bottom:14px; line-height:1.5;">
            <strong>📌 Or Paste Incoming Webhook URL:</strong><br>
            Create an Incoming Webhook in <a href="https://api.slack.com/apps" target="_blank" style="color:var(--primary); font-weight:600;">api.slack.com/apps</a> and paste the URL below.
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Slack Incoming Webhook URL</label>
            <input type="url" id="slackWebhookInput" class="form-input" placeholder="https://hooks.slack.com/services/T.../B.../..." required>
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-size:12px; font-weight:700;">Channel Label (Optional)</label>
            <input type="text" id="slackChannelInput" class="form-input" placeholder="e.g. #sales-inbound-leads">
          </div>

          <div id="slackModalStatus" style="font-size:12px; margin-bottom:14px;"></div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn-ics" onclick="toggleSlackModal()">Cancel</button>
            <button type="submit" class="btn-gcal" style="cursor:pointer; border:none; padding:10px 18px; background:#4A154B;">
              <span>💬 Connect &amp; Test Webhook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Twilio Carrier Outbound SMS Setup Modal -->
  <div class="modal-backdrop" id="twilioModal" onclick="if(event.target===this) toggleTwilioModal()">
    <div class="modal-content" style="max-width:540px;">
      <div class="modal-header">
        <div>
          <h3 style="font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>📱 Connect Twilio Outbound SMS Carrier</span>
          </h3>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Dispatches real SMS text messages with Google Calendar links and fallback reschedule links to prospects.</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleTwilioModal()">✕</button>
      </div>
      <div class="modal-body">
        <form onsubmit="saveTwilioIntegration(event)">
          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:12px; margin-bottom:16px; line-height:1.5;">
            <strong>📌 Twilio API Setup:</strong><br>
            Get your <strong>Account SID</strong>, <strong>Auth Token</strong>, and <strong>Phone Number</strong> from the <a href="https://console.twilio.com/" target="_blank" style="color:var(--primary); font-weight:600;">Twilio Console</a>.
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Account SID</label>
            <input type="text" id="twilioSidInput" class="form-input" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Auth Token</label>
            <input type="password" id="twilioTokenInput" class="form-input" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Twilio Outbound Phone Number (E.164)</label>
            <input type="text" id="twilioPhoneInput" class="form-input" placeholder="+14155550100" required>
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-size:12px; font-weight:700;">Test Destination Phone Number (Optional)</label>
            <input type="text" id="twilioTestPhoneInput" class="form-input" placeholder="e.g. +60127058268 (Sends instant verification SMS)">
          </div>

          <div id="twilioModalStatus" style="font-size:12px; margin-bottom:14px;"></div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn-ics" onclick="toggleTwilioModal()">Cancel</button>
            <button type="submit" class="btn-gcal" style="cursor:pointer; border:none; padding:10px 18px; background:#F22F46;">
              <span>📱 Connect &amp; Validate Carrier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Custom Zapier / Make.com Webhook Setup Modal -->
  <div class="modal-backdrop" id="webhookModal" onclick="if(event.target===this) toggleWebhookModal()">
    <div class="modal-content" style="max-width:540px;">
      <div class="modal-header">
        <div>
          <h3 style="font-size:18px; font-weight:800; display:flex; align-items:center; gap:8px;">
            <span>⚡ Connect Zapier / Make.com Webhook</span>
          </h3>
          <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Broadcast qualified lead outcomes, BANT scores, and demo bookings to Zapier, Make, n8n, or your custom CRM endpoint.</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleWebhookModal()">✕</button>
      </div>
      <div class="modal-body">
        <form onsubmit="saveWebhookIntegration(event)">
          <div style="background:var(--bg-subtle); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:12px; margin-bottom:16px; line-height:1.5;">
            <strong>📌 Webhook Integration Setup:</strong><br>
            Paste your <strong>Catch Hook URL</strong> from Zapier, Make.com, or your backend server below to receive automated JSON events on every call.
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Webhook Target URL</label>
            <input type="url" id="webhookUrlInput" class="form-input" placeholder="https://hooks.zapier.com/hooks/catch/..." required>
          </div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:12px; font-weight:700;">Webhook Label (Optional)</label>
            <input type="text" id="webhookLabelInput" class="form-input" placeholder="e.g. Zapier Inbound Pipeline">
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-size:12px; font-weight:700;">HMAC Secret Key (Optional for Signature Verification)</label>
            <input type="password" id="webhookSecretInput" class="form-input" placeholder="Optional secret for X-Speed-To-Lead-Signature">
          </div>

          <div id="webhookModalStatus" style="font-size:12px; margin-bottom:14px;"></div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn-ics" onclick="toggleWebhookModal()">Cancel</button>
            <button type="submit" class="btn-gcal" style="cursor:pointer; border:none; padding:10px 18px; background:#EA580C;">
              <span>⚡ Connect &amp; Test Webhook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>`;
}
