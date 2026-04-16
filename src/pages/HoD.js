import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import AddCourseForm from "../components/AddCourseForm";

const HoDPage = () => {
  // ── Instructor-side state ───────────────────────────────────────────────
  const [courses, setCourses]             = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData]           = useState({
    publisher: "", title: "", author: "",
    isbn: "", edition: "", quantity: "", otherMaterials: "",
  });
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // ── HoD-side state ─────────────────────────────────────────────────────
  const [deptForms, setDeptForms]         = useState([]);
  const [loadingDept, setLoadingDept]     = useState(true);
  const [activeTab, setActiveTab]         = useState("Pending");
  const [expandedIds, setExpandedIds]     = useState(new Set());
  const [rejectingId, setRejectingId]     = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError]     = useState("");

  const hodName  = localStorage.getItem("fullName") || "Head of Department";
  const firstName = hodName.split(" ")[0];
  const userId   = localStorage.getItem("userId");

  // ── Fetch courses (instructor-side) ────────────────────────────────────
  const fetchCourses = async () => {
    if (!userId) { setCoursesError("No user ID found. Please log in again."); setLoadingCourses(false); return; }
    setLoadingCourses(true); setCoursesError("");
    try {
      const res  = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setCourses(data.courses || []);
      else        setCoursesError(data.message || "Failed to fetch courses.");
    } catch (err) {
      setCoursesError(err.message || "Network error.");
    } finally { setLoadingCourses(false); }
  };

  // ── Fetch own submissions (instructor-side) ────────────────────────────
  const fetchMySubmissions = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`http://localhost:5009/api/instructor-submissions?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setMySubmissions(data.submissions || []);
    } catch (err) { console.error("[ERROR] Fetching own submissions:", err); }
  };

  // ── Fetch department forms (HoD-side) ─────────────────────────────────
  const fetchDeptForms = async () => {
    if (!userId) return;
    setLoadingDept(true);
    try {
      const res  = await fetch(`http://localhost:5009/api/hod-forms?hodId=${userId}`);
      const data = await res.json();
      if (res.ok) setDeptForms(data.forms || []);
    } catch (err) { console.error("[ERROR] Fetching dept forms:", err); }
    finally { setLoadingDept(false); }
  };

  useEffect(() => {
    fetchCourses();
    fetchMySubmissions();
    fetchDeptForms();
  }, []);

  // ── Select course → load textbook ──────────────────────────────────────
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

  // ── Submit own form ────────────────────────────────────────────────────
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.publisher.trim()) {
      alert("Please fill in at least Title, Author, and Publisher."); return;
    }
    if (!formData.quantity || Number(formData.quantity) < 1) {
      alert("Quantity must be at least 1."); return;
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
          approvedBy:     userId, // HoD approves their own submissions
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setSelectedCourse(null);
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
        fetchMySubmissions();
        fetchDeptForms();
      } else {
        alert(result.message || "Failed to submit the form.");
      }
    } catch (err) {
      alert("Error submitting the form.");
    } finally { setIsSubmitting(false); }
  };

  // ── Approve form ───────────────────────────────────────────────────────
  const handleApprove = async (formId) => {
    try {
      const res = await fetch(`http://localhost:5009/api/approve-form/${formId}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setDeptForms(prev => prev.map(f => f.request_id === formId ? { ...f, status: "Approved" } : f));
      } else { alert(data.message || "Failed to approve form."); }
    } catch (err) { alert("Error approving form."); }
  };

  // ── Reject form ────────────────────────────────────────────────────────
  const handleReject = async (formId) => {
    if (!rejectComment.trim()) { setRejectError("Please enter a rejection reason."); return; }
    setRejectError("");
    try {
      const res = await fetch(`http://localhost:5009/api/reject-form/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionComments: rejectComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeptForms(prev => prev.map(f => f.request_id === formId ? { ...f, status: "Rejected" } : f));
        setRejectingId(null);
        setRejectComment("");
      } else { alert(data.message || "Failed to reject form."); }
    } catch (err) { alert("Error rejecting form."); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();

  const badgeStyle = (status) => {
    if (status === "Approved") return styles.badgeApproved;
    if (status === "Rejected") return styles.badgeRejected;
    return styles.badgePending;
  };

  const filteredForms = deptForms.filter(f => f.status === activeTab);

  const tabCount = (tab) => deptForms.filter(f => f.status === tab).length;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Merriweather:ital,wght@0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F3F1; }

        .course-scroll::-webkit-scrollbar { height: 4px; }
        .course-scroll::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 2px; }
        .course-scroll::-webkit-scrollbar-thumb { background: #E56515; border-radius: 2px; }

        .sub-scroll::-webkit-scrollbar { width: 4px; }
        .sub-scroll::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 2px; }
        .sub-scroll::-webkit-scrollbar-thumb { background: #E56515; border-radius: 2px; }

        .dept-scroll::-webkit-scrollbar { width: 4px; }
        .dept-scroll::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 2px; }
        .dept-scroll::-webkit-scrollbar-thumb { background: #E56515; border-radius: 2px; }

        .tile-btn { background: none; border: none; padding: 0; cursor: pointer; text-align: left; }
        .inp-field:focus { outline: none; border-color: #E56515; background: #fff; box-shadow: 0 0 0 3px rgba(229,101,21,.1); }
        .tab-btn:hover { background: #FFF6EE !important; }
        .form-row-item:hover { border-color: #E56515 !important; }
      `}</style>

      <div style={styles.root}>

        {/* ── Top bar ── */}
        <nav style={styles.topbar}>
          <div style={styles.brandWrap}>
            <span style={styles.brand}>MVSU</span>
            <span style={styles.brandSub}>Textbook Adoption Portal</span>
          </div>
          <LogoutButton />
        </nav>

        <div style={styles.page}>

          {/* ── Greeting ── */}
          <div style={styles.greeting}>
            <p style={styles.eyebrow}>Head of Department Portal</p>
            <h1 style={styles.greetingName}>
              Good morning, <em style={{ fontStyle: "italic", color: "#E56515" }}>{firstName}.</em>
            </h1>
          </div>

          {/* ── Success banner ── */}
          {submitSuccess && (
            <div style={styles.successBanner}>
              Textbook adoption form submitted successfully. It has been sent to the bookstore for processing.
            </div>
          )}

          {/* ════════════════════════════════════════════
              INSTRUCTOR SECTION
          ════════════════════════════════════════════ */}
          <div style={styles.sectionDivider}>
            <span style={styles.sectionDividerLabel}>Your Instructor Activity</span>
          </div>

          {/* ── Add Course ── */}
          <SectionHeader title="Add a Course" />
          <div style={styles.addCard}>
            <AddCourseForm
              colors={{ steelBlue: "#E56515", lightBlue: "#FFF6EE", paleBlue: "#F8F8F8", white: "#fff", darkText: "#2a2a2a" }}
              onCourseAdded={fetchCourses}
              hideHodField
            />
          </div>

          {/* ── Your Courses ── */}
          <SectionHeader title="Your Courses" />
          {loadingCourses ? (
            <p style={styles.muted}>Loading courses...</p>
          ) : coursesError ? (
            <p style={{ color: "#c0392b", fontSize: "14px" }}>{coursesError}</p>
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
                      background:  selectedCourse?.course_id === course.course_id ? "#FFF2E5" : "#fff",
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
                      <Field label="Title *"     value={formData.title}     onChange={(v) => setFormData({ ...formData, title: v })}     placeholder="e.g. Algebra Basics" />
                      <Field label="Author *"    value={formData.author}    onChange={(v) => setFormData({ ...formData, author: v })}    placeholder="e.g. John Algebra" />
                      <Field label="Publisher *" value={formData.publisher} onChange={(v) => setFormData({ ...formData, publisher: v })} placeholder="e.g. Pearson" />
                    </div>
                    <div>
                      <Field label="ISBN"        value={formData.isbn}     onChange={(v) => setFormData({ ...formData, isbn: v })}     placeholder="e.g. 978-0-13-468599-1" />
                      <Field label="Edition"     value={formData.edition}  onChange={(v) => setFormData({ ...formData, edition: v })}  placeholder="e.g. 1st" />
                      <Field label="Quantity *"  type="number" value={formData.quantity} onChange={(v) => setFormData({ ...formData, quantity: v })} placeholder="e.g. 30" />
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

          {/* ── My Previously Submitted Forms ── */}
          <SectionHeader title="My Submitted Forms" />
          {mySubmissions.length === 0 ? (
            <p style={styles.muted}>You have not submitted any forms yet.</p>
          ) : (
            <div className="sub-scroll" style={styles.subScroll}>
              {mySubmissions.map((s) => (
                <div key={s.request_id} style={styles.subItem}>
                  <div style={styles.subLeft}>
                    <span style={styles.subCourse}>{s.course_name}</span>
                    <span style={styles.subBook}>{s.title} &mdash; {s.author} &mdash; {s.publisher}</span>
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

          {/* ════════════════════════════════════════════
              HOD SECTION
          ════════════════════════════════════════════ */}
          <div style={{ ...styles.sectionDivider, marginTop: "56px" }}>
            <span style={styles.sectionDividerLabel}>Department Review</span>
          </div>

          <SectionHeader title="Department Submissions" />

          {/* ── Tabs ── */}
          <div style={styles.tabRow}>
            {["Pending", "Approved", "Rejected"].map((tab) => (
              <button
                key={tab}
                className="tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  background:   activeTab === tab ? "#E56515" : "#fff",
                  color:        activeTab === tab ? "#fff"    : "#2a2a2a",
                  borderColor:  activeTab === tab ? "#E56515" : "#CDCDCB",
                }}
              >
                {tab}
                <span style={{
                  ...styles.tabCount,
                  background: activeTab === tab ? "rgba(255,255,255,0.25)" : "#F4F3F1",
                  color:      activeTab === tab ? "#fff" : "#919599",
                }}>
                  {tabCount(tab)}
                </span>
              </button>
            ))}
          </div>

          {/* ── Department forms list ── */}
          {loadingDept ? (
            <p style={styles.muted}>Loading department submissions...</p>
          ) : filteredForms.length === 0 ? (
            <p style={styles.muted}>No {activeTab.toLowerCase()} submissions.</p>
          ) : (
            <div className="dept-scroll" style={styles.deptScroll}>
              {filteredForms.map((form) => {
                const isExpanded = expandedIds.has(form.request_id);
                const isRejecting = rejectingId === form.request_id;

                return (
                  <div key={form.request_id} className="form-row-item" style={styles.deptItem}>

                    {/* ── Collapsed header (always visible) ── */}
                    <div style={styles.deptItemHeader}>
                      <div style={styles.deptItemLeft}>
                        <span style={styles.deptCourse}>{form.course_name}</span>
                        <span style={styles.deptInstructor}>
                          Submitted by <strong>{form.instructor_name}</strong> &middot; {formatDate(form.created_at)} &middot; {form.term}
                        </span>
                      </div>
                      <div style={styles.deptItemRight}>
                        <span style={badgeStyle(form.status)}>{form.status}</span>
                        <button
                          style={styles.btnToggle}
                          onClick={() => toggleExpand(form.request_id)}
                        >
                          {isExpanded ? "Collapse" : "View Details"}
                        </button>
                      </div>
                    </div>

                    {/* ── Expanded details ── */}
                    {isExpanded && (
                      <>
                        <hr style={styles.deptDivider} />
                        <div style={styles.deptDetails}>
                          <DetailRow label="Title"     value={form.title} />
                          <DetailRow label="Author"    value={form.author} />
                          <DetailRow label="Publisher" value={form.publisher} />
                          <DetailRow label="ISBN"      value={form.isbn || "—"} />
                          <DetailRow label="Edition"   value={form.edition || "—"} />
                          <DetailRow label="Quantity"  value={form.quantity} />
                          <DetailRow label="Other Materials" value={form.otherMaterials || "None"} wide />
                        </div>

                        {/* ── Actions (only for Pending) ── */}
                        {form.status === "Pending" && (
                          <>
                            <hr style={styles.deptDivider} />

                            {!isRejecting ? (
                              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                                <button style={styles.btnApprove} onClick={() => handleApprove(form.request_id)}>
                                  Approve
                                </button>
                                <button style={styles.btnReject} onClick={() => { setRejectingId(form.request_id); setRejectComment(""); setRejectError(""); }}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div style={styles.rejectBox}>
                                <label style={styles.rejectLabel}>Reason for rejection *</label>
                                <textarea
                                  className="inp-field"
                                  value={rejectComment}
                                  onChange={(e) => { setRejectComment(e.target.value); setRejectError(""); }}
                                  placeholder="Explain why this form is being rejected..."
                                  style={{ ...styles.inp, height: "72px", resize: "vertical", marginTop: "8px" }}
                                />
                                {rejectError && <p style={styles.rejectErr}>{rejectError}</p>}
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                  <button style={styles.btnRejectConfirm} onClick={() => handleReject(form.request_id)}>
                                    Confirm Rejection
                                  </button>
                                  <button style={styles.btnOutline} onClick={() => { setRejectingId(null); setRejectComment(""); setRejectError(""); }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

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

const DetailRow = ({ label, value, wide = false }) => (
  <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
    <p style={{ fontSize: "10px", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#919599", marginBottom: "2px" }}>{label}</p>
    <p style={{ fontSize: "14px", color: "#2a2a2a", fontWeight: 700 }}>{value}</p>
  </div>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  root:            { fontFamily: "'Lato', sans-serif", background: "#F4F3F1", minHeight: "100vh", color: "#2a2a2a" },
  topbar:          { background: "#E56515", padding: "0 36px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brandWrap:       { display: "flex", alignItems: "baseline", gap: "10px" },
  brand:           { fontFamily: "'Merriweather', serif", fontSize: "18px", color: "#fff" },
  brandSub:        { fontSize: "12px", color: "#FDDCBC", fontWeight: 400, letterSpacing: ".04em" },
  page:            { maxWidth: "940px", margin: "0 auto", padding: "44px 28px 80px" },
  greeting:        { marginBottom: "40px", paddingBottom: "28px", borderBottom: "1px solid #CDCDCB" },
  eyebrow:         { fontSize: "11px", fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase", color: "#919599", marginBottom: "8px" },
  greetingName:    { fontFamily: "'Merriweather', serif", fontSize: "32px", color: "#2a2a2a", lineHeight: 1.15 },
  successBanner:   { background: "#FFF2E5", border: "1.5px solid #FBA45C", borderRadius: "4px", padding: "12px 18px", color: "#E56515", fontWeight: 700, fontSize: "14px", marginBottom: "20px" },

  sectionDivider:      { display: "flex", alignItems: "center", gap: "16px", margin: "48px 0 0" },
  sectionDividerLabel: { fontSize: "10px", fontWeight: 900, letterSpacing: ".18em", textTransform: "uppercase", color: "#fff", background: "#E56515", padding: "4px 12px", borderRadius: "2px", flexShrink: 0 },

  addCard:         { background: "#fff", borderRadius: "4px", borderLeft: "5px solid #E56515", overflow: "hidden" },
  courseScrollWrap:{ overflowX: "auto", paddingBottom: "8px" },
  courseRow:       { display: "flex", gap: "14px", width: "max-content" },
  tile:            { position: "relative", borderRadius: "4px", border: "1.5px solid #CDCDCB", padding: "20px 18px 16px", overflow: "hidden", width: "220px", flexShrink: 0, transition: "border-color .18s" },
  tileTopBar:      { position: "absolute", top: 0, left: 0, right: 0, height: "3px", transition: "background .18s" },
  tileInitial:     { position: "absolute", bottom: "-8px", right: "10px", fontFamily: "'Merriweather', serif", fontSize: "64px", fontWeight: 700, color: "#F4F3F1", lineHeight: 1, pointerEvents: "none" },
  tileNum:         { fontSize: "11px", fontWeight: 900, letterSpacing: ".08em", color: "#E56515", textTransform: "uppercase", marginBottom: "2px", position: "relative" },
  tileName:        { fontSize: "14px", fontWeight: 700, color: "#2a2a2a", marginBottom: "4px", position: "relative" },
  tileTerm:        { fontSize: "12px", color: "#919599", fontWeight: 700, position: "relative" },
  tileCta:         { marginTop: "14px", fontSize: "11px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: "#E56515", position: "relative" },

  formCard:        { background: "#fff", borderRadius: "4px", padding: "28px 32px" },
  formCardHead:    { marginBottom: "22px", paddingBottom: "18px", borderBottom: "1px solid #F0EDE8" },
  formCardCourse:  { fontFamily: "'Merriweather', serif", fontSize: "19px", color: "#2a2a2a" },
  formCardMeta:    { display: "flex", gap: "20px", marginTop: "6px" },
  metaAccent:      { fontSize: "11px", color: "#E56515", fontWeight: 700 },
  metaMuted:       { fontSize: "11px", color: "#919599", fontWeight: 700 },
  formGrid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" },
  fieldLabel:      { fontSize: "10px", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#919599" },
  inp:             { padding: "10px 13px", borderRadius: "4px", border: "1.5px solid #CDCDCB", background: "#F8F8F8", color: "#2a2a2a", fontSize: "14px", fontFamily: "'Lato', sans-serif", width: "100%", transition: "border-color .15s, background .15s" },
  divider:         { border: "none", borderTop: "1px solid #F0EDE8", margin: "22px 0" },

  btnOrange:       { background: "#E56515", color: "#fff", border: "none", borderRadius: "4px", padding: "11px 24px", fontSize: "13px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },
  btnOutline:      { background: "transparent", color: "#E56515", border: "2px solid #E56515", borderRadius: "4px", padding: "9px 20px", fontSize: "13px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase", marginLeft: "10px" },
  btnApprove:      { background: "#1a7a4a", color: "#fff", border: "none", borderRadius: "4px", padding: "9px 20px", fontSize: "12px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },
  btnReject:       { background: "transparent", color: "#c0392b", border: "2px solid #c0392b", borderRadius: "4px", padding: "7px 20px", fontSize: "12px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },
  btnRejectConfirm:{ background: "#c0392b", color: "#fff", border: "none", borderRadius: "4px", padding: "9px 20px", fontSize: "12px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },
  btnToggle:       { background: "transparent", color: "#E56515", border: "1.5px solid #E56515", borderRadius: "4px", padding: "5px 14px", fontSize: "11px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".05em", textTransform: "uppercase" },

  muted:           { color: "#919599", fontSize: "14px", fontWeight: 700 },

  subScroll:       { height: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "6px" },
  subItem:         { background: "#fff", borderRadius: "4px", border: "1.5px solid #CDCDCB", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexShrink: 0 },
  subLeft:         { display: "flex", flexDirection: "column", gap: "3px", flex: 1 },
  subCourse:       { fontSize: "14px", fontWeight: 700, color: "#2a2a2a" },
  subBook:         { fontSize: "12px", color: "#919599" },
  subRight:        { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 },
  subDate:         { fontSize: "11px", color: "#919599", fontWeight: 700 },
  subTerm:         { fontSize: "11px", color: "#CDCDCB", fontWeight: 700 },

  tabRow:          { display: "flex", gap: "8px", marginBottom: "20px" },
  tabBtn:          { border: "1.5px solid #CDCDCB", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", fontWeight: 900, cursor: "pointer", fontFamily: "'Lato', sans-serif", letterSpacing: ".06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", transition: "background .15s, color .15s" },
  tabCount:        { borderRadius: "2px", padding: "2px 7px", fontSize: "11px", fontWeight: 900 },

  deptScroll:      { display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" },
  deptItem:        { background: "#fff", borderRadius: "4px", border: "1.5px solid #CDCDCB", padding: "18px 20px", transition: "border-color .15s" },
  deptItemHeader:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" },
  deptItemLeft:    { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  deptCourse:      { fontSize: "15px", fontWeight: 900, color: "#2a2a2a" },
  deptInstructor:  { fontSize: "12px", color: "#919599" },
  deptItemRight:   { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  deptDivider:     { border: "none", borderTop: "1px solid #F0EDE8", margin: "14px 0" },
  deptDetails:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 24px", marginBottom: "4px" },

  rejectBox:       { background: "#FEF0F0", border: "1.5px solid #f5c6c6", borderRadius: "4px", padding: "16px 18px", marginTop: "12px" },
  rejectLabel:     { fontSize: "10px", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#c0392b" },
  rejectErr:       { color: "#c0392b", fontSize: "12px", fontWeight: 700, marginTop: "6px" },

  badgePending:    { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#FFF2E5", color: "#E56515" },
  badgeApproved:   { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#E8F6EE", color: "#1a7a4a" },
  badgeRejected:   { display: "inline-block", padding: "4px 12px", borderRadius: "2px", fontSize: "10px", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", background: "#FEF0F0", color: "#c0392b" },
};

export default HoDPage;