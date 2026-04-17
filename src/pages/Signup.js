import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName:  "",
    lastName:   "",
    email:      "",
    phone:      "",
    role:       "Instructor",
    department: "",
    password:   "",
    confirm:    "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      alert("Passwords do not match."); return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5009/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName:  formData.firstName,
          lastName:   formData.lastName,
          email:      formData.email,
          phone:      formData.phone,
          role:       formData.role,
          department: formData.department,
          password:   formData.password,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        alert("Account created successfully! Please sign in.");
        navigate("/");
      } else {
        alert(result.message || "Error creating account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  const showDept = formData.role === "Instructor" || formData.role === "Head of Department";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        .su-input:focus { outline: none; border-color: #E56515 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(229,101,21,.1) !important; }
        .su-btn:hover { background: #CC5A12 !important; }
        .su-back:hover { color: #CC5A12 !important; }
      `}</style>

      <div style={S.page}>

        {/* Left panel */}
        <div style={S.left}>
          <div style={S.leftInner}>
            <div style={S.logoRow}>
              <div style={S.logobox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
              </div>
              <div>
                <div style={S.logoText}>MVSU</div>
                <div style={S.logoSub}>Textbook Adoption Portal</div>
              </div>
            </div>

            <div style={S.heroText}>
              <div style={S.eyebrow}>Join the Portal</div>
              <h1 style={S.hero}>Get started<br /><em style={S.heroEm}>in minutes.</em></h1>
              <p style={S.heroSub}>Create your account to start submitting and managing textbook adoption requests for your courses.</p>
            </div>

            <div style={S.steps}>
              {[["1", "Create your account"], ["2", "Add your courses"], ["3", "Submit adoption forms"]].map(([n, t]) => (
                <div key={n} style={S.step}>
                  <div style={S.stepNum}>{n}</div>
                  <div style={S.stepText}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={S.right}>
          <div style={S.formCard}>
            <div style={S.formTop}>
              <h2 style={S.formTitle}>Create account</h2>
              <p style={S.formSub}>Fill in your details below to get started</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Name row */}
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>First name</label>
                  <input className="su-input" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jane" required style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Last name</label>
                  <input className="su-input" type="text" name="lastName"  value={formData.lastName}  onChange={handleChange} placeholder="Smith" required style={S.input} />
                </div>
              </div>

              {/* Email */}
              <div style={S.field}>
                <label style={S.label}>Email address</label>
                <input className="su-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@mvsu.edu" required style={S.input} />
              </div>

              {/* Phone */}
              <div style={S.field}>
                <label style={S.label}>Phone number <span style={S.optional}>(optional)</span></label>
                <input className="su-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="601-000-0000" style={S.input} />
              </div>

              {/* Role */}
              <div style={S.field}>
                <label style={S.label}>Role</label>
                <select className="su-input" name="role" value={formData.role} onChange={handleChange} required style={S.input}>
                  <option value="Instructor">Instructor</option>
                  <option value="Head of Department">Head of Department</option>
                  <option value="Bookstore">Bookstore</option>
                </select>
              </div>

              {/* Department — shown for Instructor and HoD */}
              {showDept && (
                <div style={S.field}>
                  <label style={S.label}>Department <span style={S.optional}>(optional — add to database later)</span></label>
                  <input className="su-input" type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Computer Science" style={S.input} />
                </div>
              )}

              {/* Password row */}
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>Password</label>
                  <input className="su-input" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" required style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Confirm password</label>
                  <input className="su-input" type="password" name="confirm" value={formData.confirm} onChange={handleChange} placeholder="Repeat password" required style={S.input} />
                </div>
              </div>

              <button className="su-btn" type="submit" style={S.btn} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div style={S.divider}><span style={S.dividerText}>Already have an account?</span></div>

            <button className="su-back" style={S.backBtn} onClick={() => navigate("/")}>
              Sign in instead →
            </button>

          </div>
        </div>
      </div>
    </>
  );
};

const S = {
  page:      { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  left:      { flex: "0 0 380px", background: "#E56515", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 36px", position: "relative", overflow: "hidden" },
  leftInner: { maxWidth: 320, position: "relative", zIndex: 1 },

  logoRow:   { display: "flex", alignItems: "center", gap: 12, marginBottom: 48 },
  logobox:   { width: 38, height: 38, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,.25)" },
  logoText:  { fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#fff", fontWeight: 700 },
  logoSub:   { fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 1, letterSpacing: ".03em" },

  heroText:  { marginBottom: 36 },
  eyebrow:   { fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 12 },
  hero:      { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.18, marginBottom: 14, letterSpacing: "-.02em" },
  heroEm:    { fontStyle: "italic", color: "rgba(255,255,255,.85)" },
  heroSub:   { fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.65 },

  steps:     { display: "flex", flexDirection: "column", gap: 12 },
  step:      { display: "flex", alignItems: "center", gap: 12 },
  stepNum:   { width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
  stepText:  { fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 500 },

  right:     { flex: 1, background: "#F8F8F8", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", overflowY: "auto" },
  formCard:  { width: "100%", maxWidth: 500, background: "#fff", borderRadius: 16, border: "1px solid #EBEBEB", boxShadow: "0 4px 24px rgba(0,0,0,.07)", padding: "36px 32px" },

  formTop:   { marginBottom: 24 },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-.02em", marginBottom: 5 },
  formSub:   { fontSize: 13, color: "#919599" },

  row2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" },
  field:     { marginBottom: 15 },
  label:     { display: "block", fontSize: 12, fontWeight: 600, color: "#1C1C1E", marginBottom: 5, letterSpacing: ".01em" },
  optional:  { fontWeight: 400, color: "#CDCDCB", fontSize: 11 },
  input:     { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #CDCDCB", background: "#F8F8F8", fontSize: 13, color: "#1C1C1E", fontFamily: "'Inter', sans-serif", transition: "all .15s" },

  btn:       { width: "100%", padding: "12px", background: "#E56515", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6, transition: "background .15s", letterSpacing: ".02em", fontFamily: "'Inter', sans-serif" },

  divider:   { margin: "22px 0", textAlign: "center" },
  dividerText: { fontSize: 12, color: "#CDCDCB", background: "#fff", padding: "0 10px" },

  backBtn:   { width: "100%", padding: "11px", background: "transparent", color: "#E56515", border: "1.5px solid rgba(229,101,21,.3)", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "color .15s", fontFamily: "'Inter', sans-serif" },
};

export default Signup;