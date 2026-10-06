import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Role = "citizen" | "barangay_staff" | "physician" | "admin";
type FontSize = "small" | "default" | "large";
type Density = "comfortable" | "compact";
// Full appearance control surface. Theme + font size are real (persisted to this
// browser and applied immediately). Reduced motion and density are also applied
// immediately via document data attributes; they are device-local preferences.
type Appearance = {
  theme: string; setTheme: (theme: string) => void;
  fontSize: FontSize; setFontSize: (size: FontSize) => void;
  reducedMotion: boolean; setReducedMotion: (on: boolean) => void;
  density: Density; setDensity: (density: Density) => void;
  notify: boolean; setNotify: (on: boolean) => void;
};
type Tone = "blue" | "teal" | "green" | "amber" | "red" | "gray";
type RegKind = "patient" | "staff" | "physician";

const patients = [
  { name: "Maria Santos", code: "CL-2025-0842", household: "HH-041 · Purok 3", status: "Verified", screening: "Monitor", visit: "18 Jun 2025" },
  { name: "Rogelio Dela Cruz", code: "CL-2025-0917", household: "HH-058 · Purok 2", status: "Pending", screening: "Needs Referral", visit: "17 Jun 2025" },
  { name: "Lorna Bautista", code: "CL-2024-0631", household: "HH-026 · Purok 1", status: "Verified", screening: "Normal", visit: "15 Jun 2025" },
  { name: "Edwin Ramos", code: "CL-2025-1024", household: "HH-064 · Purok 4", status: "Verified", screening: "Monitor", visit: "11 Jun 2025" },
];

const roleMeta: Record<Role, { label: string; subtitle: string; initial: string }> = {
  citizen: { label: "Patient", subtitle: "My personal health information", initial: "home" },
  barangay_staff: { label: "Barangay Staff", subtitle: "Barangay Maligaya Health Center", initial: "dashboard" },
  physician: { label: "Physician", subtitle: "San Isidro District Hospital", initial: "dashboard" },
  admin: { label: "Administrator", subtitle: "CareLink System Administration", initial: "overview" },
};

const nav: Record<Role, { id: string; label: string; icon: string }[]> = {
  citizen: [
    { id: "home", label: "Home", icon: "home" },
    { id: "card", label: "My Health Card", icon: "card" },
    { id: "record", label: "Medical Record", icon: "record" },
    { id: "prescriptions", label: "E-Prescription", icon: "rx" },
    { id: "notes", label: "Doctor Notes", icon: "note" },
    { id: "access", label: "Access History", icon: "shield" },
    { id: "settings", label: "Profile & Settings", icon: "settings" },
  ],
  barangay_staff: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "masterlist", label: "Patient Masterlist", icon: "people" },
    { id: "households", label: "Households", icon: "home" },
    { id: "add-patient", label: "Add Resident", icon: "plus" },
    { id: "screening", label: "Health Screening", icon: "screening" },
    { id: "referrals", label: "Referrals", icon: "referral" },
    { id: "id-cards", label: "QR / Patient ID", icon: "qr" },
    { id: "reports", label: "Reports", icon: "chart" },
    { id: "settings", label: "Profile & Settings", icon: "settings" },
  ],
  physician: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "lookup", label: "Patient Lookup", icon: "search" },
    { id: "consultations", label: "Consultations", icon: "consult" },
    { id: "patient-record", label: "Patient Records", icon: "record" },
    { id: "notes", label: "Doctor Notes", icon: "note" },
    { id: "prescriptions", label: "E-Prescriptions", icon: "rx" },
    { id: "referrals", label: "Referrals", icon: "referral" },
    { id: "settings", label: "Profile & Settings", icon: "settings" },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "applications", label: "Physician Applications", icon: "approve" },
    { id: "staff", label: "Barangay Staff Management", icon: "people" },
    { id: "reports", label: "System Reports", icon: "report" },
    { id: "audit", label: "Audit Logs", icon: "shield" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5"/><circle cx="17" cy="7" r="2"/><path d="M16 13c3.2-.3 4.7 1.4 5 4"/></>,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h5"/></>,
    record: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></>,
    rx: <><path d="M5 3v18M5 4h6a4 4 0 0 1 0 8H5M10 12l8 9M18 13l-7 8"/></>,
    note: <><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    shield: <><path d="M12 3 20 6v5c0 5.1-3.2 8.2-8 10-4.8-1.8-8-4.9-8-10V6z"/><path d="m9 12 2 2 4-4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7-.7-2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    screening: <><path d="M4 13h4l2-5 4 9 2-4h4"/><path d="M5 4h14v16H5z"/></>,
    referral: <><path d="M4 7h11M11 3l4 4-4 4M20 17H9M13 13l-4 4 4 4"/></>,
    qr: <><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 14h2v7h-4v-2h-3v2"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    report: <><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    consult: <><path d="M4 4h16v13H8l-4 4z"/><path d="M8 9h8M8 13h5"/></>,
    approve: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.5-4.2 2.8-6 7-6 2.2 0 3.9.5 5 1.5M17 19l2 2 4-5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    printer: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16"/></>,
    logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.4"/><circle cx="8" cy="17" r="2.4"/></>,
    network: <><circle cx="12" cy="4" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 6.2V11M12 11l-5.3 5.4M12 11l5.3 5.4"/></>,
    activity: <><path d="M3 12h4l2.5-7 5 14 2.5-7H21"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.record}</svg>;
}

// CareLink brand logo. Renders the supplied PNG lockup (icon + "CARELINK"
// wordmark baked in) from /public. `compact` only tightens the wrapper; the
// image is the full brand mark.
function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "logo logo-compact" : "logo"}>
    <span className="logo-circle"><img className="logo-img" src="/carelinkpng.png" alt="CareLink" /></span>
  </div>;
}

function Button({ children, variant = "primary", icon, onClick, type = "button", disabled = false, className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string }) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} type={type} disabled={disabled}>{icon && <Icon name={icon} size={18}/>}<span>{children}</span></button>;
}

