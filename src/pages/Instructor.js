import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import AddCourseForm from "../components/AddCourseForm";

const InstructorPage = () => {
  const [courses, setCourses]               = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData]             = useState({
    publisher: "", title: "", author: "",
    isbn: "", edition: "", quantity: "", otherMaterials: "",
  });
  const [submissions, setSubmissions]       = useState([]);
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(true);
  const [submitSuccess, setSubmitSuccess]   = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const instructorName = localStorage.getItem("fullName") || "Instructor";
  const firstName      = instructorName.split(" ")[0];
  const userId         = localStorage.getItem("userId");

  // ── Fetch courses ──────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    if (!userId) { setError("No user ID found. Please log in again."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setCourses(data.courses || []);
      else        setError(data.message || "Failed to fetch courses.");
    } catch (err) {
      setError(err.message || "Network error.");
    } finally { setLoading(false); }
  };

  // ── Fetch submissions ──────────────────────────────────────────────────────
  const fetchSubmissions = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`http://localhost:5009/api/instructor-submissions?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("[ERROR] Fetching submissions:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchSubmissions();
  }, []);

  // ── Select course → load textbook ──────────────────────────────────────────
  const handleSelectCourse = async (course) => {
    if (selectedCourse?.course_id === course.course_id) {
      setSelectedCourse(null); return;
    }
    setSelectedCourse(course); setSubmitSuccess(false);
    try {
      const res  = await fetch(`http://localhost:5009/api/textbooks/${course.course_id}`);
      const data = await res.json();
      if (res.ok && data.course) {
        const t = data.course;
        setFormData({
          publisher: t.publisher || "", title: t.title || "",
          author: t.author || "", isbn: t.isbn || "",
          edition: t.edition || "", quantity: t.quantity || "",
          otherMaterials: t.other_materials || "",
        });
      } else {
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
      }
    } catch (err) { console.error("[ERROR] Fetching textbook:", err); }
  };

  // ── Submit form ────────────────────────────────────────────────────────────
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.publisher.trim()) {
      alert("Please fill in at least Title, Author, and Publisher.");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) < 1) {
      alert("Quantity must be at least 1.");
      return;
    }
    setIsSubmitting(true); setSubmitSuccess(false);
    try {
      const res = await fetch("http://localhost:5009/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId:       selectedCourse.course_id,
          publisher:      formData.publisher,
          title:          formData.title,
          author:         formData.author,
          isbn:           formData.isbn,
          edition:        formData.edition,
          quantity:       formData.quantity,
          otherMaterials: formData.otherMaterials,
          requestedBy:    userId,
          approvedBy:     selectedCourse.hod_id,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setSelectedCourse(null);
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
        fetchSubmissions(); // refresh the submissions list
      } else {
        alert(result.message || "Failed to submit the form.");
      }
    } catch (err) {
      alert("Error submitting the form.");
    } finally { setIsSubmitting(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();

  const badgeStyle = (status) => {
    if (status === "Approved") return styles.badgeApproved;
    if (status === "Rejected") return styles.badgeRejected;
    return styles.badgePending;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Merriweather:ital,wght@0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F3F1; }

        .course-scroll::-webkit-scrollbar { height: 4px; }
        .course-scroll::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 2px; }
        .course-scroll::-webkit-scrollbar-thumb { background: #FBA45C; border-radius: 2px; }

        .sub-scroll::-webkit-scrollbar { width: 4px; }
        .sub-scroll::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 2px; }
        .sub-scroll::-webkit-scrollbar-thumb { background: #FBA45C; border-radius: 2px; }

        .tile-btn { background: none; border: none; padding: 0; cursor: pointer; text-align: left; }
        .inp-field:focus { outline: none; border-color: #E56515; background: #fff; box-shadow: 0 0 0 3px rgba(229,101,21,.1); }
      `}</style>

      <div style={styles.root}>

        {/* Top bar */}
        <nav style={styles.topbar}>
          <div style={styles.brandWrap}>
            <span style={styles.brand}>MVSU</span>
            <span style={styles.brandSub}>Textbook Adoption Portal</span>
          </div>
          <LogoutButton />
        </nav>

        <div style={styles.page}>

          {/* Greeting */}
          <div style={styles.greeting}>
            <p style={styles.eyebrow}>Instructor Portal</p>
            <h1 style={styles.greetingName}>
              Good morning, <em style={{ fontStyle: "italic", color: "#E56515" }}>{firstName}.</em>
            </h1>
          </div>

          {/* Success banner */}
          {submitSuccess && (
            <div style={styles.successBanner}>
              Textbook adoption form submitted successfully. Your Head of Department will review it shortly.
            </div>
          )}

          {/* ── Add Course ── */}
          <SectionHeader title="Add a Course" />
          <div style={styles.addCard}>
            <AddCourseForm
              colors={{ steelBlue: "#E56515", lightBlue: "#FFF6EE", paleBlue: "#F8F8F8", white: "#fff", darkText: "#2a2a2a" }}
              onCourseAdded={fetchCourses}
            />
          </div>

          {/* ── Your Courses ── */}
          <SectionHeader title="Your Courses" />
          {loading ? (
            <p style={styles.muted}>Loading courses...</p>
          ) : error ? (
            <p style={{ color: "#c0392b", fontSize: "14px" }}>{error}</p>
          ) : courses.length === 0 ? (
            <p style={styles.muted}>No courses added yet. Use the form above to add your first course.</p>
          ) : (
            <div className="course-scroll" style={styles.courseScrollWrap}>
              <div style={styles.courseRow}>
                {courses.map((course) => (
                  <button
                    key={course.course_id}
                    className="tile-btn"
                    style={{
                      ...styles.tile,
                      borderColor: selectedCourse?.course_id === course.course_id ? "#E56515" : "#CDCDCB",
                      background: selectedCourse?.course_id === course.course_id ? "#FFF2E5" : "#fff",
                    }}
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div style={{
                      ...styles.tileTopBar,
                      background: selectedCourse?.course_id === course.course_id ? "#E56515" : "#CDCDCB",
                    }} />
                    <div style={styles.tileInitial}>{getInitial(course.course_name)}</div>
                    <div style={styles.tileNum}>{course.course_number}</div>
                    <div style={styles.tileName}>{course.course_name}</div>
                    <div style={styles.tileTerm}>{course.term}</div>
                    <div style={styles.tileCta}>
                      {selectedCourse?.course_id === course.course_id ? "Close form" : "Fill textbook form"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Textbook Adoption Form ── */}
          {selectedCourse && (
            <>
              <SectionHeader title="Textbook Adoption Form" />
              <div style={styles.formCard}>
                <div style={styles.formCardHead}>
                  <p style={styles.formCardCourse}>{selectedCourse.course_name}</p>
                  <div style={styles.formCardMeta}>
                    <span style={styles.metaAccent}>{selectedCourse.course_number}</span>
                    <span style={styles.metaMuted}>{selectedCourse.term}</span>
                    <span style={styles.metaMuted}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitForm}>
                  <div style={styles.formGrid}>
                    <div>
                      <Field label="Title *" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} placeholder="e.g. Algebra Basics" />
                      <Field label="Author *" value={formData.author} onChange={(v) => setFormData({ ...formData, author: v })} placeholder="e.g. John Algebra" />
                      <Field label="Publisher *" value={formData.publisher} onChange={(v) => setFormData({ ...formData, publisher: v })} placeholder="e.g. Pearson" />
                    </div>
                    <div>
                      <Field label="ISBN" value={formData.isbn} onChange={(v) => setFormData({ ...formData, isbn: v })} placeholder="e.g. 978-0-13-468599-1" />
                      <Field label="Edition" value={formData.edition} onChange={(v) => setFormData({ ...formData, edition: v })} placeholder="e.g. 1st" />
                      <Field label="Quantity *" type="number" value={formData.quantity} onChange={(v) => setFormData({ ...formData, quantity: v })} placeholder="e.g. 30" />
                    </div>
                  </div>

                  <div style={{ marginBottom: "4px" }}>
                    <label style={styles.fieldLabel}>Other Materials / Notes</label>
                    <textarea
                      className="inp-field"
                      value={formData.otherMaterials}
                      onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
                      placeholder="e.g. Lab manual, access code, etc."
                      style={{ ...styles.inp, height: "80px", resize: "vertical" }}
                    />
                  </div>

                  <hr style={styles.divider} />

                  <button type="submit" style={styles.btnOrange} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit for Approval"}
                  </button>
                  <button type="button" style={styles.btnOutline} onClick={() => setSelectedCourse(null)}>
                    Cancel
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── Previously Submitted Forms ── */}
          <SectionHeader title="Previously Submitted Forms" />
          {submissions.length === 0 ? (
            <p style={styles.muted}>No submissions yet.</p>
          ) : (
            <div className="sub-scroll" style={styles.subScroll}>
              {submissions.map((s) => (
                <div key={s.request_id} style={styles.subItem}>
                  <div style={styles.subLeft}>
                    <span style={styles.subCourse}>{s.course_name}</span>
                    <span style={styles.subBook}>
                      {s.title} &mdash; {s.author} &mdash; {s.publisher}
                    </span>
                  </div>
                  <div style={styles.subRight}>
                    <span style={styles.subDate}>{formatDate(s.created_at)}</span>
                    <span style={styles.subTerm}>{s.term}</span>
                    <span style={badgeStyle(s.status)}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionHeader = ({ title }) => (
  <div style={{ marginTop: "36px", marginBottom: "16px" }}>
    <p style={{ fontSize: "11px", fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase", color: "#919599" }}>{title}</p>
    <hr style={{ border: "none", borderTop: "2px solid #2a2a2a", marginTop: "6px" }} />
  </div>
);

const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
    <label style={styles.fieldLabel}>{label}</label>
    <input
      className="inp-field"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={styles.inp}
      min={type === "number" ? "1" : undefined}
    />
  </div>
);

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: { fontFamily: "'Lato', sans-serif", background: "#F4F3F1", minHeight: "100vh", color: "#2a2a2a" },
  topbar: { background: "#E56515", padding: "0 36px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brandWrap: { display: "flex", alignItems: "baseline", gap: "10px" },
  brand: { fontFamily: "'Merriweather', serif", fontSize: "18px", color: "#fff" },
  brandSub: { fontSize: "12px", color: "#FDDCBC", fontWeight: 400, letterSpacing: ".04em" },
  page: { maxWidth: "940px", margin: "0 auto", padding: "44px 28px 80px" },
  greeting: { marginBottom: "40px", paddingBottom: "28px", borderBottom: "1px solid #CDCDCB" },
  eyebrow: { fontSize: "11px", fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase", color: "#919599", marginBottom: "8px" },
  greetingName: { fontFamily: "'Merriweather', serif", fontSize: "32px", color: "#2a2a2a", lineHeight: 1.15 },
  successBanner: { background: "#FFF2E5", border: "1.5px solid #FBA45C", borderRadius: "4px", padding: "12px 18px", color: "#E56515", fontWeight: 700, fontSize: "14px", marginBottom: "20px" },
  addCard: { background: "#fff", borderRadius: "4px", borderLeft: "5px solid #E56515", padding: "4px 0 4px 0", overflow: "hidden" },
  courseScrollWrap: { overflowX: "auto", paddingBottom: "8px" },
  courseRow: { display: "flex", gap: "14px", width: "max-content" },
  tile: { position: "relative", borderRadius: "4px", border: "1.5px solid #CDCDCB", padding: "20px 18px 16px", overflow: "hidden", width: "220px", flexShrink: 0, transition: "border-color .18s" },
  tileTopBar: { position: "absolute", top: 0, left: 0, right: 0, height: "3px", transition: "background .18s" },
  tileInitial: { position: "absolute", bottom: "-8px", right: "10px", fontFamily: "'Merriweather', serif", fontSize: "64px", fontWeight: 700, color: "#F4F3F1", lineHeight: 1, pointerEvents: "none" },
  tileNum: { fontSize: "11px", fontWeight: 900, letterSpacing: ".08em", color: "#E56515", textTransform: "uppercase", marginBottom: "2px", position: "relative" },
  tileName: { fontSize: "14px", fontWeight: 700, color: "#2a2a2a", marginBottom: "4px", position: "relative" },
  tileTerm: { fontSize: "12px", color: "#919599", fontWeight: 700, position: "relative" },
  tileCta: { marginTop: "14px", fontSize: "11px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: "#E56515", position: "relative" },
  formCard: { background: "#fff", borderRadius: "4px", padding: "28px 32px" },
  formCardHead: { marginBottom: "22px", paddingBottom: "18px", borderBottom: "1px solid #F0EDE8" },
  formCardCourse: { fontFamily: "'Merriweather', serif", fontSize: "19px", color: "#2a2a2a" },
  formCardMeta: { display: "flex", gap: "20px", marginTop: "6px" },
  metaAccent: { fontSize: "11px", color: "#E56515", fontWeight: 700 },
  metaMuted: { fontSize: "11px", color: "#919599", fontWeight: 700 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" },
  fieldLabel: { fontSize: "10px", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#919599" },
  inp: { padding: "10px 13px", borderRadius: "4px", border: "1.5px solid #CDCDCB", background: "#F8F8F8", color: "#2a2a2a", fontSize: "14px", fontFamily: "'Lato', sans-serif", width: "100%", transition: "border-color .15s, background .15s" },
  divider: { border: "none", borderTop: "1px solid #F0EDE8", margin: "22px 0" },
  btnOrange: { background: "#E56515", color: "#fff", border: "none", borderRadius: "4px", padding: "11px 24px", fontSize: "13px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },
  btnOutline: { background: "transparent", color: "#E56515", border: "2px solid #E56515", borderRadius: "4px", padding: "9px 20px", fontSize: "13px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase", marginLeft: "10px" },
  muted: { color: "#919599", fontSize: "14px", fontWeight: 700 },
  subScroll: { height: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "6px" },
  subItem: { background: "#fff", borderRadius: "4px", border: "1.5px solid #CDCDCB", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexShrink: 0 },
  subLeft: { display: "flex", flexDirection: "column", gap: "3px", flex: 1 },
  subCourse: { fontSize: "14px", fontWeight: 700, color: "#2a2a2a" },
  subBook: { fontSize: "12px", color: "#919599" },
  subRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 },
  subDate: { fontSize: "11px", color: "#919599", fontWeight: 700 },
  subTerm: { fontSize: "11px", color: "#CDCDCB", fontWeight: 700 },
  badgePending:  { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#FFF2E5", color: "#E56515" },
  badgeApproved: { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#E8F6EE", color: "#1a7a4a" },
  badgeRejected: { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#FEF0F0", color: "#c0392b" },
};

export default InstructorPage;