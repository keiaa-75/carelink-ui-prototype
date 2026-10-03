import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Role = "citizen" | "barangay_staff" | "physician" | "admin";
type FontSize = "small" | "default" | "large";
type Tone = "blue" | "teal" | "green" | "amber" | "red" | "gray";

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
    { id: "statistics", label: "Statistics", icon: "chart" },
    { id: "reports", label: "Reports", icon: "report" },
    { id: "audit", label: "Audit Logs", icon: "shield" },
    { id: "approvals", label: "Physician Approval", icon: "approve" },
    { id: "accounts", label: "BHW Accounts", icon: "people" },
    { id: "settings", label: "Profile & Settings", icon: "settings" },
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
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.record}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo"><div className="logo-mark"><span></span><span></span></div>{!compact && <div><strong>CareLink</strong><small>Connected care, closer to home</small></div>}</div>;
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

function ThemeTools({ theme, setTheme, fontSize, setFontSize }: { theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  return <div className="theme-tools"><button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}><Icon name={theme === "dark" ? "sun" : "moon"}/></button><div className="font-control" aria-label="Text size"><button className={fontSize === "small" ? "active" : ""} onClick={() => setFontSize("small")}>A</button><button className={fontSize === "default" ? "active" : ""} onClick={() => setFontSize("default")}>A</button><button className={fontSize === "large" ? "active" : ""} onClick={() => setFontSize("large")}>A</button></div></div>;
}