function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge badge-${tone}`}><i></i>{children}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Field({ label, placeholder, type = "text", value, onChange, error, children }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (value: string) => void; error?: string; children?: ReactNode }) {
  return <label className="field"><span>{label}</span>{children || <input type={type} placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} aria-invalid={!!error}/>} {error && <small className="field-error">{error}</small>}</label>;
}

function Modal({ title, children, onClose, actions }: { title: string; children: ReactNode; onClose: () => void; actions: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div><div className="modal-body">{children}</div><div className="modal-actions">{actions}</div></div></div>;
}

function QRCode() {
  const blocks = [0,1,2,4,5,6,8,10,12,13,14,16,17,18,20,22,24,25,26,28,30,32,33,34,36,38,40,42,43,44,46,48,49,50,52,53,54,56,58,60,62,64,65,66,68,70,72,74,76,77,78,80,82,84,86,88,89,90,92,94,96];
  return <div className="qr" aria-label="Simulated unique QR code for Maria Santos">{blocks.map((n) => <i key={n} style={{ gridColumnStart: n % 10 + 1, gridRowStart: Math.floor(n / 10) + 1 }}></i>)}</div>;
}

const FONT_STEPS: FontSize[] = ["small", "default", "large"];
const FONT_LABELS: Record<FontSize, string> = { small: "Small", default: "Default", large: "Large" };

function FontSizeSlider({ fontSize, setFontSize, idSuffix = "" }: { fontSize: FontSize; setFontSize: (size: FontSize) => void; idSuffix?: string }) {
  const index = Math.max(0, FONT_STEPS.indexOf(fontSize));
  const labelId = `font-slider-label${idSuffix}`;
  return <div className="font-slider" aria-label="Text size">
    <span className="font-slider-cap font-slider-min" aria-hidden="true">A</span>
    <input type="range" min={0} max={FONT_STEPS.length - 1} step={1} value={index} aria-labelledby={labelId} aria-valuetext={FONT_LABELS[FONT_STEPS[index]]} onChange={(event) => setFontSize(FONT_STEPS[Number(event.target.value)])}/>
    <span className="font-slider-cap font-slider-max" aria-hidden="true">A</span>
    <span id={labelId} className="font-slider-value">{FONT_LABELS[FONT_STEPS[index]]}</span>
  </div>;
}

function ThemeTools({ theme, setTheme, fontSize, setFontSize }: { theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  return <div className="theme-tools"><button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}><Icon name={theme === "dark" ? "sun" : "moon"}/></button><FontSizeSlider fontSize={fontSize} setFontSize={setFontSize}/></div>;
}

const TEXT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

// AssistiveTouch-inspired floating Quick Settings control for the authenticated
// dashboards. Fixed circular button near the top-right; reveals a compact
// floating panel. Reuses the single app-wide theme + font-size state (no
// duplicate systems) and adds device-local reduced-motion + a notification
// preference toggle. The text size uses a draggable slider (FontSizeSlider).
function QuickSettings({ appearance }: { appearance: Appearance }) {
  const { theme, setTheme, fontSize, setFontSize, reducedMotion, setReducedMotion, notify, setNotify } = appearance;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = "quick-settings-panel";

  const close = () => { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); }, reducedMotion ? 0 : 140); };
  const toggle = () => { if (open) { close(); } else { setOpen(true); } };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); setClosing(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="quick-fab" ref={wrapRef}>
    <button ref={buttonRef} type="button" className={open ? "quick-fab-btn active" : "quick-fab-btn"} aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId} aria-label="Quick settings and appearance" onClick={toggle}>
      <span className="quick-fab-ring" aria-hidden="true"></span>
      <Icon name="sliders" size={20}/>
    </button>
    {open && <div className={closing ? "quick-panel closing" : "quick-panel"} id={panelId} role="dialog" aria-label="Quick settings" aria-modal="false">
      <div className="quick-panel-head"><strong>Quick settings</strong><button type="button" className="icon-btn quick-panel-close" onClick={() => { setOpen(false); setClosing(false); buttonRef.current?.focus(); }} aria-label="Close quick settings"><Icon name="close" size={16}/></button></div>

      <div className="quick-group" role="group" aria-label="Appearance">
        <span className="quick-group-label">Appearance</span>
        <div className="segmented quick-segmented">
          <button className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" size={16}/><span>Light</span></button>
          <button className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moon" size={16}/><span>Dark</span></button>
        </div>
      </div>

      <div className="quick-group" role="group" aria-label="Text size">
        <span className="quick-group-label">Text size</span>
        <FontSizeSlider fontSize={fontSize} setFontSize={setFontSize} idSuffix="-quick"/>
      </div>

      <div className="quick-group" role="group" aria-label="Quick controls">
        <span className="quick-group-label">Quick controls</span>
        <label className="quick-toggle"><span><strong>Reduced motion</strong><small>Limit animations and transitions</small></span><input type="checkbox" role="switch" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)}/></label>
        <label className="quick-toggle"><span><strong>Notifications</strong><small>Follow-up and alert reminders (demo)</small></span><input type="checkbox" role="switch" checked={notify} onChange={(event) => setNotify(event.target.checked)}/></label>
      </div>

      <p className="quick-note">Saved to this browser. Account details and role preferences stay in Profile &amp; Settings.</p>
    </div>}
  </div>;
}

// Connected-care flow visual for the landing hero. Communicates CareLink's
// purpose (Patient -> BHW -> Physician; Screening -> Referral -> Record) with a
// clean dashboard-style card instead of a decorative blob.
function CareFlowVisual() {
  const nodes: { icon: string; role: string; name: string; step: string; tone: Tone }[] = [
    { icon: "people", role: "Patient", name: "Maria Santos", step: "Screening", tone: "green" },
    { icon: "home", role: "Barangay Health Worker", name: "Ana Reyes", step: "Referral", tone: "teal" },
    { icon: "consult", role: "Physician", name: "Dr. Paolo Mendoza", step: "Health record", tone: "blue" },
  ];
  return <div className="care-flow" aria-hidden="true">
    <div className="care-flow-card">
      <div className="care-flow-head"><span className="care-flow-mark"><Icon name="network" size={18}/></span><div><strong>Connected care</strong><small>One patient, one coordinated journey</small></div><span className="care-flow-live"><i></i>Live demo</span></div>
      <ol className="care-flow-steps">
        {nodes.map((node, index) => <li key={node.role}>
          <span className={`care-flow-icon tone-${node.tone}`}><Icon name={node.icon} size={20}/></span>
          <span className="care-flow-text"><strong>{node.role}</strong><small>{node.name}</small></span>
          <span className={`badge badge-${node.tone}`}><i></i>{node.step}</span>
          {index < nodes.length - 1 && <span className="care-flow-link" aria-hidden="true"><Icon name="arrow" size={16}/></span>}
        </li>)}
      </ol>
      <div className="care-flow-foot"><Icon name="shield" size={15}/><span>Records open only with the patient's consent and a pairing-key check.</span></div>
    </div>
    <div className="care-flow-chip care-flow-chip-a"><Icon name="activity" size={15}/><span>Risk flagged early</span></div>
    <div className="care-flow-chip care-flow-chip-b"><Icon name="qr" size={15}/><span>Privacy-safe QR</span></div>
  </div>;
}

function Landing({ onGetStarted, onSignIn, theme, setTheme, fontSize, setFontSize }: { onGetStarted: () => void; onSignIn: () => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  return <main className="landing-page">
    <header className="landing-top"><Logo/><div className="landing-top-actions"><ThemeTools {...{ theme, setTheme, fontSize, setFontSize }}/><Button variant="secondary" onClick={onSignIn}>Sign in</Button></div></header>
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <Badge tone="teal">Care coordination for every barangay</Badge>
        <h1>Better health starts with <em>being connected.</em></h1>
        <p>CareLink brings community health screening, referrals, consultations, and personal health records into one trusted place, built for Filipino barangays and the people who serve them.</p>
        <div className="landing-cta"><Button icon="arrow" onClick={onGetStarted}>Get started</Button><Button variant="secondary" onClick={onSignIn}>Sign in</Button></div>
        <div className="landing-trust">
          <span><Icon name="check" size={15}/>Works offline for barangay staff</span>
          <span><Icon name="check" size={15}/>Consent-based record access</span>
        </div>
      </div>
      <div className="landing-hero-art"><CareFlowVisual/></div>
    </section>
    <section className="landing-features">
      {[["screening","Screen earlier","Barangay staff record check-ups and flag risk, even offline."],["referral","Coordinate referrals","Track a patient from the health center to the hospital and back."],["shield","Privacy by design","QR codes carry no personal data; records open only with consent."]].map(([icon, title, text]) => <Card key={title} className="landing-feature"><div className="landing-feature-icon"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></Card>)}
    </section>
    <section className="landing-note">
      <div className="prototype-note"><Icon name="shield"/><p><strong>Privacy-aligned demonstration (RA 10173 sandbox)</strong><br/>CareLink is a working prototype using fictional data. Authentication, data storage, screening rules, and audit logging run in demonstration mode and are not production services.</p></div>
    </section>
    <footer className="landing-footer"><span>CareLink · A screening and care-coordination aid, not a diagnostic system.</span><span>Demo data only · Intended timezone: Asia/Manila</span></footer>
  </main>;
}

const REG_OPTIONS: { kind: RegKind; icon: string; label: string; blurb: string }[] = [
  { kind: "patient", icon: "people", label: "Patient", blurb: "Keep your health card, screening results, prescriptions, and visit history in one place." },
  { kind: "staff", icon: "home", label: "Barangay Staff", blurb: "Barangay health workers who screen residents and coordinate referrals. Access is provided by an administrator." },
  { kind: "physician", icon: "consult", label: "Physician", blurb: "Licensed doctors who review records and issue prescriptions after PRC verification." },
];

function RoleSelect({ onPick, onBack, onSignIn, theme, setTheme, fontSize, setFontSize }: { onPick: (kind: RegKind) => void; onBack: () => void; onSignIn: () => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  return <main className="auth-page role-select-page">
    <div className="auth-top"><Logo/><ThemeTools {...{ theme, setTheme, fontSize, setFontSize }}/></div>
    <div className="role-select-layout">
      <div className="step-label">New to CareLink · Step 1 of 2</div>
      <h1>Which of the following best describes you?</h1>
      <p className="role-select-intro">Choose the option that fits you. You can change this later by signing out and starting again.</p>
      <div className="role-select-list">
        {REG_OPTIONS.map((option) => <button key={option.kind} className="role-select-card" onClick={() => onPick(option.kind)}><span className="role-select-icon"><Icon name={option.icon} size={24}/></span><span className="role-select-text"><strong>{option.label}</strong><small>{option.blurb}</small></span><Icon name="chevron"/></button>)}
      </div>
      <div className="role-select-foot"><Button variant="secondary" onClick={onBack}>Back</Button><span>Already have an account? <button type="button" className="text-button" onClick={onSignIn}>Sign in</button></span></div>
    </div>
    <footer className="auth-footer">CareLink · Demo data only · Intended timezone: Asia/Manila</footer>
  </main>;
}

function Login({ onLogin, onRegister, onRegisterPhysician, onBack, theme, setTheme, fontSize, setFontSize }: { onLogin: (role: Role) => void; onRegister: () => void; onRegisterPhysician: () => void; onBack: () => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>("citizen");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return setErrors(true);
    onLogin(selectedRole);
  };
  return <main className="auth-page">
    <div className="auth-top"><div className="auth-top-lead"><button type="button" className="icon-btn auth-back-btn" onClick={onBack} aria-label="Back to home"><Icon name="arrow" size={18}/></button><Logo/></div><ThemeTools {...{ theme, setTheme, fontSize, setFontSize }}/></div>
    <div className="auth-layout">
      <section className="auth-story">
        <Badge tone="teal">Care coordination for every barangay</Badge>
        <h1>Better health starts with <em>being connected.</em></h1>
        <p>One trusted place for screening, referrals, consultations, and personal health records—built for Filipino communities.</p>
        <div className="trust-row"><div><Icon name="shield"/><span><strong>Privacy first</strong><small>Access with consent</small></span></div><div><Icon name="home"/><span><strong>Community-led</strong><small>Closer to home</small></span></div></div>
        <div className="prototype-note"><Icon name="shield"/><p><strong>RA 10173 Privacy-Aligned Sandbox</strong><br/>Authentication and Data Storage — Demonstration Environment. Fictional data only; no production credentials are verified.</p></div>
      </section>
      <Card className="login-card">
        <div className="eyebrow">Welcome to CareLink</div><h2>Sign in to continue</h2><p>Select a role for this prototype demonstration.</p>
        <div className="role-grid">
          {(["citizen", "barangay_staff", "physician"] as Role[]).map((role) => <button key={role} className={selectedRole === role ? "role-option active" : "role-option"} onClick={() => setSelectedRole(role)}><Icon name={role === "citizen" ? "people" : role === "barangay_staff" ? "home" : "consult"}/><span>{roleMeta[role].label}</span>{selectedRole === role && <i><Icon name="check" size={13}/></i>}</button>)}
        </div>
        <p className="role-disclaimer">Role choice is a prototype navigation aid. Account permissions would be verified by the server.</p>
        <form onSubmit={submit}>
          <Field label="Email or username" placeholder="Enter your email or username" value={email} onChange={setEmail} error={errors && !email ? "Please enter your email or username." : undefined}/>
          <Field label="Password" error={errors && !password ? "Please enter your password." : undefined}><div className="password-wrap"><input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show or hide password"><Icon name="eye"/></button></div></Field>
          <div className="form-meta"><label><input type="checkbox"/> Remember me</label><button type="button" className="text-button" onClick={() => alert("Password recovery is simulated in this prototype.")}>Forgot password?</button></div>
          <Button type="submit" className="full">Sign in securely</Button>
        </form>
        <div className="register-links"><span>New to CareLink?</span><button onClick={onRegister}>Get started</button><span className="register-sep" aria-hidden="true">·</span><button onClick={onRegisterPhysician}>Register as a physician</button></div>
      </Card>
    </div>
    <footer className="auth-footer">CareLink · Demo data only · Intended timezone: Asia/Manila</footer>
  </main>;
}

const REG_TITLES: Record<RegKind, string> = { patient: "Create your patient account", staff: "Barangay Staff access", physician: "Apply as a physician" };

function Registration({ kind, onBack, onChangeRole }: { kind: RegKind; onBack: () => void; onChangeRole: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [prc, setPrc] = useState("");
  const [fileName, setFileName] = useState("");
  const nameOk = !!name.trim();
  const patientOk = nameOk && !!birthday;
  const physicianOk = nameOk && !!email.trim() && !!prc.trim();
  const [specialty, setSpecialty] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (kind === "patient" && patientOk) setSubmitted(true);
    if (kind === "physician" && physicianOk) {
      // Record a NEW application as strictly Pending with unverified documents.
      // Nothing here marks it Approved/Verified — only an admin decision can.
      const seq = String(physicianApplicationStore.getSnapshot().length + 20).padStart(3, "0");
      physicianApplicationStore.add({
        id: `DOC-2025-${seq}`,
        name: name.trim().startsWith("Dr. ") ? name.trim() : `Dr. ${name.trim()}`,
        email: email.trim(),
        prc: prc.trim(),
        prcStatus: "Submitted",
        docs: fileName ? "Submitted" : "Missing",
        date: new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Manila" }),
        status: "Pending",
      });
      setSubmitted(true);
    }
  };

  const header = <div className="form-page-head"><Logo/><button className="text-button" onClick={onBack}><Icon name="arrow" size={16}/><span>Back</span></button></div>;

  // Barangay Staff: invitation / seeded-account only — no public self-registration.
  if (kind === "staff") {
    return <main className="form-page">{header}<Card className="registration-card staff-invite-card">
      <div className="success-icon info"><Icon name="shield" size={28}/></div>
      <div className="step-label">New to CareLink · Step 2 of 2</div>
      <h1>Barangay Staff access is by invitation</h1>
      <p>Barangay health worker accounts are created and authorized by a CareLink administrator and bound to a single barangay. There is no public self-registration for staff.</p>
      <div className="info-steps">
        <div className="info-step"><span>1</span><div><strong>Ask your administrator</strong><small>Your Rural Health Unit or city health office requests an account for you.</small></div></div>
        <div className="info-step"><span>2</span><div><strong>Account is seeded</strong><small>An administrator seeds your account and assigns your barangay.</small></div></div>
        <div className="info-step"><span>3</span><div><strong>Sign in</strong><small>You receive a one-time activation and can sign in.</small></div></div>
      </div>
      <div className="notice"><Icon name="shield"/><span>This prototype does not create staff accounts. Contact an authorized administrator for access.</span></div>
      <div className="form-actions"><Button variant="secondary" onClick={onChangeRole}>Choose a different role</Button><Button onClick={onBack}>Back to home</Button></div>
    </Card></main>;
  }

  if (submitted) {
    const firstName = name.trim().split(" ")[0] || "there";
    return <main className="center-page"><Card className="success-card">
      <div className="success-icon"><Icon name="check" size={28}/></div>
      <Badge tone="amber">{kind === "physician" ? "Pending Admin PRC Verification" : "Pending verification"}</Badge>
      <h1>Thank you, {firstName}.</h1>
      <p>{kind === "patient"
        ? "Your account request was received. Please visit your Barangay Health Center with a valid ID so a Barangay Health Worker can verify your information in person."
        : "Your physician application was received. A CareLink administrator will verify your PRC license and supporting documents before your account is activated."}</p>
      <div className="notice"><Icon name="shield"/><span>No account has been automatically authorized. This is a simulated registration state and is not saved to a real database.</span></div>
      <div className="form-actions center"><Button onClick={onBack}>Return to home</Button></div>
    </Card></main>;
  }

  return <main className="form-page">{header}<Card className="registration-card">
    <div className="step-label">New to CareLink · Step 2 of 2 · <button type="button" className="text-button inline-link" onClick={onChangeRole}>Change role</button></div>
    <h1>{REG_TITLES[kind]}</h1>
    <p>{kind === "patient"
      ? "Tell us about yourself. A Barangay Health Worker will verify your identity in person before your account is active."
      : "Submit your professional details and PRC credentials. An administrator verifies them before activation."}</p>
    <form onSubmit={submit} className="form-grid" noValidate>
      <Field label="Full name *" placeholder="First, middle, and last name" value={name} onChange={setName} error={attempted && !nameOk ? "Please enter your full name." : undefined}/>
      {kind === "patient" ? <>
        <Field label="Sex *"><select defaultValue=""><option value="" disabled>Select sex</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></Field>
        <Field label="Date of birth *" type="date" value={birthday} onChange={setBirthday} error={attempted && !birthday ? "Please select your date of birth." : undefined}/>
        <Field label="Email or contact number *" placeholder="name@carelink.demo or 09XX XXX XXXX" value={email} onChange={setEmail}/>
        <Field label="Password *" type="password" placeholder="At least 8 characters"/>
        <Field label="Confirm password *" type="password" placeholder="Enter password again"/>
      </> : <>
        <Field label="Email *" type="email" placeholder="name@carelink.demo" value={email} onChange={setEmail} error={attempted && !email.trim() ? "Please enter your email." : undefined}/>
        <Field label="PRC license number *" placeholder="e.g. 0123456" value={prc} onChange={setPrc} error={attempted && !prc.trim() ? "Please enter your PRC license number." : undefined}/>
        <Field label="Medical specialty"><select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="" disabled>Select specialty</option><option>General / Family Medicine</option><option>Internal Medicine</option><option>Pediatrics</option><option>Obstetrics & Gynecology</option><option>Cardiology</option><option>Other</option></select></Field>
        <Field label="Affiliated facility" placeholder="e.g. San Isidro District Hospital"/>
        <Field label="Supporting credentials"><label className="file-field"><input type="file" className="sr-only" onChange={(event) => setFileName(event.target.files && event.target.files[0] ? event.target.files[0].name : "")}/><span className="file-field-btn"><Icon name="download" size={16}/>Upload document</span><span className="file-field-name">{fileName || "PRC ID or certificate (PDF, JPG, PNG)"}</span></label></Field>
        <Field label="Password *" type="password" placeholder="At least 8 characters"/>
        <Field label="Confirm password *" type="password" placeholder="Enter password again"/>
      </>}
      <label className="consent full-span"><input type="checkbox"/><span>I understand that this prototype uses mock data. In a real service, my information would be handled according to applicable privacy requirements (Data Privacy Act of 2012).</span></label>
      <div className="full-span form-actions"><Button variant="secondary" onClick={onChangeRole}>Back</Button><Button type="submit">{kind === "physician" ? "Submit application" : "Submit account request"}</Button></div>
    </form>
  </Card></main>;
}

function Stat({ label, value, detail, icon, tone = "blue" }: { label: string; value: string; detail: string; icon: string; tone?: Tone }) {
  return <Card className="stat"><div className={`stat-icon stat-${tone}`}><Icon name={icon}/></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></Card>;
}

function PageHead({ eyebrow, title, text, actions }: { eyebrow?: string; title: string; text?: string; actions?: ReactNode }) {
  return <header className="page-head"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{text && <p>{text}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

function StaffDashboard({ go }: { go: (screen: string) => void }) {
  return <><PageHead eyebrow="Wednesday, 25 June 2025" title="Good morning, Ana." text="Here’s what needs your attention in Barangay Maligaya today." actions={<Button icon="plus" onClick={() => go("add-patient")}>Add resident</Button>}/>
    <div className="stats-grid"><Stat label="Registered residents" value="1,284" detail="+18 this month" icon="people"/><Stat label="Verified patients" value="1,107" detail="86% of residents" icon="shield" tone="green"/><Stat label="Pending verification" value="23" detail="5 added this week" icon="record" tone="amber"/><Stat label="Needs follow-up" value="14" detail="4 home visits due" icon="referral" tone="red"/></div>
    <div className="dashboard-grid">
      <Card><div className="card-head"><div><h2>Today’s priorities</h2><p>Tasks that need action</p></div><Badge tone="red">7 due today</Badge></div>
        <div className="task-list">{[
          ["Verify new residents", "5 waiting for in-person verification", "people", "masterlist"],
          ["Complete home visits", "4 missed follow-ups need a visit", "home", "referrals"],
          ["Review referral updates", "2 patients were marked Seen", "referral", "referrals"],
        ].map(([title, detail, icon, target]) => <button key={title} onClick={() => go(target)}><span className="task-icon"><Icon name={icon}/></span><span><strong>{title}</strong><small>{detail}</small></span><Icon name="chevron"/></button>)}</div>
      </Card>
      <Card><div className="card-head"><div><h2>Screening summary</h2><p>June 2025 · 148 completed</p></div><button className="text-button" onClick={() => go("reports")}>View report</button></div>
        <div className="screen-summary"><div><span style={{width:"62%"}}></span><b>92</b><small>Normal</small></div><div><span style={{width:"24%"}}></span><b>36</b><small>Monitor</small></div><div><span style={{width:"14%"}}></span><b>20</b><small>Needs Referral</small></div></div>
        <div className="chart-note"><Icon name="chart"/><span><strong>78% household coverage</strong><small>312 of 400 households screened this month</small></span></div>
      </Card>
    </div>
    <Card><div className="card-head"><div><h2>Referral follow-up</h2><p>Patients with active referrals in your barangay</p></div><Button variant="secondary" onClick={() => go("referrals")}>View all referrals</Button></div><div className="mini-table"><div className="table-row table-header"><span>Patient</span><span>Destination</span><span>Sent</span><span>Status</span><span>Next action</span></div>{[
      ["Rogelio Dela Cruz", "San Isidro District Hospital", "17 Jun", "Received", "Check by 28 Jun"],
      ["Elena Villanueva", "RHU Cardiology Clinic", "12 Jun", "Follow-up Set", "Visit on 27 Jun"],
      ["Arturo Garcia", "San Isidro District Hospital", "09 Jun", "Seen", "Awaiting note"],
    ].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, i) => <span key={cell}>{i === 3 ? <Badge tone={cell === "Received" ? "blue" : "teal"}>{cell}</Badge> : cell}</span>)}</div>)}</div></Card>
  </>;
}

type Household = { id: string; purok: string; members: number; followUp: "Needs home visit" | "Follow-up scheduled" | "Up to date" };
const HOUSEHOLDS: Household[] = [
  { id: "HH-014", purok: "Purok 1", members: 4, followUp: "Up to date" },
  { id: "HH-058", purok: "Purok 2", members: 6, followUp: "Needs home visit" },
  { id: "HH-092", purok: "Purok 3", members: 3, followUp: "Follow-up scheduled" },
];
const followUpTone = (status: Household["followUp"]): Tone => status === "Needs home visit" ? "red" : status === "Follow-up scheduled" ? "amber" : "green";

function Households({ go }: { go: (screen: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  useEffect(() => { const t = window.setTimeout(() => setLoading(false), 500); return () => window.clearTimeout(t); }, []);
  const matches = HOUSEHOLDS.filter((h) => (h.id + h.purok).toLowerCase().includes(query.toLowerCase()));
  const puroks = [...new Set(matches.map((h) => h.purok))].sort();

  return <><PageHead eyebrow="Barangay Maligaya only" title="Households" text="Residents grouped by household and purok. Fictional demonstration data." actions={<Button icon="plus" onClick={() => go("add-patient")}>Add resident</Button>}/>
    <Card><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Search household ID or purok" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search households"/></label></div>

    {loading ? <div className="household-groups" aria-busy="true"><div className="household-group"><div className="household-group-head"><span className="skeleton-pill"></span></div><div className="household-cards">{[0,1].map((n) => <div key={n} className="household-card skeleton"><span className="skeleton-line w60"></span><span className="skeleton-line w40"></span><span className="skeleton-line w80"></span></div>)}</div></div></div>
    : !matches.length ? <div className="empty"><Icon name="home" size={28}/><h3>No households found</h3><p>No households match this search. Try another household ID or purok.</p>{query && <Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button>}</div>
    : <div className="household-groups">{puroks.map((purok) => <section key={purok} className="household-group">
        <div className="household-group-head"><h2>{purok}</h2><Badge tone="gray">{matches.filter((h) => h.purok === purok).length} households</Badge></div>
        <div className="household-cards">{matches.filter((h) => h.purok === purok).map((h) => <Card key={h.id} className="household-card">
          <div className="household-card-head"><div className="household-id"><span className="household-id-mark"><Icon name="home" size={18}/></span><div><strong>{h.id}</strong><small>{h.purok}</small></div></div><Badge tone={followUpTone(h.followUp)}>{h.followUp}</Badge></div>
          <dl className="household-meta"><div><dt>Members</dt><dd>{h.members}</dd></div><div><dt>Follow-up</dt><dd>{h.followUp}</dd></div></dl>
          <Button variant="secondary" className="full" icon="people" onClick={() => go("masterlist")}>View household</Button>
        </Card>)}</div>
      </section>)}</div>}
    </Card></>;
}

function Masterlist({ go }: { go: (screen: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [screeningFilter, setScreeningFilter] = useState("All");
  const [householdFilter, setHouseholdFilter] = useState("All");
  const filtered = patients.filter((patient) =>
    (patient.name + patient.code).toLowerCase().includes(query.toLowerCase())
    && (filter === "All" || patient.status === filter)
    && (screeningFilter === "All" || patient.screening === screeningFilter)
    && (householdFilter === "All" || patient.household.includes(householdFilter))
  );
  const filtersActive = query.trim() !== "" || filter !== "All" || screeningFilter !== "All" || householdFilter !== "All";
  const clearFilters = () => { setQuery(""); setFilter("All"); setScreeningFilter("All"); setHouseholdFilter("All"); };
  return <><PageHead eyebrow="Barangay Maligaya only" title="Patient masterlist" text="Search, verify, and manage residents assigned to your barangay." actions={<><Button variant="secondary" icon="download" onClick={() => alert("CSV export simulated. In production, this action would require confirmation and be audit-logged.")}>Export</Button><Button icon="plus" onClick={() => go("add-patient")}>Add resident</Button></>}/>
    <Card><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Search name or patient code" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search name or patient code"/></label><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter by verification status"><option value="All">All verification</option><option value="Verified">Verified</option><option value="Pending">Pending</option></select><select value={screeningFilter} onChange={(event) => setScreeningFilter(event.target.value)} aria-label="Filter by screening outcome"><option value="All">All screening outcomes</option><option value="Normal">Normal</option><option value="Monitor">Monitor</option><option value="Needs Referral">Needs Referral</option></select><select value={householdFilter} onChange={(event) => setHouseholdFilter(event.target.value)} aria-label="Filter by household purok"><option value="All">All households</option><option value="Purok 1">Purok 1</option><option value="Purok 2">Purok 2</option><option value="Purok 3">Purok 3</option></select></div>
      {filtersActive && <div className="filter-summary"><span>Showing <strong>{filtered.length}</strong> of {patients.length} residents</span><button type="button" className="text-button" onClick={clearFilters}>Clear filters</button></div>}
      <div className="patient-table"><div className="table-row table-header"><span>Patient</span><span>Household</span><span>Verification</span><span>Screening</span><span>Last visit</span><span></span></div>{filtered.map((patient) => <button className="table-row patient-row" onClick={() => go("patient-profile")} key={patient.code}><span className="patient-name"><i>{patient.name.split(" ").map((n) => n[0]).slice(0,2)}</i><b>{patient.name}<small>{patient.code}</small></b></span><span>{patient.household}</span><span><Badge tone={patient.status === "Verified" ? "green" : "amber"}>{patient.status}</Badge></span><span><Badge tone={patient.screening === "Normal" ? "green" : patient.screening === "Monitor" ? "amber" : "red"}>{patient.screening}</Badge></span><span>{patient.visit}</span><span><Icon name="chevron"/></span></button>)}</div>
      {!filtered.length && <div className="empty"><Icon name="search" size={28}/><h3>No residents found</h3><p>No residents match the current search and filters.</p>{filtersActive && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}</div>}
    </Card></>;
}

function PatientProfile({ go }: { go: (screen: string) => void }) {
  const [verify, setVerify] = useState(false);
  const [verified, setVerified] = useState(false);
  return <><PageHead eyebrow="Patient profile · Barangay-scoped record" title="Rogelio Dela Cruz" text="CL-2025-0917 · HH-058 · Purok 2" actions={<><Button variant="secondary" icon="qr" onClick={() => go("id-cards")}>Patient ID</Button><Button icon="screening" onClick={() => go("screening")}>New screening</Button></>}/>
    <div className="profile-grid"><Card className="profile-card"><div className="profile-avatar">RD</div><h2>Rogelio Dela Cruz</h2><Badge tone={verified ? "green" : "amber"}>{verified ? "Verified" : "Pending verification"}</Badge><dl><div><dt>Patient code</dt><dd>CL-2025-0917</dd></div><div><dt>Household</dt><dd>HH-058 · Purok 2</dd></div><div><dt>Registered</dt><dd>16 June 2025</dd></div><div><dt>Contact</dt><dd>09•• ••• 1204</dd></div></dl>{!verified && <Button className="full" onClick={() => setVerify(true)}>Verify resident</Button>}</Card>
      <div className="profile-main"><Card><div className="card-head"><div><h2>Care overview</h2><p>Information available to Barangay Health Workers</p></div></div><div className="overview-strip"><div><span>Latest screening</span><Badge tone="red">Needs Referral</Badge></div><div><span>Active referral</span><strong>San Isidro District Hospital</strong></div><div><span>Next follow-up</span><strong>28 June 2025</strong></div></div></Card>
      <Card><div className="card-head"><div><h2>Recent activity</h2><p>Clinical notes are not shown to Barangay Health Workers</p></div></div><div className="timeline"><div><i></i><span><Badge tone="blue">Referral sent</Badge><strong>San Isidro District Hospital</strong><small>17 June 2025 · Follow up by 28 June</small></span></div><div><i></i><span><Badge tone="red">Needs Referral</Badge><strong>Health screening recorded</strong><small>17 June 2025 · Recorded by Ana Reyes, BHW</small></span></div><div><i></i><span><Badge tone="gray">Registered</Badge><strong>Self-registration received</strong><small>16 June 2025</small></span></div></div></Card></div></div>
    {verify && <Modal title="Verify this resident?" onClose={() => setVerify(false)} actions={<><Button variant="secondary" onClick={() => setVerify(false)}>Cancel</Button><Button onClick={() => {setVerified(true); setVerify(false)}}>Confirm verification</Button></>}><div className="confirm-identity"><Icon name="shield" size={28}/><p>Confirm that you checked Rogelio Dela Cruz’s identity in person and that the registration details match the presented documents.</p></div></Modal>}
  </>;
}

type ScreeningOutcome = "Normal" | "Monitor" | "Needs Referral" | "Review Required";
const OUTCOME_META: Record<ScreeningOutcome, { tone: Tone; icon: string; headline: string; blurb: string }> = {
  "Normal": { tone: "green", icon: "check", headline: "Continue routine care", blurb: "No demonstration threshold was triggered." },
  "Monitor": { tone: "amber", icon: "screening", headline: "Monitoring is recommended", blurb: "Review again at the next visit." },
  "Needs Referral": { tone: "red", icon: "referral", headline: "A referral is recommended", blurb: "Continue to the referral workflow." },
  "Review Required": { tone: "gray", icon: "record", headline: "Review required", blurb: "Readings are incomplete or fall outside the demonstration bands. A BHW should review before saving." },
};
const OUTCOME_RANK: Record<ScreeningOutcome, number> = { "Normal": 0, "Review Required": 1, "Monitor": 2, "Needs Referral": 3 };

// Parses a numeric vital. Returns a number, "missing" (blank), or "invalid" (malformed/implausible).
function parseVital(raw: string, lo: number, hi: number): number | "missing" | "invalid" {
  const text = raw.trim();
  if (!text) return "missing";
  if (!/^\d{1,3}$/.test(text)) return "invalid";
  const value = Number(text);
  if (value < lo || value > hi) return "invalid";
  return value;
}

type ScreeningInputs = { systolic: string; diastolic: string; sugar: string; concern: boolean };
function computeScreening({ systolic, diastolic, sugar, concern }: ScreeningInputs): { outcome: ScreeningOutcome; reasons: string[] } {
  const sys = parseVital(systolic, 60, 300);
  const dia = parseVital(diastolic, 30, 200);
  const bs = parseVital(sugar, 20, 800);
  const reasons: string[] = [];
  const triggered: ScreeningOutcome[] = [];

  // Needs Referral (most urgent)
  if (typeof sys === "number" && sys >= 180) { reasons.push(`Systolic ${sys} mmHg is at or above 180.`); triggered.push("Needs Referral"); }
  if (typeof dia === "number" && dia >= 120) { reasons.push(`Diastolic ${dia} mmHg is at or above 120.`); triggered.push("Needs Referral"); }
  if (typeof bs === "number" && bs >= 200) { reasons.push(`Blood sugar ${bs} mg/dL is at or above 200.`); triggered.push("Needs Referral"); }
  if (concern) { reasons.push("A concern was reported."); triggered.push("Needs Referral"); }

  // Monitor
  if (typeof sys === "number" && sys >= 140 && sys <= 179) { reasons.push(`Systolic ${sys} mmHg is in the 140–179 monitor range.`); triggered.push("Monitor"); }
  if (typeof dia === "number" && dia >= 90 && dia <= 119) { reasons.push(`Diastolic ${dia} mmHg is in the 90–119 monitor range.`); triggered.push("Monitor"); }
  if (typeof bs === "number" && bs >= 140 && bs <= 199) { reasons.push(`Blood sugar ${bs} mg/dL is in the 140–199 monitor range.`); triggered.push("Monitor"); }

  // Incomplete / malformed / implausible → Review Required (never assume Normal)
  const fields: [string, number | "missing" | "invalid"][] = [["Systolic blood pressure", sys], ["Diastolic blood pressure", dia], ["Blood sugar", bs]];
  for (const [label, parsed] of fields) {
    if (parsed === "missing") { reasons.push(`${label} is missing.`); triggered.push("Review Required"); }
    else if (parsed === "invalid") { reasons.push(`${label} is not a plausible value.`); triggered.push("Review Required"); }
  }

  // Threshold gaps: values that fall between the Normal ceiling and the Monitor floor.
  if (typeof sys === "number" && sys >= 130 && sys <= 139) { reasons.push(`Systolic ${sys} mmHg falls in the 130–139 gap between Normal and Monitor.`); triggered.push("Review Required"); }
  if (typeof dia === "number" && dia >= 85 && dia <= 89) { reasons.push(`Diastolic ${dia} mmHg falls in the 85–89 gap between Normal and Monitor.`); triggered.push("Review Required"); }

  if (!triggered.length) {
    // All three present, valid, and in the Normal band (BP below 130/85, sugar below 140).
    return { outcome: "Normal", reasons: ["Blood pressure is below 130/85, blood sugar is below 140 mg/dL, and no concern was reported."] };
  }
  const outcome = triggered.reduce<ScreeningOutcome>((worst, next) => OUTCOME_RANK[next] > OUTCOME_RANK[worst] ? next : worst, triggered[0]);
  return { outcome, reasons };
}

function Screening({ go }: { go: (screen: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sugar, setSugar] = useState("");
  const [concern, setConcern] = useState(false);
  const { outcome, reasons } = computeScreening({ systolic, diastolic, sugar, concern });
  const meta = OUTCOME_META[outcome];
  const canSave = outcome !== "Review Required";

  if (saved) return <><PageHead title="Screening saved" text="A demonstration screening result has been recorded for Rogelio Dela Cruz."/><Card className="result-card"><div className={`result-orb ${meta.tone === "gray" ? "" : meta.tone}`}><Icon name={meta.icon} size={32}/></div><Badge tone={meta.tone}>{outcome}</Badge><h2>{meta.headline}</h2><p>This is a demonstration screening and care-coordination outcome, not a diagnosis. Thresholds are prototype rules, not validated DOH or WHO clinical guidance.</p><div className="form-actions center"><Button variant="secondary" onClick={() => {setSaved(false); go("masterlist")}}>Return to masterlist</Button>{outcome === "Needs Referral" && <Button icon="referral" onClick={() => go("referrals")}>Create referral</Button>}</div></Card></>;

  return <><PageHead eyebrow="Demo screening" title="New health screening" text="Record observations. The demonstration outcome is calculated automatically for review; CareLink does not provide a diagnosis."/>
    <div className="screening-layout"><Card><h2>Resident and visit</h2><div className="form-grid"><Field label="Patient"><select><option>Rogelio Dela Cruz · CL-2025-0917</option><option>Maria Santos · CL-2025-0842</option></select></Field><Field label="Screening date" type="date" value="2025-06-25"/><Field label="Screening category"><select><option>Routine community screening</option><option>Follow-up screening</option></select></Field><Field label="Recorded by" value="Ana Reyes, BHW" /></div></Card>
    <Card><h2>Observations</h2><p className="section-copy">Enter demonstration readings. The outcome below recalculates as you type. Thresholds are prototype rules, not validated clinical guidance.</p>
      <div className="form-grid thirds">
        <Field label="Systolic BP (mmHg)" type="text" value={systolic} onChange={setSystolic} error={systolic.trim() && parseVital(systolic, 60, 300) === "invalid" ? "Enter a plausible value (60–300)." : undefined}/>
        <Field label="Diastolic BP (mmHg)" type="text" value={diastolic} onChange={setDiastolic} error={diastolic.trim() && parseVital(diastolic, 30, 200) === "invalid" ? "Enter a plausible value (30–200)." : undefined}/>
        <Field label="Blood sugar (mg/dL)" type="text" value={sugar} onChange={setSugar} error={sugar.trim() && parseVital(sugar, 20, 800) === "invalid" ? "Enter a plausible value (20–800)." : undefined}/>
      </div>
      <label className="toggle-row"><input type="checkbox" checked={concern} onChange={(event) => setConcern(event.target.checked)}/><span>Concern reported by patient or BHW</span></label>
    </Card>
    <Card className="outcome-card"><div className="card-head"><div><h2>Calculated outcome</h2><p className="section-copy">Deterministic Screening Rules — Demonstration. Illustrative screening categories, not a diagnosis or validated clinical rule set.</p></div><Badge tone={meta.tone}>{outcome}</Badge></div>
      <div className="outcome-options" role="group" aria-label="Demonstration screening outcome">{(["Normal","Monitor","Needs Referral","Review Required"] as ScreeningOutcome[]).map((item) => <div key={item} className={outcome === item ? "outcome-pill active" : "outcome-pill"} aria-current={outcome === item ? "true" : undefined}><Badge tone={OUTCOME_META[item].tone}>{item}</Badge><small>{OUTCOME_META[item].blurb}</small></div>)}</div>
      <div className={`outcome-reason tone-${meta.tone}`} role="status" aria-live="polite"><Icon name={meta.icon} size={18}/><div><strong>{meta.headline}</strong><ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div></div>
      <dl className="reading-recap"><div><dt>Blood pressure</dt><dd>{systolic.trim() || "—"} / {diastolic.trim() || "—"} mmHg</dd></div><div><dt>Blood sugar</dt><dd>{sugar.trim() ? `${sugar.trim()} mg/dL` : "—"}</dd></div><div><dt>Concern reported</dt><dd>{concern ? "Yes" : "No"}</dd></div></dl>
      {!canSave && <div className="notice"><Icon name="shield"/><span>Resolve the items above before saving. Incomplete or out-of-band readings are not auto-classified as Normal.</span></div>}
      <div className="form-actions"><Button variant="secondary" onClick={() => go("masterlist")}>Cancel</Button><Button disabled={!canSave} onClick={() => setSaved(true)}>Review &amp; save screening</Button></div>
    </Card></div></>;
}

function ReferralPage() {
  const statuses = ["Sent", "Received", "Seen", "Follow-up Set", "Closed"];
  return <><PageHead title="Referrals" text="Track referrals from Barangay Maligaya through follow-up." actions={<Button icon="plus">Create referral</Button>}/><Card><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Search patient or destination"/></label><select><option>All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select></div><div className="referral-cards">{[
    ["Rogelio Dela Cruz","San Isidro District Hospital","Received","17 June 2025","28 June 2025"],
    ["Elena Villanueva","RHU Cardiology Clinic","Follow-up Set","12 June 2025","27 June 2025"],
  ].map((r) => <article key={r[0]}><div className="referral-head"><div><h3>{r[0]}</h3><p>{r[1]}</p></div><Badge tone={r[2] === "Received" ? "blue" : "teal"}>{r[2]}</Badge></div><div className="referral-meta"><span>Sent <strong>{r[3]}</strong></span><span>Follow-up <strong>{r[4]}</strong></span><span>Category <strong>Further assessment</strong></span></div><div className="stepper">{statuses.map((s, i) => <span className={i <= statuses.indexOf(r[2]) ? "done" : ""} key={s}><i>{i < statuses.indexOf(r[2]) ? <Icon name="check" size={12}/> : i + 1}</i><small>{s}</small></span>)}</div></article>)}</div></Card></>;
}

function HealthCard({ consentFlow = false }: { consentFlow?: boolean }) {
  const [consent, setConsent] = useState<"idle" | "request" | "granted" | "denied">("idle");
  return <><PageHead title={consentFlow ? "My Health Card" : "QR / Patient ID"} text={consentFlow ? "Your personal CareLink identity. Keep your QR private." : "Preview and print privacy-safe patient identification cards."} actions={<><Button variant="secondary" icon="printer" onClick={() => window.print()}>Print card</Button><Button icon="download" onClick={() => alert("Download simulation complete. No real credential was generated.")}>Download</Button></>}/>
    <div className="id-layout"><div className="id-card"><div className="id-brand"><Logo/><Badge tone="green">Verified</Badge></div><div className="id-content"><div><span>Patient name</span><h2>Maria Santos</h2><span>Patient code</span><strong>CL-2025-0842</strong><small>Present this card to authorized CareLink personnel.</small></div><QRCode/></div></div>
    <Card className="privacy-card"><Icon name="shield" size={28}/><h2>Your QR protects your privacy</h2><ul><li>Each patient has a distinct demo QR identity.</li><li>The QR contains no personal or medical information.</li><li>Scanning alone never opens a health record.</li></ul>{consentFlow && <Button className="full" icon="qr" onClick={() => setConsent("request")}>Simulate QR scan</Button>}</Card></div>
    {consent === "request" && <Modal title="Your confirmation is required" onClose={() => setConsent("idle")} actions={<><Button variant="secondary" onClick={() => setConsent("denied")}>Deny access</Button><Button onClick={() => setConsent("granted")}>Allow this access</Button></>}><div className="access-request"><Badge tone="blue">Patient confirmation required</Badge><h3>Dr. Paolo Mendoza</h3><p>San Isidro District Hospital is requesting access to your screening history, visit history, referrals, and current prescriptions for today’s consultation.</p><div className="notice"><Icon name="shield"/><span>Access is limited to this authorized care event and would be recorded in your access history.</span></div></div></Modal>}
    {(consent === "granted" || consent === "denied") && <div className={`toast ${consent}`}><Icon name={consent === "granted" ? "check" : "close"}/><span><strong>{consent === "granted" ? "Access granted" : "Access denied"}</strong><small>{consent === "granted" ? "Authorized record preview is available for this simulated session." : "No health information was shared."}</small></span><button onClick={() => setConsent("idle")}><Icon name="close"/></button></div>}
  </>;
}

function PatientHome({ go }: { go: (screen: string) => void }) {
  return <><div className="welcome-banner"><div><Badge tone="green">Account verified</Badge><h1>Good morning, Maria.</h1><p>Here’s a simple view of your current care information.</p></div><div className="welcome-mark"><Icon name="shield" size={34}/></div></div>
    <div className="patient-summary"><Card><span>Latest screening</span><Badge tone="amber">Monitor</Badge><strong>18 June 2025</strong><small>Review again at your next health center visit.</small></Card><Card><span>Next follow-up</span><Badge tone="blue">Scheduled</Badge><strong>27 June 2025</strong><small>Barangay Maligaya Health Center · 9:00 AM</small></Card><Card><span>Latest prescription</span><Badge tone="green">Active</Badge><strong>Issued 20 June 2025</strong><small>Dr. Paolo Mendoza · 1 medicine</small></Card></div>
    <div className="dashboard-grid"><Card><div className="card-head"><div><h2>What you need to know</h2><p>Important instructions from your care team</p></div></div><div className="instruction"><span><Icon name="note"/></span><div><strong>Continue your daily health log</strong><p>Bring your written log to your follow-up visit on 27 June. If you feel unwell, contact your health center.</p><small>From Dr. Paolo Mendoza · 20 June 2025</small></div></div><Button variant="secondary" onClick={() => go("notes")}>View doctor instructions</Button></Card>
    <Card><div className="card-head"><div><h2>Quick access</h2><p>Your most-used CareLink services</p></div></div><div className="quick-grid"><button onClick={() => go("card")}><Icon name="qr"/><span>My personal QR</span></button><button onClick={() => go("prescriptions")}><Icon name="rx"/><span>Prescription</span></button><button onClick={() => go("record")}><Icon name="record"/><span>Medical record</span></button><button onClick={() => go("access")}><Icon name="shield"/><span>Who viewed my record</span></button></div></Card></div>
    <div className="disclaimer"><Icon name="screening"/><p><strong>CareLink supports screening and care coordination.</strong> Screening outcomes are not a medical diagnosis. Speak with an authorized healthcare professional about health concerns.</p></div>
  </>;
}

function Prescription({ doctor = false }: { doctor?: boolean }) {
  const [issued, setIssued] = useState(!doctor);
  const [confirm, setConfirm] = useState(false);
  if (doctor && !issued) return <><PageHead eyebrow="Demo · Controlled medicines are not supported" title="Create e-prescription" text="Add up to 20 medicine lines. Issued prescriptions cannot be edited."/><Card className="rx-form"><div className="form-grid"><Field label="Patient" value="Maria Santos · CL-2025-0842"/><Field label="Valid until" type="date" value="2025-07-20"/></div><h2>Medicine 1</h2><div className="form-grid thirds"><Field label="Generic name *" value="Amlodipine"/><Field label="Strength *" value="5 mg"/><Field label="Form *" value="Tablet"/><Field label="Dose *" value="1 tablet"/><Field label="Frequency *" value="Once daily"/><Field label="Duration *" value="30 days"/><Field label="Quantity *" value="30 tablets"/><Field label="Directions" value="Take after breakfast"/></div><Field label="Prescription notes" placeholder="Optional patient instructions"/><div className="form-actions spread"><Button variant="secondary" icon="plus">Add medicine</Button><span><Button variant="secondary">Preview</Button><Button onClick={() => setConfirm(true)}>Issue prescription</Button></span></div></Card>{confirm && <Modal title="Issue this prescription?" onClose={() => setConfirm(false)} actions={<><Button variant="secondary" onClick={() => setConfirm(false)}>Review again</Button><Button onClick={() => {setConfirm(false);setIssued(true)}}>Confirm and issue</Button></>}><p>Once issued, this prescription becomes read-only. Corrections require cancellation and reissuance.</p></Modal>}</>;
  return <><PageHead eyebrow="Demo e-prescription · View or print only" title={doctor ? "Prescription issued" : "My e-prescription"} text={doctor ? "This prescription is now read-only." : "Issued by Dr. Paolo Mendoza on 20 June 2025."} actions={<Button icon="printer" onClick={() => window.print()}>Print preview</Button>}/><Card className="prescription"><div className="rx-head"><Logo/><div><strong>E-PRESCRIPTION</strong><small>DEMO · Not for production use</small></div></div><div className="rx-patient"><div><span>Patient</span><strong>Maria Santos</strong><small>CL-2025-0842</small></div><div><span>Date issued</span><strong>20 June 2025</strong><small>Valid until 20 July 2025</small></div></div><div className="rx-symbol">℞</div><div className="medicine"><div><h2>Amlodipine</h2><Badge tone="blue">Generic name</Badge></div><strong>5 mg · Tablet</strong><dl><div><dt>Dose</dt><dd>1 tablet</dd></div><div><dt>Frequency</dt><dd>Once daily</dd></div><div><dt>Duration</dt><dd>30 days</dd></div><div><dt>Quantity</dt><dd>30 tablets</dd></div></dl><p><strong>Directions:</strong> Take one tablet after breakfast. Continue as instructed and attend your scheduled follow-up.</p></div><div className="doctor-sign"><div><span>Issued by</span><strong>Dr. Paolo Mendoza</strong><small>PRC License: DEMO-48291 · San Isidro District Hospital</small></div><Badge tone="green">Issued · Read-only</Badge></div></Card><div className="notice wide"><Icon name="printer"/><span>Need help printing? You may request printing assistance from Barangay Maligaya Health Center. Assisted printing would require confirmation and be audit-logged.</span></div>{doctor && <div className="form-actions"><Button variant="danger">Cancel and reissue</Button></div>}</>;
}

function MedicalRecord() {
  return <><PageHead title="My medical record" text="A clear history of your own CareLink records."/><div className="record-tabs"><button className="active">Overview</button><button>Screenings</button><button>Visits</button><button>Referrals</button></div><div className="record-grid"><Card><h2>Personal information</h2><dl className="details"><div><dt>Full name</dt><dd>Maria Santos</dd></div><div><dt>Patient code</dt><dd>CL-2025-0842</dd></div><div><dt>Sex</dt><dd>Female</dd></div><div><dt>Barangay</dt><dd>Barangay Maligaya</dd></div></dl></Card><Card><h2>Current care summary</h2><div className="summary-lines"><span>Screening outcome <Badge tone="amber">Monitor</Badge></span><span>Active referral <Badge tone="gray">None</Badge></span><span>Next follow-up <strong>27 June 2025</strong></span></div></Card></div><Card><h2>Health record timeline</h2><div className="timeline"><div><i></i><span><Badge tone="blue">Consultation</Badge><strong>San Isidro District Hospital</strong><small>20 June 2025 · Instructions and prescription issued</small></span></div><div><i></i><span><Badge tone="amber">Monitor</Badge><strong>Community screening</strong><small>18 June 2025 · Screening outcome, not a diagnosis</small></span></div><div><i></i><span><Badge tone="green">Verified</Badge><strong>Identity verified in person</strong><small>12 March 2025 · Barangay Maligaya Health Center</small></span></div></div></Card></>;
}

function Notes({ doctor = false }: { doctor?: boolean }) {
  const [tab, setTab] = useState("Patient Instructions");
  return <><PageHead title={doctor ? "Doctor notes" : "Doctor instructions"} text={doctor ? "Keep patient instructions separate from private clinical notes." : "Easy-to-read instructions shared with you after your visits."}/>{doctor && <div className="record-tabs"><button className={tab === "Patient Instructions" ? "active" : ""} onClick={() => setTab("Patient Instructions")}>Patient Instructions · Shared</button><button className={tab === "Clinical Note" ? "active" : ""} onClick={() => setTab("Clinical Note")}>Clinical Note · Private</button></div>}<Card className="note-card"><div className="note-meta"><span><small>Visit date</small><strong>20 June 2025</strong></span><span><small>Physician</small><strong>Dr. Paolo Mendoza</strong></span>{doctor && <Badge tone={tab === "Patient Instructions" ? "teal" : "red"}>{tab === "Patient Instructions" ? "Patient · BHW · Physician" : "Patient · Physician only"}</Badge>}</div><h2>{tab === "Patient Instructions" ? "Your care instructions" : "Private clinical note"}</h2><p>{tab === "Patient Instructions" ? "Continue your daily health log and bring it to your next appointment. Take your medicine as written on the prescription. Visit the health center sooner if you feel unwell." : "Private demo clinical content is visible only to the patient and authorized physician. Barangay staff see only that follow-up is required."}</p><div className="followup"><Icon name="consult"/><span><strong>Next step</strong><small>Follow-up at Barangay Maligaya Health Center on 27 June 2025 at 9:00 AM.</small></span></div>{doctor && <div className="form-actions"><Button variant="secondary">Save draft</Button><Button>Save note</Button></div>}</Card></>;
}

function AccessHistory() {
  return <><PageHead title="Who viewed my record" text="A history of authorized CareLink access to your information."/><Card><div className="access-list">{[
    ["20 Jun 2025 · 10:42 AM","Authorized physician · USR-DOC-218","Consultation record opened","Pairing key and patient confirmation"],
    ["18 Jun 2025 · 2:14 PM","Barangay Health Worker · USR-BHW-047","Screening record added","Assigned barangay access"],
    ["12 Mar 2025 · 9:31 AM","Barangay Health Worker · USR-BHW-047","Patient identity verified","In-person verification"],
  ].map((a) => <div key={a[0]}><span className="access-icon"><Icon name="shield"/></span><div><strong>Your record was accessed by an authorized healthcare provider.</strong><p>{a[1]} · {a[2]}</p><small>{a[0]} · {a[3]}</small></div><Badge tone="green">Authorized</Badge></div>)}</div></Card></>;
}

function DoctorDashboard({ go }: { go: (screen: string) => void }) {
  return <><PageHead eyebrow="Wednesday, 25 June 2025" title="Clinical workspace" text="Welcome back, Dr. Paolo Mendoza." actions={<Button icon="search" onClick={() => go("lookup")}>Find patient</Button>}/><div className="stats-grid"><Stat label="Today’s consultations" value="8" detail="3 remaining" icon="consult"/><Stat label="Pending follow-ups" value="6" detail="2 due today" icon="referral" tone="amber"/><Stat label="Active referrals" value="14" detail="4 new this week" icon="record" tone="teal"/><Stat label="Prescriptions issued" value="21" detail="This month" icon="rx" tone="green"/></div><div className="dashboard-grid"><Card><div className="card-head"><div><h2>Today’s consultations</h2><p>Wednesday, 25 June</p></div></div><div className="appointment-list">{[["9:00 AM","Lina Garcia","Follow-up"],["10:30 AM","Jose Villanueva","New referral"],["1:00 PM","Maria Santos","Follow-up"]].map((a) => <button key={a[0]} onClick={() => go("lookup")}><time>{a[0]}</time><span><strong>{a[1]}</strong><small>{a[2]}</small></span><Icon name="chevron"/></button>)}</div></Card><Card><div className="card-head"><div><h2>Quick patient lookup</h2><p>Protected access requires verification</p></div></div><div className="lookup-box"><Icon name="qr" size={30}/><h3>Scan a CareLink patient QR</h3><p>Scanning identifies the patient but does not open their medical record.</p><Button onClick={() => go("lookup")}>Start secure lookup</Button></div></Card></div></>;
}

type LookupStep = "lookup" | "pairing" | "confirm" | "access";
const LOOKUP_STEPS: { key: LookupStep; label: string }[] = [
  { key: "lookup", label: "Identify" },
  { key: "pairing", label: "Pairing key" },
  { key: "confirm", label: "Patient confirmation" },
  { key: "access", label: "Access" },
];

function PatientLookup({ go }: { go: (screen: string) => void }) {
  const [step, setStep] = useState<LookupStep>("lookup");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [patientConfirmed, setPatientConfirmed] = useState(false);
  const stepIndex = LOOKUP_STEPS.findIndex((s) => s.key === step);

  const verifyPairingKey = () => {
    setError("");
    if (!surname.trim() || !birthdate.trim()) { setError("Enter both the patient surname and birthdate to continue."); return; }
    setVerifying(true);
    // Simulated server verification (mock only — no real security).
    window.setTimeout(() => {
      setVerifying(false);
      if (surname.trim().toLowerCase() === "santos" && birthdate.trim() === "19680514") {
        setStep("confirm");
      } else {
        setError("The pairing key did not match. Please check with the patient and try again.");
      }
    }, 650);
  };

  const stepper = <ol className="secure-steps" aria-label="Secure patient lookup progress">
    {LOOKUP_STEPS.map((s, i) => <li key={s.key} className={i < stepIndex ? "done" : i === stepIndex ? "active" : ""} aria-current={i === stepIndex ? "step" : undefined}><i>{i < stepIndex ? <Icon name="check" size={12}/> : i + 1}</i>{s.label}</li>)}
  </ol>;

  return <><PageHead title="Secure patient lookup" text="Identify the patient, then complete verification before protected information is shown."/>{stepper}

    {step === "lookup" && <div className="lookup-options">
      <Card><Icon name="qr" size={34}/><h2>Scan patient QR</h2><p>Use the patient’s CareLink card. QR content contains no personal or medical information.</p><Button onClick={() => { setError(""); setStep("pairing"); }}>Simulate QR scan</Button></Card>
      <Card><Icon name="search" size={34}/><h2>Enter patient code</h2><p>Manual lookup is rate-limited and still requires the pairing-key challenge.</p><Field label="Patient code" placeholder="CL-YYYY-0000"/><Button variant="secondary" onClick={() => { setError(""); setStep("pairing"); }}>Continue securely</Button></Card>
    </div>}

    {step === "pairing" && <Card className="pairing-card">
      <div className="pairing-head"><span><Icon name="shield"/></span><div><Badge tone="blue">Patient identified</Badge><h2>Pairing key required</h2><p>Ask the patient to state their surname and birthdate. Do not write, print, or store the birthdate.</p></div></div>
      <div className="identified"><span>Demo patient</span><strong>Maria S. · CL-2025-0842</strong></div>
      <Field label="Patient surname" placeholder="Enter surname as stated" value={surname} onChange={(value) => { setSurname(value); setError(""); }} error={error && !surname.trim() ? error : undefined}/>
      <Field label="Birthdate in YYYYMMDD format" placeholder="YYYYMMDD" value={birthdate} onChange={(value) => { setBirthdate(value); setError(""); }} error={error ? error : undefined}/>
      <div className="notice"><Icon name="shield"/><span>The record remains hidden until the pairing key is verified and the patient confirms access.</span></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => { setStep("lookup"); setError(""); }} disabled={verifying}>Cancel</Button><Button onClick={verifyPairingKey} disabled={verifying}>{verifying ? "Verifying…" : "Verify pairing key"}</Button></div>
      <small className="demo-hint">Demo key: SANTOS · 19680514</small>
    </Card>}

    {step === "confirm" && <Card className="pairing-card confirm-card">
      <div className="verified-banner"><Icon name="check"/><span><strong>Pairing key verified</strong><small>Surname and birthdate matched for Maria S. · CL-2025-0842</small></span><Badge tone="green">Verified</Badge></div>
      <h2>Patient confirmation required</h2>
      <p>Before the record opens, confirm the patient’s consent for this care event. In production this is a patient-side confirmation on their own device or an in-person acknowledgement.</p>
      <div className="identified"><span>Opening record for</span><strong>Maria Santos · CL-2025-0842</strong></div>
      <label className="consent"><input type="checkbox" checked={patientConfirmed} onChange={(event) => setPatientConfirmed(event.target.checked)}/><span>The patient is present and has confirmed access to their record for this consultation. This confirmation is simulated for the prototype.</span></label>
      <div className="notice"><Icon name="shield"/><span>Access is limited to this care event and would be audit-logged. The pairing key is a demonstration check and does not provide real security.</span></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => { setStep("pairing"); setPatientConfirmed(false); }}>Back</Button><Button disabled={!patientConfirmed} onClick={() => setStep("access")}>Continue to access</Button></div>
    </Card>}

    {step === "access" && <Card className="access-success">
      <div className="success-icon"><Icon name="shield"/></div>
      <Badge tone="green">Access granted · 12-hour demo session</Badge>
      <h1>Identity verified</h1>
      <p>Pairing key verified and patient confirmation recorded. You may now view Maria Santos’s authorized record for this care event. This simulated access is shown as audit-logged.</p>
      <div className="form-actions center"><Button variant="secondary" onClick={() => { setStep("lookup"); setSurname(""); setBirthdate(""); setPatientConfirmed(false); setError(""); }}>Start over</Button><Button icon="record" onClick={() => go("patient-record")}>Open Maria Santos&apos;s Record</Button></div>
    </Card>}
  </>;
}

function DoctorRecord({ go }: { go: (screen: string) => void }) {
  return <><div className="access-banner"><Icon name="shield"/><span><strong>Authorized demo session</strong><small>Patient confirmation recorded · Session expires in 11h 42m</small></span></div><PageHead eyebrow="Protected patient record" title="Maria Santos" text="CL-2025-0842 · 56 years old · Barangay Maligaya" actions={<Button icon="consult" onClick={() => go("consultations")}>Start consultation</Button>}/><div className="record-tabs"><button className="active">Summary</button><button>Screenings</button><button>Consultations</button><button>Prescriptions</button><button>Referrals</button></div><div className="record-grid"><Card><h2>Care summary</h2><div className="summary-lines"><span>Latest screening <Badge tone="amber">Monitor</Badge></span><span>Active referral <Badge tone="gray">None</Badge></span><span>Current prescription <strong>1 active</strong></span></div></Card><Card><h2>Follow-up information</h2><div className="followup"><Icon name="consult"/><span><strong>27 June 2025 · 9:00 AM</strong><small>Barangay Maligaya Health Center</small></span></div></Card></div><Card><h2>Recent record history</h2><div className="timeline"><div><i></i><span><Badge tone="amber">Monitor</Badge><strong>Community screening</strong><small>18 June 2025 · Observations available in screening details</small></span></div><div><i></i><span><Badge tone="blue">Consultation</Badge><strong>Rural Health Unit</strong><small>14 March 2025 · Patient instructions recorded</small></span></div></div></Card></>;
}

function Consultation({ go }: { go: (screen: string) => void }) {
  const [saved, setSaved] = useState(false);
  return <><PageHead eyebrow="Authorized session · Maria Santos" title="New consultation" text="Record this care event using demo information only."/><Card className="consult-form"><div className="form-grid"><Field label="Consultation date" type="date" value="2025-06-25"/><Field label="Facility" value="San Isidro District Hospital"/><Field label="Reason for visit" placeholder="Patient-reported reason"/><Field label="Follow-up date" type="date"/></div><Field label="Consultation observations" placeholder="Enter relevant demo observations"><textarea rows={5} placeholder="Enter relevant demo observations only"></textarea></Field><div className="note-choice"><div><Icon name="note"/><span><strong>Patient instructions</strong><small>Visible to patient, BHW, and physician</small></span></div><div><Icon name="shield"/><span><strong>Clinical note</strong><small>Visible to patient and physician only</small></span></div></div><div className="form-actions"><Button variant="secondary" onClick={() => go("patient-record")}>Cancel</Button><Button onClick={() => setSaved(true)}>Save consultation</Button></div></Card>{saved && <div className="toast granted"><Icon name="check"/><span><strong>Consultation saved</strong><small>You can now add notes or issue a prescription.</small></span><Button variant="secondary" onClick={() => go("notes")}>Add notes</Button><Button onClick={() => go("prescriptions")}>Create prescription</Button></div>}</>;
}

function AdminOverview({ go }: { go: (screen: string) => void }) {
  return <><div className="admin-banner"><Icon name="shield"/><span><strong>Administrator session — Demonstration Environment</strong><small>Aggregate data access · Asia/Manila · Audit Logging — Demonstration Mode</small></span></div><PageHead eyebrow="System administration" title="CareLink overview" text="Aggregate system activity across participating barangays. Figures are fictional prototype data."/>
    <div className="stats-grid admin-stats-grid"><Stat label="Registered patients" value="18,420" detail="Across all barangays" icon="people"/><Stat label="Barangay staff" value="146" detail="Active accounts" icon="home" tone="teal"/><Stat label="Approved physicians" value="78" detail="Verified by admin" icon="consult" tone="green"/><Stat label="Pending applications" value="4" detail="Awaiting review" icon="approve" tone="amber"/><Stat label="Total barangays" value="32" detail="Participating" icon="dashboard" tone="blue"/></div>
    <div className="dashboard-grid"><Card><div className="card-head"><div><h2>System activity</h2><p>Last 6 months · aggregate events only</p></div><button className="text-button" onClick={() => go("reports")}>View reports</button></div><div className="bar-chart">{[42,55,48,68,75,86].map((h, i) => <div key={i}><span style={{height:`${h}%`}}></span><small>{["Jan","Feb","Mar","Apr","May","Jun"][i]}</small></div>)}</div></Card>
    <Card><div className="card-head"><div><h2>Administrative queue</h2><p>Permitted account actions only</p></div></div><div className="task-list"><button onClick={() => go("applications")}><span className="task-icon"><Icon name="approve"/></span><span><strong>Physician applications</strong><small>4 pending review</small></span><Badge tone="amber">4</Badge></button><button onClick={() => go("staff")}><span className="task-icon"><Icon name="people"/></span><span><strong>Barangay staff requests</strong><small>2 ready to seed</small></span><Badge tone="blue">2</Badge></button><button onClick={() => go("audit")}><span className="task-icon"><Icon name="shield"/></span><span><strong>Audit events</strong><small>1,248 events today</small></span><Icon name="chevron"/></button></div></Card></div>
    <Card><div className="card-head"><div><h2>Recent system activity</h2><p>Pseudonymized events · no patient names or medical details</p></div><button className="text-button" onClick={() => go("audit")}>Open audit logs</button></div><div className="mini-table audit-table"><div className="table-row table-header"><span>UserID</span><span>Role</span><span>Action</span><span>Timestamp</span><span>Result</span></div>{[["USR-ADM-004","Administrator","doctor_approved","25 Jun · 9:56","Success"],["USR-BHW-047","Barangay Staff","bhw_seeded","25 Jun · 9:40","Success"],["USR-DOC-218","Physician","sign_in","25 Jun · 9:12","Success"],["USR-ADM-004","Administrator","report_export","24 Jun · 16:30","Success"]].map((e) => <div className="table-row" key={e[0]+e[2]}><span><code>{e[0]}</code></span><span>{e[1]}</span><span><Badge tone="blue">{e[2]}</Badge></span><span>{e[3]}</span><span><Badge tone="green">{e[4]}</Badge></span></div>)}</div></Card>
    <div className="disclaimer"><Icon name="shield"/><p><strong>Restricted administrator role.</strong> Administrators view aggregate information, reports, pseudonymized audit events, physician approvals, and permitted barangay staff seeding. They cannot open or edit patient medical records.</p></div></>;
}

function AdminReports() {
  const [preview, setPreview] = useState(false);
  const [range, setRange] = useState("Jan–Jun 2025");
  const barangays = [["Maligaya","1,284","1,032","84","82%"],["San Roque","1,096","864","62","79%"],["Mabini","978","801","55","85%"],["Pag-asa","862","710","47","76%"]];
  return <><PageHead eyebrow="System reports" title="Aggregate reports" text="Privacy-conscious, non-identifying summaries for public health administration." actions={<label className="field head-field"><span className="sr-only">Date range</span><select className="head-select" value={range} onChange={(event) => setRange(event.target.value)}><option>Jan–Jun 2025</option><option>Last 30 days</option><option>Last 12 months</option></select></label>}/>
    <div className="stats-grid admin-report-kpis"><Stat label="Patient registrations" value="18,420" detail={range} icon="people"/><Stat label="Screenings completed" value="12,608" detail="Normal / Monitor / Referral" icon="screening" tone="amber"/><Stat label="Referrals sent" value="1,186" detail="Across 32 barangays" icon="referral" tone="teal"/><Stat label="Follow-up rate" value="81%" detail="Seen within 14 days" icon="consult" tone="green"/></div>
    <div className="dashboard-grid"><Card><h2>Registration trend</h2><p className="section-copy">Aggregate new registrations by month.</p><div className="bar-chart large">{[35,45,52,60,73,82].map((h, i) => <div key={i}><span style={{height:`${h}%`}}></span><small>{["Jan","Feb","Mar","Apr","May","Jun"][i]}</small></div>)}</div></Card>
    <Card><h2>Screening outcomes</h2><p className="section-copy">Outcomes are screening categories, never a diagnosis.</p><div className="donut-wrap"><div className="donut"></div><div className="chart-legend"><span><i className="green"></i>Normal <b>68%</b></span><span><i className="amber"></i>Monitor <b>22%</b></span><span><i className="red"></i>Needs Referral <b>10%</b></span></div></div></Card></div>
    <Card><div className="card-head"><div><h2>Barangay-level summary</h2><p>Aggregate totals per barangay · no personal data</p></div></div><div className="mini-table report-table"><div className="table-row table-header"><span>Barangay</span><span>Registered</span><span>Screened</span><span>Referrals</span><span>Follow-up rate</span></div>{barangays.map((r) => <div className="table-row" key={r[0]}>{r.map((c, i) => <span key={c}>{i === 0 ? <strong>{c}</strong> : c}</span>)}</div>)}</div></Card>
    <div className="report-layout"><Card><h2>Generate report</h2><Field label="Report type"><select><option>Monthly screening coverage</option><option>Referral outcomes</option><option>Registration summary</option></select></Field><div className="form-grid"><Field label="Start date" type="date" value="2025-06-01"/><Field label="End date" type="date" value="2025-06-30"/></div><Field label="Barangay"><select><option>All participating barangays</option><option>Barangay Maligaya</option><option>Barangay San Roque</option></select></Field><div className="notice"><Icon name="shield"/><span>Reports contain aggregate totals only. Patient names and clinical information are excluded.</span></div><Button className="full" onClick={() => setPreview(true)}>Generate preview</Button></Card>
    {preview ? <Card className="report-preview"><div className="report-paper"><Logo/><span>MONTHLY SCREENING COVERAGE</span><h2>June 2025</h2><div className="report-kpis"><div><strong>2,148</strong><small>Residents screened</small></div><div><strong>78%</strong><small>Household coverage</small></div><div><strong>186</strong><small>Referrals sent</small></div></div><div className="fake-lines"><i></i><i></i><i></i><i></i></div><small>Generated from fictional prototype data · Asia/Manila</small></div><Button icon="download" onClick={() => alert("Prototype only: aggregate report export is simulated and not written to any database.")}>Export / print report</Button></Card> : <Card className="empty-preview"><Icon name="report" size={34}/><h2>Report preview</h2><p>Choose your filters and generate a preview. No personally identifiable information will appear.</p></Card>}</div></>;
}

type ApplicationStatus = "Pending" | "Approved" | "Rejected";
type DocStatus = "Verified" | "Submitted" | "Missing";
type ApplicationRow = { id: string; name: string; email: string; prc: string; prcStatus: DocStatus; docs: DocStatus; date: string; status: ApplicationStatus };
const docTone = (status: DocStatus): Tone => status === "Verified" ? "green" : status === "Submitted" ? "amber" : "red";
const appTone = (status: ApplicationStatus): Tone => status === "Approved" ? "green" : status === "Rejected" ? "red" : "amber";

// Shared in-memory mock store for physician applications. Lets a submitted
// physician registration appear in the Admin approvals screen within the same
// session. This is NOT persistence: it lives in memory only and resets on reload.
const physicianApplicationStore: {
  rows: ApplicationRow[];
  listeners: Set<() => void>;
  getSnapshot(): ApplicationRow[];
  subscribe(listener: () => void): () => void;
  emit(): void;
  add(row: ApplicationRow): void;
  setStatus(id: string, status: ApplicationStatus): void;
} = {
  rows: [
    { id: "DOC-2025-014", name: "Dr. Paolo Mendoza", email: "p.mendoza@example.demo", prc: "DEMO-48291", prcStatus: "Verified", docs: "Verified", date: "23 Jun 2025", status: "Pending" },
    { id: "DOC-2025-016", name: "Dr. Celine Favis", email: "c.favis@example.demo", prc: "DEMO-50122", prcStatus: "Submitted", docs: "Submitted", date: "24 Jun 2025", status: "Pending" },
    { id: "DOC-2025-012", name: "Dr. Noel Agbuya", email: "n.agbuya@example.demo", prc: "DEMO-47710", prcStatus: "Verified", docs: "Verified", date: "20 Jun 2025", status: "Approved" },
    { id: "DOC-2025-009", name: "Dr. Rhea Lim", email: "r.lim@example.demo", prc: "DEMO-46088", prcStatus: "Missing", docs: "Missing", date: "18 Jun 2025", status: "Rejected" },
  ],
  listeners: new Set(),
  getSnapshot() { return this.rows; },
  subscribe(listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; },
  emit() { this.rows = [...this.rows]; this.listeners.forEach((listener) => listener()); },
  add(row) { this.rows = [row, ...this.rows]; this.listeners.forEach((listener) => listener()); },
  setStatus(id, status) { this.rows = this.rows.map((row) => row.id === id ? { ...row, status } : row); this.listeners.forEach((listener) => listener()); },
};

function usePhysicianApplications() {
  const [, force] = useState(0);
  useEffect(() => physicianApplicationStore.subscribe(() => force((n) => n + 1)), []);
  return physicianApplicationStore.getSnapshot();
}

function PhysicianApplications() {
  const rows = usePhysicianApplications();
  const [filter, setFilter] = useState<"All" | ApplicationStatus>("All");
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [confirm, setConfirm] = useState<{ row: ApplicationRow; action: ApplicationStatus } | null>(null);
  const visible = rows.filter((row) => filter === "All" || row.status === filter);
  const applyDecision = () => {
    if (!confirm) return;
    physicianApplicationStore.setStatus(confirm.row.id, confirm.action);
    if (selected && selected.id === confirm.row.id) setSelected({ ...selected, status: confirm.action });
    setConfirm(null);
  };
  return <><PageHead eyebrow="Account administration" title="Physician applications" text="Review PRC ID and supporting documents before activating a physician account."/>
    <Card><div className="filters"><label className="field"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value as "All" | ApplicationStatus)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></label></div>
      <div className="mini-table applications-table"><div className="table-row table-header"><span>Applicant</span><span>Application date</span><span>PRC ID</span><span>Documents</span><span>Status</span><span>Actions</span></div>{visible.map((row) => <div className="table-row" key={row.id}><span className="applicant-cell"><b>{row.name}</b><small>{row.id}</small></span><span>{row.date}</span><span><Badge tone={docTone(row.prcStatus)}>{row.prcStatus}</Badge></span><span><Badge tone={docTone(row.docs)}>{row.docs}</Badge></span><span><Badge tone={appTone(row.status)}>{row.status}</Badge></span><span className="row-actions"><Button variant="secondary" onClick={() => setSelected(row)}>View</Button>{row.status === "Pending" && <><Button onClick={() => setConfirm({ row, action: "Approved" })}>Approve</Button><Button variant="danger" onClick={() => setConfirm({ row, action: "Rejected" })}>Reject</Button></>}</span></div>)}{!visible.length && <div className="empty"><Icon name="approve" size={28}/><h3>No applications</h3><p>No applications match this status.</p></div>}</div>
    </Card>
    {selected && <Modal title="Physician application" onClose={() => setSelected(null)} actions={selected.status === "Pending" ? <><Button variant="danger" onClick={() => setConfirm({ row: selected, action: "Rejected" })}>Reject</Button><Button onClick={() => setConfirm({ row: selected, action: "Approved" })}>Approve</Button></> : <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}>
      <div className="applicant"><span>{selected.name.replace("Dr. ", "").split(" ").map((n) => n[0]).slice(0,2).join("")}</span><div><h2>{selected.name}</h2><p>{selected.email}</p></div></div>
      <dl className="detail-dl"><div><dt>Application ID</dt><dd>{selected.id}</dd></div><div><dt>PRC ID</dt><dd>{selected.prc} <Badge tone={docTone(selected.prcStatus)}>{selected.prcStatus}</Badge></dd></div><div><dt>Supporting documents</dt><dd><Badge tone={docTone(selected.docs)}>{selected.docs}</Badge></dd></div><div><dt>Application date</dt><dd>{selected.date}</dd></div><div><dt>Current status</dt><dd><Badge tone={appTone(selected.status)}>{selected.status}</Badge></dd></div></dl>
      <div className="notice"><Icon name="shield"/><span>Verification documents are stored in a private, admin-only area. Approval does not grant access to patient medical records.</span></div>
    </Modal>}
    {confirm && <Modal title={confirm.action === "Approved" ? "Approve this application?" : "Reject this application?"} onClose={() => setConfirm(null)} actions={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm.action === "Approved" ? "primary" : "danger"} onClick={applyDecision}>{confirm.action === "Approved" ? "Confirm approval" : "Confirm rejection"}</Button></>}><p>{confirm.action === "Approved" ? `This activates ${confirm.row.name}'s CareLink physician account.` : `This rejects ${confirm.row.name}'s application. They would be notified to resubmit.`} This is a prototype action and is not saved to a real database. In production it would be audit-logged.</p></Modal>}
  </>;
}

type StaffStatus = "Active" | "Inactive";
type StaffRow = { id: string; name: string; barangay: string; contact: string; status: StaffStatus; added: string };
const BARANGAYS = ["Barangay Maligaya", "Barangay San Roque", "Barangay Mabini", "Barangay Pag-asa"];

function StaffManagement() {
  const [rows, setRows] = useState<StaffRow[]>([
    { id: "BHW-047", name: "Ana Reyes", barangay: "Barangay Maligaya", contact: "0917 555 0147", status: "Active", added: "12 Mar 2025" },
    { id: "BHW-051", name: "Mario Santos", barangay: "Barangay San Roque", contact: "0918 555 0151", status: "Active", added: "02 Apr 2025" },
    { id: "BHW-058", name: "Liza Tan", barangay: "Barangay Mabini", contact: "0919 555 0158", status: "Inactive", added: "19 May 2025" },
    { id: "BHW-063", name: "Ramon Cruz", barangay: "Barangay Pag-asa", contact: "0920 555 0163", status: "Active", added: "08 Jun 2025" },
  ]);
  const [query, setQuery] = useState("");
  const [barangay, setBarangay] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [seedOpen, setSeedOpen] = useState(false);
  const [toggle, setToggle] = useState<StaffRow | null>(null);
  const [toast, setToast] = useState("");
  // Seed form state
  const [sName, setSName] = useState("");
  const [sBarangay, setSBarangay] = useState("");
  const [sContact, setSContact] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sAttempted, setSAttempted] = useState(false);
  const [sDone, setSDone] = useState(false);
  const resetSeedForm = () => { setSName(""); setSBarangay(""); setSContact(""); setSPassword(""); setSAttempted(false); setSDone(false); };
  const closeSeed = () => { setSeedOpen(false); resetSeedForm(); };
  const seedValid = sName.trim() !== "" && sBarangay !== "" && sContact.trim() !== "" && sPassword.trim().length >= 8;
  const submitSeed = () => { setSAttempted(true); if (seedValid) setSDone(true); };

  const visible = rows.filter((row) => (row.name + row.id + row.barangay + row.contact).toLowerCase().includes(query.toLowerCase()) && (barangay === "All" || row.barangay === barangay) && (statusFilter === "All" || row.status === statusFilter));
  const confirmToggle = () => {
    if (!toggle) return;
    const next: StaffStatus = toggle.status === "Active" ? "Inactive" : "Active";
    setRows((prev) => prev.map((row) => row.id === toggle.id ? { ...row, status: next } : row));
    setToast(`${toggle.name} marked ${next.toLowerCase()} (prototype only).`);
    setToggle(null);
  };
  return <><PageHead eyebrow="Account administration" title="Barangay staff management" text="Barangay health worker accounts are seeded by admin and bound to one barangay." actions={<Button icon="plus" onClick={() => { resetSeedForm(); setSeedOpen(true); }}>Seed BHW account</Button>}/>
    <Card><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Search name, ID, barangay, or contact" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search barangay staff"/></label><label className="field"><span className="sr-only">Barangay</span><select value={barangay} onChange={(event) => setBarangay(event.target.value)} aria-label="Filter by barangay"><option>All</option>{BARANGAYS.map((b) => <option key={b}>{b}</option>)}</select></label><label className="field"><span className="sr-only">Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by account status"><option>All</option><option>Active</option><option>Inactive</option></select></label></div>
      <div className="mini-table staff-table"><div className="table-row table-header"><span>Staff name</span><span>Assigned barangay</span><span>Contact number</span><span>Status</span><span>Date created</span><span>Actions</span></div>{visible.map((row) => <div className="table-row" key={row.id}><span className="applicant-cell"><b>{row.name}</b><small>{row.id}</small></span><span>{row.barangay}</span><span>{row.contact}</span><span><Badge tone={row.status === "Active" ? "green" : "gray"}>{row.status}</Badge></span><span>{row.added}</span><span className="row-actions"><Button variant={row.status === "Active" ? "danger" : "secondary"} onClick={() => setToggle(row)}>{row.status === "Active" ? "Deactivate" : "Activate"}</Button></span></div>)}{!visible.length && <div className="empty"><Icon name="people" size={28}/><h3>No BHW accounts found</h3><p>No accounts match the current search and filters.</p>{(query || barangay !== "All" || statusFilter !== "All") && <Button variant="secondary" onClick={() => { setQuery(""); setBarangay("All"); setStatusFilter("All"); }}>Clear filters</Button>}</div>}</div>
    </Card>

    {seedOpen && <Modal title="Seed Barangay Health Worker account" onClose={closeSeed} actions={sDone
      ? <Button onClick={closeSeed}>Close</Button>
      : <><Button variant="secondary" onClick={closeSeed}>Cancel</Button><Button onClick={submitSeed}>Seed account</Button></>}>
      {sDone ? <div className="seed-result">
        <div className="success-icon info"><Icon name="shield" size={26}/></div>
        <Badge tone="amber">Prototype — not saved</Badge>
        <h2>Account seeding simulated</h2>
        <p>In production this would create a one-time activation for <strong>{sName.trim()}</strong> at <strong>{sBarangay}</strong>, bound to that barangay and audit-logged. No account was created and nothing was saved to a database in this prototype.</p>
      </div> : <>
        <div className="form-grid">
          <Field label="Full name *" placeholder="First, middle, last name" value={sName} onChange={(v) => setSName(v)} error={sAttempted && !sName.trim() ? "Please enter the full name." : undefined}/>
          <Field label="Assigned barangay *" error={sAttempted && !sBarangay ? "Please select a barangay." : undefined}><select value={sBarangay} onChange={(event) => setSBarangay(event.target.value)}><option value="" disabled>Select barangay</option>{BARANGAYS.map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Contact number *" placeholder="09XX XXX XXXX" value={sContact} onChange={(v) => setSContact(v)} error={sAttempted && !sContact.trim() ? "Please enter a contact number." : undefined}/>
          <Field label="Temporary password *" type="password" placeholder="At least 8 characters" value={sPassword} onChange={(v) => setSPassword(v)} error={sAttempted && sPassword.trim().length < 8 ? "Use at least 8 characters." : undefined}/>
        </div>
        <div className="notice"><Icon name="shield"/><span>BHW accounts are bound to one barangay and never self-registered. This is a prototype action and is not saved to a real database.</span></div>
      </>}
    </Modal>}
    {toggle && <Modal title={toggle.status === "Active" ? "Deactivate this account?" : "Activate this account?"} onClose={() => setToggle(null)} actions={<><Button variant="secondary" onClick={() => setToggle(null)}>Cancel</Button><Button variant={toggle.status === "Active" ? "danger" : "primary"} onClick={confirmToggle}>{toggle.status === "Active" ? "Confirm deactivate" : "Confirm activate"}</Button></>}><p>{toggle.status === "Active" ? `${toggle.name} would lose access to ${toggle.barangay} until reactivated.` : `${toggle.name} would regain access to ${toggle.barangay}.`} Prototype action, not saved to a real database.</p></Modal>}
    {toast && <div className="toast granted"><Icon name="check"/><span><strong>Prototype action</strong><small>{toast}</small></span><button onClick={() => setToast("")} aria-label="Dismiss"><Icon name="close"/></button></div>}
  </>;
}

// Save button + visible prototype confirmation. Other preferences on the settings
// pages are illustrative (not persisted). Appearance now lives in Quick Settings.
function SaveBar({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return <div className="settings-save"><div className="settings-save-note" role="status" aria-live="polite">{saved ? <span className="save-ok"><Icon name="check" size={16}/>Preferences updated for this session. These preferences are illustrative and not stored on a server.</span> : <span>Changes apply on this device. This prototype does not save to a server.</span>}</div><Button icon="check" onClick={onSave}>Save changes</Button></div>;
}

function PatientSettings() {
  const [saved, setSaved] = useState(false);
  return <><PageHead eyebrow="My account" title="Profile & Settings" text="Manage your CareLink profile and preferences. Appearance and text size now live in Quick Settings in the top bar. Demonstration data only."/>
    <div className="settings-grid">
      <Card><h2>Personal profile</h2><p className="section-copy">Shown to your care team. Verified in person by a Barangay Health Worker.</p>
        <div className="form-grid"><Field label="Full name" value="Maria Santos"/><Field label="Sex"><select defaultValue="Female"><option>Female</option><option>Male</option><option>Prefer not to say</option></select></Field><Field label="Date of birth" type="date" value="1968-05-14"/><Field label="Household"><select defaultValue="HH-041 · Purok 3"><option>HH-041 · Purok 3</option></select></Field></div>
      </Card>
      <Card><h2>Contact information</h2><p className="section-copy">Used for appointment and follow-up reminders.</p>
        <div className="form-grid"><Field label="Contact number" placeholder="09XX XXX XXXX" value="0917 555 0842"/><Field label="Email" type="email" placeholder="name@carelink.demo" value="maria.santos@carelink.demo"/><Field label="Address" value="Purok 3, Barangay Maligaya"/></div>
      </Card>
      <Card><h2>Account information</h2><p className="section-copy">Managed by CareLink. Identity is verified in person by a BHW.</p>
        <dl className="detail-dl"><div><dt>Patient code</dt><dd>CL-2025-0842</dd></div><div><dt>Verification status</dt><dd><Badge tone="green">Verified</Badge></dd></div><div><dt>Barangay</dt><dd>Barangay Maligaya</dd></div><div><dt>Member since</dt><dd>12 Mar 2025</dd></div></dl>
      </Card>
      <Card><h2>Notifications</h2><p className="section-copy">How you would like to be reminded (illustrative only).</p>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Follow-up and appointment reminders</span></label>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Notify me when my record is accessed</span></label>
        <label className="toggle-row"><input type="checkbox"/><span>SMS reminders (demo)</span></label>
      </Card>
      <Card><h2>Privacy & consent</h2><p className="section-copy">Control how your record may be accessed. Pairing-key confirmation always applies.</p>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Require my confirmation before a physician opens my record</span></label>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Show me who viewed my record</span></label>
        <label className="toggle-row"><input type="checkbox"/><span>Allow Barangay Health Workers to print my health card on request</span></label>
      </Card>
      <Card><h2>Interface preferences</h2><p className="section-copy">Illustrative preferences for this prototype.</p>
        <Field label="Preferred language"><select defaultValue="English"><option>English</option><option>Filipino</option></select></Field>
        <Field label="Default landing page"><select defaultValue="Home"><option>Home</option><option>My Health Card</option><option>Medical Record</option></select></Field>
      </Card>
    </div>
    <SaveBar saved={saved} onSave={() => setSaved(true)}/>
  </>;
}

function BhwSettings() {
  const [saved, setSaved] = useState(false);
  return <><PageHead eyebrow="My account" title="Profile & Settings" text="Manage your Barangay Health Worker profile and preferences. Appearance and text size now live in Quick Settings in the top bar. Demonstration data only."/>
    <div className="settings-grid">
      <Card><h2>Profile information</h2><p className="section-copy">Your account is seeded by an administrator and bound to one barangay.</p>
        <dl className="detail-dl"><div><dt>Full name</dt><dd>Ana Reyes</dd></div><div><dt>Role</dt><dd>Barangay Health Worker</dd></div><div><dt>Assigned barangay</dt><dd>Barangay Maligaya</dd></div><div><dt>Contact number</dt><dd>0917 555 0147</dd></div><div><dt>Account status</dt><dd><Badge tone="green">Active</Badge></dd></div></dl>
      </Card>
      <Card><h2>Notifications</h2><p className="section-copy">Illustrative reminder preferences.</p>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Missed follow-up / home-visit alerts</span></label>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>New referral status updates</span></label>
        <label className="toggle-row"><input type="checkbox"/><span>Daily screening summary (demo)</span></label>
      </Card>
      <Card><h2>Interface preferences</h2><p className="section-copy">Illustrative preferences for this prototype.</p>
        <Field label="Table density"><select defaultValue="Comfortable"><option>Comfortable</option><option>Compact</option></select></Field>
        <Field label="Default landing page"><select defaultValue="Dashboard"><option>Dashboard</option><option>Patient Masterlist</option><option>Households</option></select></Field>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Show prototype notices and disclaimers</span></label>
      </Card>
    </div>
    <SaveBar saved={saved} onSave={() => setSaved(true)}/>
  </>;
}

function PhysicianSettings() {
  const [saved, setSaved] = useState(false);
  return <><PageHead eyebrow="My account" title="Profile & Settings" text="Manage your physician profile and preferences. Appearance and text size now live in Quick Settings in the top bar. Demonstration data only."/>
    <div className="settings-grid">
      <Card><h2>Profile information</h2><p className="section-copy">Verified by an administrator from your PRC credentials.</p>
        <dl className="detail-dl"><div><dt>Full name</dt><dd>Dr. Paolo Mendoza</dd></div><div><dt>Specialty</dt><dd>Internal Medicine</dd></div><div><dt>Affiliated facility</dt><dd>San Isidro District Hospital</dd></div><div><dt>Account status</dt><dd><Badge tone="green">Verified</Badge></dd></div></dl>
      </Card>
      <Card><h2>Notifications</h2><p className="section-copy">Illustrative reminder preferences.</p>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>New referrals to my facility</span></label>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Prescription status updates</span></label>
        <label className="toggle-row"><input type="checkbox"/><span>Daily consultation summary (demo)</span></label>
      </Card>
      <Card><h2>Privacy & session</h2><p className="section-copy">Record access always requires a pairing-key challenge and patient confirmation.</p>
        <Field label="Auto sign-out after inactivity"><select defaultValue="15 minutes"><option>5 minutes</option><option>15 minutes</option><option>30 minutes</option></select></Field>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Require pairing key on every record open</span></label>
        <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Wipe cached session data on sign-out</span></label>
      </Card>
      <Card><h2>Interface preferences</h2><p className="section-copy">Illustrative preferences for this prototype.</p>
        <Field label="Default landing page"><select defaultValue="Dashboard"><option>Dashboard</option><option>Patient Lookup</option><option>Referrals</option></select></Field>
      </Card>
    </div>
    <SaveBar saved={saved} onSave={() => setSaved(true)}/>
  </>;
}

function AdminSettings() {
  const [tableDensity, setTableDensity] = useState("Comfortable");
  const [landing, setLanding] = useState("Overview");
  return <><PageHead eyebrow="Administrator preferences" title="Settings" text="Interface preferences for this prototype. Appearance and text size now live in Quick Settings in the top bar. Changes apply to your device only."/>
    <div className="settings-grid">
    <Card><h2>Interface preferences</h2><p className="section-copy">Prototype preferences. Not saved to a real database.</p>
      <Field label="Table density"><select value={tableDensity} onChange={(event) => setTableDensity(event.target.value)}><option>Comfortable</option><option>Compact</option></select></Field>
      <Field label="Default landing page"><select value={landing} onChange={(event) => setLanding(event.target.value)}><option>Overview</option><option>Physician Applications</option><option>System Reports</option></select></Field>
      <label className="toggle-row"><input type="checkbox" defaultChecked/><span>Show prototype notices and disclaimers</span></label>
    </Card></div>
    <div className="disclaimer"><Icon name="shield"/><p><strong>Prototype settings.</strong> Interface preferences here are illustrative only and are not stored on a server. Light/Dark theme and text size are available in Quick Settings in the top bar and persist in this browser.</p></div>
  </>;
}

function AuditLogs() {
  const [role, setRole] = useState("All roles");
  const events = [["USR-DOC-218","Physician","record_view","25 Jun 2025 · 10:42"],["USR-BHW-047","Barangay Staff","citizen_verified","25 Jun 2025 · 10:18"],["USR-ADM-004","Administrator","doctor_approved","25 Jun 2025 · 9:56"],["USR-CIT-842","Patient","rx_view","25 Jun 2025 · 9:22"]];
  return <><PageHead title="Audit logs" text="Audit Logging — Demonstration Mode. Pseudonymized sample events; patient names and medical details are not displayed."/><Card><div className="filters"><Field label="From"><input type="date" defaultValue="2025-06-25"/></Field><Field label="To"><input type="date" defaultValue="2025-06-25"/></Field><label className="field"><span>Role</span><select value={role} onChange={(e) => setRole(e.target.value)}><option>All roles</option><option>Physician</option><option>Barangay Staff</option><option>Administrator</option><option>Patient</option></select></label></div><div className="mini-table audit-table"><div className="table-row table-header"><span>UserID</span><span>Role</span><span>Action</span><span>Timestamp</span><span>Event detail</span></div>{events.filter(e => role === "All roles" || e[1] === role).map((e) => <div className="table-row" key={e[0]+e[2]}><span><code>{e[0]}</code></span><span>{e[1]}</span><span><Badge tone="blue">{e[2]}</Badge></span><span>{e[3]}</span><span>Authorized system event · View details</span></div>)}</div></Card></>;
}

function GenericPage({ screen, role }: { screen: string; role: Role }) {
  const labels: Record<string, string> = { households: "Households", "add-patient": "Add a resident", reports: "Reports", settings: "Profile & Settings" };
  const title = labels[screen] || nav[role].find(n => n.id === screen)?.label || "CareLink";
  if (screen === "add-patient") return <><PageHead title="Create account for a resident" text="For Barangay Maligaya residents who have not registered themselves."/><Card className="generic-form"><div className="notice"><Icon name="people"/><span>Check the masterlist for duplicates before creating an account. The patient code is assigned by the server in a production system.</span></div><div className="form-grid"><Field label="Full name *" placeholder="First, middle, last name"/><Field label="Sex *"><select><option>Female</option><option>Male</option></select></Field><Field label="Birthday *" type="date"/><Field label="Household *"><select><option>HH-058 · Purok 2</option><option>Create new household</option></select></Field><Field label="Contact number" placeholder="09XX XXX XXXX"/><Field label="Temporary claim method"><select><option>One-time claim code</option></select></Field></div><div className="form-actions"><Button variant="secondary">Cancel</Button><Button>Create resident account</Button></div></Card></>;
  return <><PageHead title={title} text={`${roleMeta[role].label} workspace · interactive prototype`}/><Card className="empty-preview"><Icon name={screen === "settings" ? "settings" : "report"} size={34}/><h2>{title}</h2><p>This supporting workspace is represented in the connected CareLink prototype. Use the main navigation to explore the primary demonstration flows.</p><Button variant="secondary">View demo state</Button></Card></>;
}

// Prototype-only mock administrator credentials. This is NOT real authentication
// and provides NO security: the check runs entirely in the browser and the values
// ship in the client bundle. Real admin auth would be verified server-side (see tech.md).
const MOCK_ADMIN = { email: "admin@carelink.demo", password: "carelink-admin" };

function AdminLogin({ onAuthenticated, onExit, theme, setTheme, fontSize, setFontSize }: { onAuthenticated: () => void; onExit: () => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [authError, setAuthError] = useState(false);
  const emailError = attempted && !email.trim() ? "Please enter your administrator email." : undefined;
  const passwordError = attempted && !password ? "Please enter your password." : undefined;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    setAuthError(false);
    if (!email.trim() || !password) return;
    if (email.trim().toLowerCase() === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
      onAuthenticated();
    } else {
      setAuthError(true);
    }
  };
  return <main className="auth-page admin-auth-page">
    <div className="auth-top"><Logo/><ThemeTools {...{ theme, setTheme, fontSize, setFontSize }}/></div>
    <div className="admin-auth-layout">
      <Card className="admin-login-card">
        <div className="admin-login-head"><span className="admin-login-mark"><Icon name="shield" size={26}/></span><div><div className="eyebrow">CareLink System Administration</div><h1>Administrator sign-in</h1></div></div>
        <p className="admin-login-intro">Restricted access for authorized CareLink administrators. All administrator activity is audit-logged.</p>
        <div className="prototype-note" role="note"><Icon name="shield"/><p><strong>Prototype authentication</strong><br/>This sign-in uses a mock account for demonstration only and provides no real security. Credentials are not verified by a server.</p></div>
        <form onSubmit={submit} noValidate>
          <Field label="Administrator email" type="email" placeholder="name@carelink.demo" value={email} onChange={(value) => { setEmail(value); setAuthError(false); }} error={emailError}/>
          <Field label="Password" error={passwordError}><div className="password-wrap"><input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setAuthError(false); }} aria-invalid={!!passwordError || authError} autoComplete="current-password"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><Icon name="eye"/></button></div></Field>
          {authError && <div className="auth-alert" role="alert"><Icon name="close" size={16}/><span>Those administrator credentials were not recognized. Please try again.</span></div>}
          <div className="form-meta"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)}/> Remember this device</label></div>
          <Button type="submit" className="full">Sign in to admin console</Button>
        </form>
        <button type="button" className="text-button admin-login-back" onClick={onExit}><Icon name="arrow" size={16}/><span>Return to CareLink sign-in</span></button>
        <small className="demo-hint">Demo account: admin@carelink.demo · carelink-admin</small>
      </Card>
    </div>
    <footer className="auth-footer">CareLink · System administration · Demo data only · Intended timezone: Asia/Manila</footer>
  </main>;
}

const SWITCH_ROLES: { role: Role; label: string }[] = [
  { role: "citizen", label: "Citizen — Maria Santos" },
  { role: "barangay_staff", label: "BHW — Ana Reyes" },
  { role: "physician", label: "Physician — Dr. Paolo Mendoza" },
  { role: "admin", label: "System Admin" },
];

function RoleSwitcher({ role, onSwitchRole }: { role: Role; onSwitchRole: (role: Role) => void }) {
  return <div className="role-switcher" title="Demonstration role switcher — not a real authorization control">
    <Icon name="people" size={16}/>
    <label className="role-switcher-label" htmlFor="role-switcher-select">Demo role</label>
    <select id="role-switcher-select" aria-label="Switch demonstration role" value={role} onChange={(event) => onSwitchRole(event.target.value as Role)}>
      {SWITCH_ROLES.map((option) => <option key={option.role} value={option.role}>{option.label}</option>)}
    </select>
  </div>;
}

function AppShell({ role, screen, setScreen, logout, onSwitchRole, appearance }: { role: Role; screen: string; setScreen: (screen: string) => void; logout: () => void; onSwitchRole: (role: Role) => void; appearance: Appearance }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Demonstration-only connectivity toggle for Barangay Staff. Mock behavior:
  // it does not perform real offline persistence or server synchronization.
  const [online, setOnline] = useState(true);
  const title = nav[role].find((item) => item.id === screen)?.label || "Patient Profile";
  const initials = role === "citizen" ? "MS" : role === "barangay_staff" ? "AR" : role === "physician" ? "PM" : "SA";
  const render = () => {
    if (role === "barangay_staff") {
      if (screen === "dashboard") return <StaffDashboard go={setScreen}/>;
      if (screen === "masterlist") return <Masterlist go={setScreen}/>;
      if (screen === "households") return <Households go={setScreen}/>;
      if (screen === "patient-profile") return <PatientProfile go={setScreen}/>;
      if (screen === "screening") return <Screening go={setScreen}/>;
      if (screen === "referrals") return <ReferralPage/>;
      if (screen === "id-cards") return <HealthCard/>;
      if (screen === "settings") return <BhwSettings/>;
    }
    if (role === "citizen") {
      if (screen === "home") return <PatientHome go={setScreen}/>;
      if (screen === "card") return <HealthCard consentFlow/>;
      if (screen === "record") return <MedicalRecord/>;
      if (screen === "prescriptions") return <Prescription/>;
      if (screen === "notes") return <Notes/>;
      if (screen === "access") return <AccessHistory/>;
      if (screen === "settings") return <PatientSettings/>;
    }
    if (role === "physician") {
      if (screen === "dashboard") return <DoctorDashboard go={setScreen}/>;
      if (screen === "lookup") return <PatientLookup go={setScreen}/>;
      if (screen === "patient-record") return <DoctorRecord go={setScreen}/>;
      if (screen === "consultations") return <Consultation go={setScreen}/>;
      if (screen === "notes") return <Notes doctor/>;
      if (screen === "prescriptions") return <Prescription doctor/>;
      if (screen === "referrals") return <ReferralPage/>;
      if (screen === "settings") return <PhysicianSettings/>;
    }
    if (role === "admin") {
      if (screen === "overview") return <AdminOverview go={setScreen}/>;
      if (screen === "applications") return <PhysicianApplications/>;
      if (screen === "staff") return <StaffManagement/>;
      if (screen === "reports") return <AdminReports/>;
      if (screen === "audit") return <AuditLogs/>;
      if (screen === "settings") return <AdminSettings/>;
    }
    return <GenericPage screen={screen} role={role}/>;
  };
  return <div className={`app-shell role-${role}`}>
    <aside className={menuOpen ? "sidebar open" : "sidebar"}><div className="sidebar-brand"><Logo/><button className="mobile-close" onClick={() => setMenuOpen(false)}><Icon name="close"/></button></div><div className="role-chip"><span>{initials}</span><div><strong>{role === "citizen" ? "Maria Santos" : role === "barangay_staff" ? "Ana Reyes" : role === "physician" ? "Dr. Paolo Mendoza" : "System Admin"}</strong><small>{roleMeta[role].subtitle}</small></div></div><nav>{nav[role].map((item) => <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => {setScreen(item.id);setMenuOpen(false)}}><Icon name={item.icon}/><span>{item.label}</span>{screen === item.id && <i></i>}</button>)}</nav><div className="sidebar-foot">{role === "barangay_staff" ? <button type="button" className={online ? "sync-status sync-toggle" : "sync-status sync-toggle offline"} onClick={() => setOnline((v) => !v)} aria-pressed={!online} title="Demonstration connectivity toggle — mock sync only"><i></i><span><strong>{online ? "Online · All changes synced" : "Offline Mode · 2 screenings queued locally"}</strong><small>{online ? "Tap to simulate going offline" : "Tap to simulate reconnecting · demo only"}</small></span></button> : <div className="sync-status"><i></i><span><strong>Secure demo session</strong><small>Prototype only</small></span></div>}<button onClick={logout}><Icon name="logout"/><span>Sign out</span></button></div></aside>
    {menuOpen && <div className="drawer-shade" onClick={() => setMenuOpen(false)}></div>}
    <QuickSettings appearance={appearance}/>
    <div className="app-main"><header className="topbar"><div><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu"><Icon name="menu"/></button><span className="mobile-title">{title}</span></div><div className="top-actions"><RoleSwitcher role={role} onSwitchRole={onSwitchRole}/><span className="prototype-pill" title="Demonstration prototype using fictional data">Prototype · Demo data</span><button className="icon-btn notification" aria-label="Notifications"><Icon name="bell"/><i></i></button><button className="user-menu"><span>{initials}</span><div><strong>{roleMeta[role].label}</strong><small>View profile</small></div></button></div></header>{role === "barangay_staff" && !online && <div className="offline-banner" role="status"><Icon name="shield" size={16}/><span><strong>Offline Mode (demonstration)</strong> · 2 screenings queued locally. Mock sync only — no data is actually stored offline or sent to a server.</span></div>}<main className="content">{render()}</main></div>
  </div>;
}

// Hidden, path-only admin entry. Reuses the app's existing pathname-based navigation
// (no router dependency). Admin is never surfaced in the public role selector or any
// ordinary navigation; it is reachable only by visiting these paths directly.
type AdminRoute = "login" | "dashboard" | null;
function readAdminRoute(): AdminRoute {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/admin/login") return "login";
  if (path === "/admin/dashboard") return "dashboard";
  if (path === "/admin" || path === "/admin-demo") return "login";
  return null;
}

export default function App() {
  const [view, setView] = useState<"landing" | "role-select" | "login" | "register">("landing");
  const [registerKind, setRegisterKind] = useState<RegKind>("patient");
  const [role, setRole] = useState<Role | null>(null);
  const [screen, setScreen] = useState("home");
  const [adminRoute, setAdminRoute] = useState<AdminRoute>(() => readAdminRoute());
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("carelink-theme") || "light");
  const [fontSize, setFontSize] = useState<FontSize>((localStorage.getItem("carelink-font") as FontSize) || "default");
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem("carelink-motion") === "reduced");
  const [density, setDensity] = useState<Density>((localStorage.getItem("carelink-density") as Density) || "comfortable");
  const [notify, setNotify] = useState(localStorage.getItem("carelink-notify") !== "off");
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("carelink-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.dataset.font = fontSize; localStorage.setItem("carelink-font", fontSize); }, [fontSize]);
  useEffect(() => { document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full"; localStorage.setItem("carelink-motion", reducedMotion ? "reduced" : "full"); }, [reducedMotion]);
  useEffect(() => { document.documentElement.dataset.density = density; localStorage.setItem("carelink-density", density); }, [density]);
  useEffect(() => { localStorage.setItem("carelink-notify", notify ? "on" : "off"); }, [notify]);
  const appearance: Appearance = { theme, setTheme, fontSize, setFontSize, reducedMotion, setReducedMotion, density, setDensity, notify, setNotify };
  // Keep admin routing in sync with browser back/forward.
  useEffect(() => {
    const onPopState = () => setAdminRoute(readAdminRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const goAdmin = (route: Exclude<AdminRoute, null>) => {
    const path = route === "dashboard" ? "/admin/dashboard" : "/admin/login";
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setAdminRoute(route);
  };
  const leaveAdmin = () => {
    setAdminAuthed(false);
    if (window.location.pathname.startsWith("/admin")) window.history.pushState({}, "", "/");
    setAdminRoute(null);
  };
  const login = (nextRole: Role) => { setRole(nextRole); setScreen(roleMeta[nextRole].initial); };
  const pickRole = (kind: RegKind) => { setRegisterKind(kind); setView("register"); };
  // Demonstration-only role switcher. Not an authorization mechanism: it simply
  // navigates to each role's existing interface for live demos.
  const switchRole = (nextRole: Role) => {
    if (nextRole === "admin") { setAdminAuthed(true); setScreen("overview"); goAdmin("dashboard"); return; }
    if (window.location.pathname.startsWith("/admin")) { setAdminAuthed(false); window.history.pushState({}, "", "/"); setAdminRoute(null); }
    setRole(nextRole);
    setScreen(roleMeta[nextRole].initial);
  };

  // Admin area is isolated from the public login/registration and from the role shell.
  if (adminRoute) {
    // Protected dashboard: a direct visit without an authenticated mock session falls back to the admin login.
    if (adminRoute === "dashboard" && adminAuthed) {
      return <AppShell role="admin" screen={screen === "overview" || nav.admin.some((item) => item.id === screen) ? screen : "overview"} setScreen={setScreen} logout={leaveAdmin} onSwitchRole={switchRole} appearance={appearance}/>;
    }
    return <AdminLogin onAuthenticated={() => { setAdminAuthed(true); setScreen("overview"); goAdmin("dashboard"); }} onExit={leaveAdmin} {...{theme,setTheme,fontSize,setFontSize}}/>;
  }

  if (!role) {
    if (view === "landing") return <Landing onGetStarted={() => setView("role-select")} onSignIn={() => setView("login")} {...{theme,setTheme,fontSize,setFontSize}}/>;
    if (view === "role-select") return <RoleSelect onPick={pickRole} onBack={() => setView("landing")} onSignIn={() => setView("login")} {...{theme,setTheme,fontSize,setFontSize}}/>;
    if (view === "register") return <Registration kind={registerKind} onBack={() => setView("landing")} onChangeRole={() => setView("role-select")}/>;
    return <Login onLogin={login} onRegister={() => setView("role-select")} onRegisterPhysician={() => pickRole("physician")} onBack={() => setView("landing")} {...{theme,setTheme,fontSize,setFontSize}}/>;
  }
  return <AppShell role={role} screen={screen} setScreen={setScreen} logout={() => {setRole(null);setView("landing")}} onSwitchRole={switchRole} appearance={appearance}/>;
}