function Login({ onLogin, onRegister, theme, setTheme, fontSize, setFontSize }: { onLogin: (role: Role) => void; onRegister: (kind: "patient" | "staff") => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
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
    <div className="auth-top"><Logo/><ThemeTools {...{ theme, setTheme, fontSize, setFontSize }}/></div>
    <div className="auth-layout">
      <section className="auth-story">
        <Badge tone="teal">Care coordination for every barangay</Badge>
        <h1>Better health starts with <em>being connected.</em></h1>
        <p>One trusted place for screening, referrals, consultations, and personal health records—built for Filipino communities.</p>
        <div className="trust-row"><div><Icon name="shield"/><span><strong>Privacy first</strong><small>Access with consent</small></span></div><div><Icon name="home"/><span><strong>Community-led</strong><small>Closer to home</small></span></div></div>
        <div className="prototype-note"><Icon name="shield"/><p><strong>Demonstration prototype</strong><br/>Uses fictional records only. No real authentication or secure data storage is implemented.</p></div>
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
        <div className="register-links"><span>New to CareLink?</span><button onClick={() => onRegister("patient")}>Register as a patient</button><button onClick={() => onRegister("staff")}>Request staff access</button></div>
      </Card>
    </div>
    <footer className="auth-footer">CareLink · Demo data only · Intended timezone: Asia/Manila</footer>
  </main>;
}

function Registration({ kind, onBack }: { kind: "patient" | "staff"; onBack: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); setAttempted(true); if (name && birthday) setSubmitted(true); };
  if (submitted) return <main className="center-page"><Card className="success-card"><div className="success-icon"><Icon name="check" size={28}/></div><Badge tone="amber">Pending verification</Badge><h1>Thank you, {name.split(" ")[0]}.</h1><p>{kind === "patient" ? "Your account request was received. Please visit Barangay Maligaya Health Center with a valid ID so a Barangay Health Worker can verify your information." : "Your staff access request was recorded for this prototype. BHW accounts must be seeded and authorized by an administrator before access is granted."}</p><div className="notice"><Icon name="shield"/><span>No account has been automatically authorized. This is a simulated registration state.</span></div><Button onClick={onBack}>Return to login</Button></Card></main>;
  return <main className="form-page"><div className="form-page-head"><Logo/><button className="text-button" onClick={onBack}>Return to login</button></div><Card className="registration-card"><div className="step-label">Account request · Step 1 of 1</div><h1>{kind === "patient" ? "Create your patient account" : "Request Barangay Staff access"}</h1><p>{kind === "patient" ? "Tell us about yourself. A Barangay Health Worker will verify your identity in person." : "Staff accounts are not activated through self-registration. This form demonstrates an access request only."}</p>
    <form onSubmit={submit} className="form-grid">
      <Field label="Full name *" placeholder="First, middle, and last name" value={name} onChange={setName} error={attempted && !name ? "Please enter your full name." : undefined}/>
      {kind === "patient" ? <><Field label="Sex *"><select defaultValue=""><option value="" disabled>Select sex</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></Field><Field label="Birthday *" type="date" value={birthday} onChange={setBirthday} error={attempted && !birthday ? "Please select your birthday." : undefined}/><Field label="Height (optional)" placeholder="e.g. 160 cm"/><Field label="Weight (optional)" placeholder="e.g. 58 kg"/></> : <><Field label="Email or username *" type="email" placeholder="name@carelink.demo"/><Field label="Assigned barangay *"><select><option>Barangay Maligaya</option><option>Barangay San Roque</option></select></Field><Field label="Contact number" placeholder="09XX XXX XXXX"/><Field label="Birthday *" type="date" value={birthday} onChange={setBirthday} error={attempted && !birthday ? "Please select a date." : undefined}/></>}
      <Field label="Password *" type="password" placeholder="At least 8 characters"/><Field label="Confirm password *" type="password" placeholder="Enter password again"/>
      <label className="consent full-span"><input type="checkbox"/><span>I understand that this prototype uses mock data. In a real service, my information would be handled according to applicable privacy requirements.</span></label>
      <div className="full-span form-actions"><Button variant="secondary" onClick={onBack}>Cancel</Button><Button type="submit">Submit account request</Button></div>
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

function Masterlist({ go }: { go: (screen: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = patients.filter((patient) => (patient.name + patient.code).toLowerCase().includes(query.toLowerCase()) && (filter === "All" || patient.status === filter));
  return <><PageHead eyebrow="Barangay Maligaya only" title="Patient masterlist" text="Search, verify, and manage residents assigned to your barangay." actions={<><Button variant="secondary" icon="download" onClick={() => alert("CSV export simulated. In production, this action would require confirmation and be audit-logged.")}>Export</Button><Button icon="plus" onClick={() => go("add-patient")}>Add resident</Button></>}/>
    <Card><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Search name or patient code" value={query} onChange={(event) => setQuery(event.target.value)}/></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Verified</option><option>Pending</option></select><select><option>All screening outcomes</option><option>Normal</option><option>Monitor</option><option>Needs Referral</option></select><select><option>All households</option><option>Purok 1</option><option>Purok 2</option><option>Purok 3</option></select></div>
      <div className="patient-table"><div className="table-row table-header"><span>Patient</span><span>Household</span><span>Verification</span><span>Screening</span><span>Last visit</span><span></span></div>{filtered.map((patient) => <button className="table-row patient-row" onClick={() => go("patient-profile")} key={patient.code}><span className="patient-name"><i>{patient.name.split(" ").map((n) => n[0]).slice(0,2)}</i><b>{patient.name}<small>{patient.code}</small></b></span><span>{patient.household}</span><span><Badge tone={patient.status === "Verified" ? "green" : "amber"}>{patient.status}</Badge></span><span><Badge tone={patient.screening === "Normal" ? "green" : patient.screening === "Monitor" ? "amber" : "red"}>{patient.screening}</Badge></span><span>{patient.visit}</span><span><Icon name="chevron"/></span></button>)}</div>
      {!filtered.length && <div className="empty"><Icon name="search" size={28}/><h3>No residents found</h3><p>Try another name, code, or filter.</p></div>}
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

function Screening({ go }: { go: (screen: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [outcome, setOutcome] = useState("Monitor");
  if (saved) return <><PageHead title="Screening saved" text="A demo screening result has been recorded for Rogelio Dela Cruz."/><Card className="result-card"><div className={`result-orb ${outcome === "Normal" ? "green" : outcome === "Monitor" ? "amber" : "red"}`}><Icon name={outcome === "Normal" ? "check" : "screening"} size={32}/></div><Badge tone={outcome === "Normal" ? "green" : outcome === "Monitor" ? "amber" : "red"}>{outcome}</Badge><h2>{outcome === "Normal" ? "Continue routine care" : outcome === "Monitor" ? "Monitoring is recommended" : "A referral is recommended"}</h2><p>This is a screening and care-coordination outcome, not a diagnosis. Clinical thresholds are not shown in this prototype.</p><div className="form-actions"><Button variant="secondary" onClick={() => {setSaved(false); go("masterlist")}}>Return to masterlist</Button>{outcome === "Needs Referral" && <Button icon="referral" onClick={() => go("referrals")}>Create referral</Button>}</div></Card></>;
  return <><PageHead eyebrow="Demo screening" title="New health screening" text="Record observations and select the simulated outcome. CareLink does not provide a diagnosis."/>
    <div className="screening-layout"><Card><h2>Resident and visit</h2><div className="form-grid"><Field label="Patient"><select><option>Rogelio Dela Cruz · CL-2025-0917</option><option>Maria Santos · CL-2025-0842</option></select></Field><Field label="Screening date" type="date" value="2025-06-25"/><Field label="Screening category"><select><option>Routine community screening</option><option>Follow-up screening</option></select></Field><Field label="Recorded by" value="Ana Reyes, BHW" /></div></Card>
    <Card><h2>Sample observations</h2><p className="section-copy">Enter demo observations only. Reference thresholds are configured outside this prototype.</p><div className="form-grid thirds"><Field label="Blood pressure" placeholder="Sample: 128 / 84"/><Field label="Blood sugar" placeholder="Sample value"/><Field label="Weight" placeholder="Sample: 67 kg"/><Field label="Symptoms or concerns"><select><option>None reported</option><option>Concern reported</option></select></Field><Field label="Family history"><select><option>Not recorded</option><option>Reported by patient</option></select></Field><Field label="Follow-up needed"><select><option>To be reviewed</option><option>Yes</option><option>No</option></select></Field></div></Card>
    <Card><h2>Demo screening outcome</h2><p className="section-copy">For prototype demonstration only; no clinical logic is being run.</p><div className="outcome-options">{["Normal","Monitor","Needs Referral"].map((item) => <button key={item} className={outcome === item ? "active" : ""} onClick={() => setOutcome(item)}><Badge tone={item === "Normal" ? "green" : item === "Monitor" ? "amber" : "red"}>{item}</Badge><small>{item === "Normal" ? "Continue routine care" : item === "Monitor" ? "Review at the next visit" : "Continue to referral workflow"}</small></button>)}</div><div className="form-actions"><Button variant="secondary" onClick={() => go("masterlist")}>Cancel</Button><Button onClick={() => setSaved(true)}>Save screening</Button></div></Card></div></>;
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

function PatientLookup({ go }: { go: (screen: string) => void }) {
  const [step, setStep] = useState<"lookup" | "pairing" | "invalid" | "success">("lookup");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  if (step === "success") return <Card className="access-success"><div className="success-icon"><Icon name="shield"/></div><Badge tone="green">Access granted · 12-hour demo session</Badge><h1>Identity verified</h1><p>You may now view Maria Santos’s authorized record for this care event. This simulated access is shown as audit-logged.</p><Button icon="record" onClick={() => go("patient-record")}>Open authorized record</Button></Card>;
  return <><PageHead title="Secure patient lookup" text="Identify the patient, then complete verification before protected information is shown."/><div className="secure-steps"><span className="done"><i>1</i>Identify</span><span className={step !== "lookup" ? "active" : ""}><i>2</i>Pairing key</span><span><i>3</i>Patient confirmation</span><span><i>4</i>Access</span></div>
    {step === "lookup" ? <div className="lookup-options"><Card><Icon name="qr" size={34}/><h2>Scan patient QR</h2><p>Use the patient’s CareLink card. QR content contains no personal or medical information.</p><Button onClick={() => setStep("pairing")}>Simulate QR scan</Button></Card><Card><Icon name="search" size={34}/><h2>Enter patient code</h2><p>Manual lookup is rate-limited and still requires the pairing-key challenge.</p><Field label="Patient code" placeholder="CL-YYYY-0000"/><Button variant="secondary" onClick={() => setStep("pairing")}>Continue securely</Button></Card></div>
    : <Card className="pairing-card"><div className="pairing-head"><span><Icon name="shield"/></span><div><Badge tone="blue">Patient identified</Badge><h2>Pairing key required</h2><p>Ask the patient to state their surname and birthdate. Do not write, print, or store the birthdate.</p></div></div><div className="identified"><span>Demo patient</span><strong>Maria S. · CL-2025-0842</strong></div><Field label="Patient surname" placeholder="Enter surname as stated" value={surname} onChange={setSurname}/><Field label="Birthdate in YYYYMMDD format" placeholder="YYYYMMDD" value={birthdate} onChange={setBirthdate} error={step === "invalid" ? "The pairing key did not match. Please check with the patient and try again." : undefined}/><div className="notice"><Icon name="shield"/><span>The record remains hidden until the pairing key is verified and the patient confirms access.</span></div><div className="form-actions"><Button variant="secondary" onClick={() => setStep("lookup")}>Cancel</Button><Button onClick={() => surname.toLowerCase() === "santos" && birthdate === "19680514" ? setStep("success") : setStep("invalid")}>Verify pairing key</Button></div><small className="demo-hint">Demo key: SANTOS · 19680514</small></Card>}</>;
}

function DoctorRecord({ go }: { go: (screen: string) => void }) {
  return <><div className="access-banner"><Icon name="shield"/><span><strong>Authorized demo session</strong><small>Patient confirmation recorded · Session expires in 11h 42m</small></span></div><PageHead eyebrow="Protected patient record" title="Maria Santos" text="CL-2025-0842 · 56 years old · Barangay Maligaya" actions={<Button icon="consult" onClick={() => go("consultations")}>Start consultation</Button>}/><div className="record-tabs"><button className="active">Summary</button><button>Screenings</button><button>Consultations</button><button>Prescriptions</button><button>Referrals</button></div><div className="record-grid"><Card><h2>Care summary</h2><div className="summary-lines"><span>Latest screening <Badge tone="amber">Monitor</Badge></span><span>Active referral <Badge tone="gray">None</Badge></span><span>Current prescription <strong>1 active</strong></span></div></Card><Card><h2>Follow-up information</h2><div className="followup"><Icon name="consult"/><span><strong>27 June 2025 · 9:00 AM</strong><small>Barangay Maligaya Health Center</small></span></div></Card></div><Card><h2>Recent record history</h2><div className="timeline"><div><i></i><span><Badge tone="amber">Monitor</Badge><strong>Community screening</strong><small>18 June 2025 · Observations available in screening details</small></span></div><div><i></i><span><Badge tone="blue">Consultation</Badge><strong>Rural Health Unit</strong><small>14 March 2025 · Patient instructions recorded</small></span></div></div></Card></>;
}

function Consultation({ go }: { go: (screen: string) => void }) {
  const [saved, setSaved] = useState(false);
  return <><PageHead eyebrow="Authorized session · Maria Santos" title="New consultation" text="Record this care event using demo information only."/><Card className="consult-form"><div className="form-grid"><Field label="Consultation date" type="date" value="2025-06-25"/><Field label="Facility" value="San Isidro District Hospital"/><Field label="Reason for visit" placeholder="Patient-reported reason"/><Field label="Follow-up date" type="date"/></div><Field label="Consultation observations" placeholder="Enter relevant demo observations"><textarea rows={5} placeholder="Enter relevant demo observations only"></textarea></Field><div className="note-choice"><div><Icon name="note"/><span><strong>Patient instructions</strong><small>Visible to patient, BHW, and physician</small></span></div><div><Icon name="shield"/><span><strong>Clinical note</strong><small>Visible to patient and physician only</small></span></div></div><div className="form-actions"><Button variant="secondary" onClick={() => go("patient-record")}>Cancel</Button><Button onClick={() => setSaved(true)}>Save consultation</Button></div></Card>{saved && <div className="toast granted"><Icon name="check"/><span><strong>Consultation saved</strong><small>You can now add notes or issue a prescription.</small></span><Button variant="secondary" onClick={() => go("notes")}>Add notes</Button><Button onClick={() => go("prescriptions")}>Create prescription</Button></div>}</>;
}

function AdminOverview({ go }: { go: (screen: string) => void }) {
  return <><div className="admin-banner"><Icon name="shield"/><span><strong>Authenticated administrator session</strong><small>Aggregate data access · Asia/Manila</small></span></div><PageHead eyebrow="System administration" title="CareLink overview" text="Aggregate system activity across participating barangays."/><div className="stats-grid"><Stat label="Registered patients" value="18,420" detail="+4.8% this quarter" icon="people"/><Stat label="Active BHW accounts" value="146" detail="32 barangays" icon="home" tone="teal"/><Stat label="Approved physicians" value="78" detail="4 pending review" icon="consult" tone="green"/><Stat label="Total screenings" value="12,608" detail="January–June 2025" icon="screening" tone="amber"/></div><div className="dashboard-grid"><Card><div className="card-head"><div><h2>System activity</h2><p>Last 6 months · aggregate events</p></div><button className="text-button" onClick={() => go("statistics")}>View statistics</button></div><div className="bar-chart">{[42,55,48,68,75,86].map((h, i) => <div key={i}><span style={{height:`${h}%`}}></span><small>{["Jan","Feb","Mar","Apr","May","Jun"][i]}</small></div>)}</div></Card><Card><div className="card-head"><div><h2>Administrative queue</h2><p>Permitted account actions only</p></div></div><div className="task-list"><button onClick={() => go("approvals")}><span className="task-icon"><Icon name="approve"/></span><span><strong>Physician applications</strong><small>4 pending review</small></span><Badge tone="amber">4</Badge></button><button onClick={() => go("accounts")}><span className="task-icon"><Icon name="people"/></span><span><strong>BHW account requests</strong><small>2 ready to seed</small></span><Badge tone="blue">2</Badge></button><button onClick={() => go("audit")}><span className="task-icon"><Icon name="shield"/></span><span><strong>Audit events</strong><small>1,248 events today</small></span><Icon name="chevron"/></button></div></Card></div><div className="disclaimer"><Icon name="shield"/><p><strong>Restricted administrator role.</strong> Administrators can view aggregate information, reports, pseudonymized audit events, physician approvals, and permitted BHW account seeding. They cannot edit patient medical records.</p></div></>;
}

function Statistics() {
  return <><PageHead title="System statistics" text="Aggregate, non-identifying trends for public health administration." actions={<select className="head-select"><option>January–June 2025</option><option>Last 30 days</option></select>}/><div className="dashboard-grid"><Card><h2>Registration trends</h2><div className="bar-chart large">{[35,45,52,60,73,82].map((h, i) => <div key={i}><span style={{height:`${h}%`}}></span><small>{["Jan","Feb","Mar","Apr","May","Jun"][i]}</small></div>)}</div></Card><Card><h2>Screening outcomes</h2><div className="donut-wrap"><div className="donut"></div><div className="chart-legend"><span><i className="green"></i>Normal <b>68%</b></span><span><i className="amber"></i>Monitor <b>22%</b></span><span><i className="red"></i>Needs Referral <b>10%</b></span></div></div></Card></div><Card><h2>Barangay-level totals</h2><div className="mini-table"><div className="table-row table-header"><span>Barangay</span><span>Registered</span><span>Screened</span><span>Referrals</span><span>Follow-up rate</span></div>{[["Maligaya","1,284","1,032","84","82%"],["San Roque","1,096","864","62","79%"],["Mabini","978","801","55","85%"],["Pag-asa","862","710","47","76%"]].map((r) => <div className="table-row" key={r[0]}>{r.map(c => <span key={c}>{c}</span>)}</div>)}</div></Card></>;
}

function AdminReports() {
  const [preview, setPreview] = useState(false);
  return <><PageHead title="Generate aggregate report" text="Create privacy-conscious reports suitable for government health administration."/><div className="report-layout"><Card><h2>Report settings</h2><Field label="Report type"><select><option>Monthly screening coverage</option><option>Referral outcomes</option><option>Registration summary</option></select></Field><div className="form-grid"><Field label="Start date" type="date" value="2025-06-01"/><Field label="End date" type="date" value="2025-06-30"/></div><Field label="Barangay"><select><option>All participating barangays</option><option>Barangay Maligaya</option></select></Field><div className="notice"><Icon name="shield"/><span>This report contains aggregate totals only. Patient names and clinical information are excluded.</span></div><Button className="full" onClick={() => setPreview(true)}>Generate preview</Button></Card>{preview ? <Card className="report-preview"><div className="report-paper"><Logo/><span>MONTHLY SCREENING COVERAGE</span><h2>June 2025</h2><div className="report-kpis"><div><strong>2,148</strong><small>Residents screened</small></div><div><strong>78%</strong><small>Household coverage</small></div><div><strong>186</strong><small>Referrals sent</small></div></div><div className="fake-lines"><i></i><i></i><i></i><i></i></div><small>Generated from fictional prototype data · Asia/Manila</small></div><Button icon="download" onClick={() => alert("Aggregate report export simulated.")}>Export / print report</Button></Card> : <Card className="empty-preview"><Icon name="report" size={34}/><h2>Report preview</h2><p>Choose your filters and generate a preview. No personally identifiable information will appear.</p></Card>}</div></>;
}

function AuditLogs() {
  const [role, setRole] = useState("All roles");
  const events = [["USR-DOC-218","Physician","record_view","25 Jun 2025 · 10:42"],["USR-BHW-047","Barangay Staff","citizen_verified","25 Jun 2025 · 10:18"],["USR-ADM-004","Administrator","doctor_approved","25 Jun 2025 · 9:56"],["USR-CIT-842","Patient","rx_view","25 Jun 2025 · 9:22"]];
  return <><PageHead title="Audit logs" text="Pseudonymized system events. Patient names and medical details are not displayed."/><Card><div className="filters"><Field label="From"><input type="date" defaultValue="2025-06-25"/></Field><Field label="To"><input type="date" defaultValue="2025-06-25"/></Field><label className="field"><span>Role</span><select value={role} onChange={(e) => setRole(e.target.value)}><option>All roles</option><option>Physician</option><option>Barangay Staff</option><option>Administrator</option><option>Patient</option></select></label></div><div className="mini-table audit-table"><div className="table-row table-header"><span>UserID</span><span>Role</span><span>Action</span><span>Timestamp</span><span>Event detail</span></div>{events.filter(e => role === "All roles" || e[1] === role).map((e) => <div className="table-row" key={e[0]+e[2]}><span><code>{e[0]}</code></span><span>{e[1]}</span><span><Badge tone="blue">{e[2]}</Badge></span><span>{e[3]}</span><span>Authorized system event · View details</span></div>)}</div></Card></>;
}

function Approvals() {
  const [modal, setModal] = useState(false);
  const [approved, setApproved] = useState(false);
  return <><PageHead title="Physician approval" text="Review identity and supporting-document status before account activation."/><Card><div className="approval-card"><div className="applicant"><span>DM</span><div><h2>Applicant DOC-2025-014</h2><p>doctor.mendoza@example.demo</p></div></div><Badge tone={approved ? "green" : "amber"}>{approved ? "Approved" : "Pending review"}</Badge><dl><div><dt>PRC ID</dt><dd>DEMO-48291</dd></div><div><dt>Application date</dt><dd>23 June 2025</dd></div><div><dt>Supporting documents</dt><dd><Badge tone="green">Review complete</Badge></dd></div></dl>{!approved && <div className="form-actions"><Button variant="danger">Reject</Button><Button onClick={() => setModal(true)}>Approve physician</Button></div>}</div></Card>{modal && <Modal title="Approve physician application?" onClose={() => setModal(false)} actions={<><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => {setApproved(true);setModal(false)}}>Confirm approval</Button></>}><p>This activates the physician’s CareLink account. The approval action will be represented in the audit log.</p></Modal>}</>;
}

function GenericPage({ screen, role }: { screen: string; role: Role }) {
  const labels: Record<string, string> = { households: "Households", "add-patient": "Add a resident", reports: "Reports", settings: "Profile & Settings", accounts: "BHW Account Management" };
  const title = labels[screen] || nav[role].find(n => n.id === screen)?.label || "CareLink";
  if (screen === "add-patient") return <><PageHead title="Create account for a resident" text="For Barangay Maligaya residents who have not registered themselves."/><Card className="generic-form"><div className="notice"><Icon name="people"/><span>Check the masterlist for duplicates before creating an account. The patient code is assigned by the server in a production system.</span></div><div className="form-grid"><Field label="Full name *" placeholder="First, middle, last name"/><Field label="Sex *"><select><option>Female</option><option>Male</option></select></Field><Field label="Birthday *" type="date"/><Field label="Household *"><select><option>HH-058 · Purok 2</option><option>Create new household</option></select></Field><Field label="Contact number" placeholder="09XX XXX XXXX"/><Field label="Temporary claim method"><select><option>One-time claim code</option></select></Field></div><div className="form-actions"><Button variant="secondary">Cancel</Button><Button>Create resident account</Button></div></Card></>;
  return <><PageHead title={title} text={`${roleMeta[role].label} workspace · interactive prototype`}/><Card className="empty-preview"><Icon name={screen === "settings" ? "settings" : "report"} size={34}/><h2>{title}</h2><p>This supporting workspace is represented in the connected CareLink prototype. Use the main navigation to explore the primary demonstration flows.</p><Button variant="secondary">View demo state</Button></Card></>;
}

function AppShell({ role, screen, setScreen, logout, theme, setTheme, fontSize, setFontSize }: { role: Role; screen: string; setScreen: (screen: string) => void; logout: () => void; theme: string; setTheme: (theme: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = nav[role].find((item) => item.id === screen)?.label || "Patient Profile";
  const initials = role === "citizen" ? "MS" : role === "barangay_staff" ? "AR" : role === "physician" ? "PM" : "SA";
  const render = () => {
    if (role === "barangay_staff") {
      if (screen === "dashboard") return <StaffDashboard go={setScreen}/>;
      if (screen === "masterlist") return <Masterlist go={setScreen}/>;
      if (screen === "patient-profile") return <PatientProfile go={setScreen}/>;
      if (screen === "screening") return <Screening go={setScreen}/>;
      if (screen === "referrals") return <ReferralPage/>;
      if (screen === "id-cards") return <HealthCard/>;
    }
    if (role === "citizen") {
      if (screen === "home") return <PatientHome go={setScreen}/>;
      if (screen === "card") return <HealthCard consentFlow/>;
      if (screen === "record") return <MedicalRecord/>;
      if (screen === "prescriptions") return <Prescription/>;
      if (screen === "notes") return <Notes/>;
      if (screen === "access") return <AccessHistory/>;
    }
    if (role === "physician") {
      if (screen === "dashboard") return <DoctorDashboard go={setScreen}/>;
      if (screen === "lookup") return <PatientLookup go={setScreen}/>;
      if (screen === "patient-record") return <DoctorRecord go={setScreen}/>;
      if (screen === "consultations") return <Consultation go={setScreen}/>;
      if (screen === "notes") return <Notes doctor/>;
      if (screen === "prescriptions") return <Prescription doctor/>;
      if (screen === "referrals") return <ReferralPage/>;
    }
    if (role === "admin") {
      if (screen === "overview") return <AdminOverview go={setScreen}/>;
      if (screen === "statistics") return <Statistics/>;
      if (screen === "reports") return <AdminReports/>;
      if (screen === "audit") return <AuditLogs/>;
      if (screen === "approvals") return <Approvals/>;
    }
    return <GenericPage screen={screen} role={role}/>;
  };
  const importantNav = nav[role].slice(0, role === "citizen" ? 4 : 5);
  return <div className={`app-shell role-${role}`}>
    <aside className={menuOpen ? "sidebar open" : "sidebar"}><div className="sidebar-brand"><Logo/><button className="mobile-close" onClick={() => setMenuOpen(false)}><Icon name="close"/></button></div><div className="role-chip"><span>{initials}</span><div><strong>{role === "citizen" ? "Maria Santos" : role === "barangay_staff" ? "Ana Reyes" : role === "physician" ? "Dr. Paolo Mendoza" : "System Admin"}</strong><small>{roleMeta[role].subtitle}</small></div></div><nav>{nav[role].map((item) => <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => {setScreen(item.id);setMenuOpen(false)}}><Icon name={item.icon}/><span>{item.label}</span>{screen === item.id && <i></i>}</button>)}</nav><div className="sidebar-foot"><div className="sync-status"><i></i><span><strong>{role === "barangay_staff" ? "All changes synced" : "Secure demo session"}</strong><small>{role === "barangay_staff" ? "Updated just now" : "Prototype only"}</small></span></div><button onClick={logout}><Icon name="logout"/><span>Sign out</span></button></div></aside>
    {menuOpen && <div className="drawer-shade" onClick={() => setMenuOpen(false)}></div>}
    <div className="app-main"><header className="topbar"><div><button className="menu-button" onClick={() => setMenuOpen(true)}><Icon name="menu"/></button><span className="mobile-title">{title}</span></div><div className="top-actions"><ThemeTools {...{theme,setTheme,fontSize,setFontSize}}/><button className="icon-btn notification" aria-label="Notifications"><Icon name="bell"/><i></i></button><button className="user-menu"><span>{initials}</span><div><strong>{roleMeta[role].label}</strong><small>View profile</small></div></button></div></header><main className="content">{render()}</main></div>
    <nav className="bottom-nav">{importantNav.map((item) => <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => setScreen(item.id)}><Icon name={item.icon}/><span>{item.label.split(" ")[0]}</span></button>)}<button onClick={() => setMenuOpen(true)}><Icon name="menu"/><span>More</span></button></nav>
  </div>;
}

export default function App() {
  const [view, setView] = useState<"login" | "register">("login");
  const [registerKind, setRegisterKind] = useState<"patient" | "staff">("patient");
  const [role, setRole] = useState<Role | null>(null);
  const [screen, setScreen] = useState("home");
  const [theme, setTheme] = useState(localStorage.getItem("carelink-theme") || "light");
  const [fontSize, setFontSize] = useState<FontSize>((localStorage.getItem("carelink-font") as FontSize) || "default");
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("carelink-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.dataset.font = fontSize; localStorage.setItem("carelink-font", fontSize); }, [fontSize]);
  useEffect(() => {
    if (window.location.pathname === "/admin-demo") { setRole("admin"); setScreen("overview"); }
  }, []);
  const login = (nextRole: Role) => { setRole(nextRole); setScreen(roleMeta[nextRole].initial); };
  const register = (kind: "patient" | "staff") => { setRegisterKind(kind); setView("register"); };
  if (!role) {
    if (view === "register") return <Registration kind={registerKind} onBack={() => setView("login")}/>;
    return <Login onLogin={login} onRegister={register} {...{theme,setTheme,fontSize,setFontSize}}/>;
  }
  return <AppShell role={role} screen={screen} setScreen={setScreen} logout={() => {setRole(null);setView("login")}} {...{theme,setTheme,fontSize,setFontSize}}/>;
}
