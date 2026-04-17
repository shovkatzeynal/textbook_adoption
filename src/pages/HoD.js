import React, { useEffect, useState, useRef } from "react";
import AddCourseForm from "../components/AddCourseForm";
import { useNavigate } from "react-router-dom";

// ══ CHANGE WEBSITE BACKGROUND HERE ══════════════════════
// Options to try:
//   #F8F8F8   — off-white (current)
//   #FFFFFF   — pure white
//   #FFF8F2   — warm cream
//   #F2EDE8   — warm gray
//   #EDEBE8   — stone
const SITE_BG = "#F8F8F8";
// ════════════════════════════════════════════════════════

const COLORS = {
  orange:      "#E56515",
  orangeHover: "#CC5A12",
  orangeMid:   "#FBA45C",
  orangeSoft:  "#FFF2E5",
  orangePale:  "#FFF8F2",
  grayMid:     "#919599",
  grayLight:   "#CDCDCB",
  offWhite:    "#F8F8F8",
  white:       "#FFFFFF",
  text:        "#1C1C1E",
  text2:       "#919599",
  border:      "#EBEBEB",
  border2:     "#CDCDCB",
  green:       "#1a7a4a",
  greenSoft:   "#EBF7F1",
  red:         "#c0392b",
  redSoft:     "#FEF0F0",
  dark:        "#2a2a2a",
};

const HoDPage = () => {
  // ── State ────────────────────────────────────────────
  const [courses, setCourses]               = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData]             = useState({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
  const [mySubmissions, setMySubmissions]   = useState([]);
  const [deptForms, setDeptForms]           = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingDept, setLoadingDept]       = useState(true);
  const [coursesError, setCoursesError]     = useState("");
  const [submitSuccess, setSubmitSuccess]   = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [activeCard, setActiveCard]         = useState("courses"); // "courses" | "submissions" | "approved" | "rejected"
  const [expandedIds, setExpandedIds]       = useState(new Set());
  const [rejectingId, setRejectingId]       = useState(null);
  const [rejectComment, setRejectComment]   = useState("");
  const [rejectError, setRejectError]       = useState("");
  const [timelineFilter, setTimelineFilter] = useState("All");

  const formRef = useRef(null);
  const navigate = useNavigate();

  const hodName   = localStorage.getItem("fullName") || "Head of Department";
  const firstName = hodName.split(" ")[0];
  const userId    = localStorage.getItem("userId");

  // ── Fetch helpers ────────────────────────────────────
  const fetchCourses = async () => {
    if (!userId) { setCoursesError("No user ID found."); setLoadingCourses(false); return; }
    setLoadingCourses(true); setCoursesError("");
    try {
      const res  = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setCourses(data.courses || []);
      else        setCoursesError(data.message || "Failed to fetch courses.");
    } catch (err) { setCoursesError("Network error."); }
    finally { setLoadingCourses(false); }
  };

  const fetchMySubmissions = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`http://localhost:5009/api/instructor-submissions?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setMySubmissions(data.submissions || []);
    } catch (err) { console.error("[ERROR] Fetching own submissions:", err); }
  };

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

  // ── Course → pre-fill form ───────────────────────────
  const handleCreateForm = async (course) => {
    setSelectedCourse(course);
    setSubmitSuccess(false);
    try {
      const res  = await fetch(`http://localhost:5009/api/textbooks/${course.course_id}`);
      const data = await res.json();
      if (res.ok && data.course) {
        const t = data.course;
        setFormData({ publisher: t.publisher || "", title: t.title || "", author: t.author || "", isbn: t.isbn || "", edition: t.edition || "", quantity: t.quantity || "", otherMaterials: t.other_materials || "" });
      } else {
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
      }
    } catch (err) { console.error("[ERROR] Fetching textbook:", err); }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  // ── Submit own form ──────────────────────────────────
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.publisher.trim()) { alert("Please fill in Title, Author, and Publisher."); return; }
    if (!formData.quantity || Number(formData.quantity) < 1) { alert("Quantity must be at least 1."); return; }
    setIsSubmitting(true); setSubmitSuccess(false);
    try {
      const res = await fetch("http://localhost:5009/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse.course_id, ...formData, requestedBy: userId, approvedBy: userId }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setSelectedCourse(null);
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
        fetchMySubmissions();
        fetchDeptForms();
      } else { alert(result.message || "Failed to submit."); }
    } catch (err) { alert("Error submitting the form."); }
    finally { setIsSubmitting(false); }
  };

  // ── Approve ──────────────────────────────────────────
  const handleApprove = async (formId) => {
    try {
      const res = await fetch(`http://localhost:5009/api/approve-form/${formId}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) setDeptForms(prev => prev.map(f => f.request_id === formId ? { ...f, status: "Approved" } : f));
      else alert(data.message || "Failed to approve.");
    } catch { alert("Error approving form."); }
  };

  // ── Reject ───────────────────────────────────────────
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
        setRejectingId(null); setRejectComment("");
      } else alert(data.message || "Failed to reject.");
    } catch { alert("Error rejecting form."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const toggleExpand = (id) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

  const pendingForms  = deptForms.filter(f => f.status === "Pending");
  const approvedForms = deptForms.filter(f => f.status === "Approved");
  const rejectedForms = deptForms.filter(f => f.status === "Rejected");

  const allTimeline = [...deptForms, ...mySubmissions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const filteredTimeline = timelineFilter === "All" ? allTimeline : allTimeline.filter(f => f.status === timelineFilter);

  // ── Badge style ──────────────────────────────────────
  const badge = (status) => {
    if (status === "Approved") return S.badgeA;
    if (status === "Rejected") return S.badgeR;
    return S.badgeP;
  };

  // ── Card content ─────────────────────────────────────
  const renderCardBody = () => {
    if (activeCard === "courses") return (
      <div style={S.cardbody}>
        {loadingCourses ? <p style={S.muted}>Loading...</p> : coursesError ? <p style={{ color: COLORS.red, fontSize: 13 }}>{coursesError}</p> : courses.length === 0 ? <p style={S.muted}>No courses yet.</p> : (
          <div style={S.courselist}>
            {courses.map(c => (
              <div key={c.course_id} style={S.crow}>
                <div style={S.cbar} />
                <div style={S.cinfo}>
                  <div style={S.cnum}>{c.course_number}</div>
                  <div style={S.cname}>{c.course_name}</div>
                  <div style={S.cterm}>{c.term}</div>
                </div>
                <button style={S.bcreate} onClick={() => handleCreateForm(c)}>Create Form →</button>
              </div>
            ))}
          </div>
        )}
        <div style={S.sep} />
        <div style={S.addhead}>+ Add a New Course</div>
        <AddCourseForm
          colors={{ steelBlue: COLORS.orange, lightBlue: COLORS.orangeSoft, paleBlue: COLORS.offWhite, white: COLORS.white, darkText: COLORS.text }}
          onCourseAdded={fetchCourses}
          hideHodField
        />
      </div>
    );

    if (activeCard === "submissions") return (
      <div style={S.cardbody}>
        {mySubmissions.length === 0 ? <p style={S.muted}>No submissions yet.</p> : (
          <div style={S.sublist}>
            {mySubmissions.map(s => (
              <div key={s.request_id} style={S.sitem}>
                <div style={S.scourse}>{s.course_name}</div>
                <div style={S.sbook}>{s.title} — {s.author} — {s.publisher}</div>
                <div style={S.smeta}>
                  <span style={S.sdate}>{formatDate(s.created_at)} · {s.term}</span>
                  <span style={badge(s.status)}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    const list = activeCard === "approved" ? approvedForms : rejectedForms;
    const label = activeCard === "approved" ? "approved" : "rejected";
    return (
      <div style={S.cardbody}>
        {list.length === 0 ? <p style={S.muted}>No {label} forms.</p> : (
          <div style={S.sublist}>
            {list.map(f => (
              <div key={f.request_id} style={S.sitem}>
                <div style={S.scourse}>{f.course_name}</div>
                <div style={S.sbook}>{f.title} — {f.author} — {f.publisher}</div>
                <div style={S.smeta}>
                  <span style={S.sdate}>{f.instructor_name} · {formatDate(f.created_at)}</span>
                  <span style={badge(f.status)}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${SITE_BG}; font-family: 'Inter', sans-serif; }
        .hod-fi:focus { outline: none; border-color: ${COLORS.orange} !important; background: #fff !important; }
        .hod-crow:hover { border-color: ${COLORS.orangeMid} !important; background: ${COLORS.orangePale} !important; }
        .hod-card-col:hover { box-shadow: 0 6px 20px rgba(0,0,0,.1) !important; transform: translateY(-2px) !important; }
        .hod-pitem:hover { border-color: ${COLORS.orangeMid} !important; }
        .hod-titem:hover { border-color: ${COLORS.orangeMid} !important; background: ${COLORS.orangeSoft} !important; }
        .hod-fbtn:hover { border-color: ${COLORS.orangeMid} !important; color: ${COLORS.orange} !important; }
        .hod-logout:hover { background: ${COLORS.orangeSoft} !important; }
        .hod-boutline:hover { background: ${COLORS.orangeSoft} !important; }
        .hod-navitem:hover { background: rgba(255,255,255,.07) !important; color: rgba(255,255,255,.8) !important; }
        .hod-sublist::-webkit-scrollbar { width: 3px; }
        .hod-sublist::-webkit-scrollbar-thumb { background: ${COLORS.orangeMid}; border-radius: 2px; }
        .hod-plist::-webkit-scrollbar { width: 3px; }
        .hod-plist::-webkit-scrollbar-thumb { background: ${COLORS.orangeMid}; border-radius: 2px; }
      `}</style>

      <div style={S.shell}>

        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <div style={S.sidelogo}>
            <div style={S.logobox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
            </div>
            <div>
              <div style={S.logotxt}>MVSU</div>
              <div style={S.logosubtxt}>Textbook Portal</div>
            </div>
          </div>
          <nav style={S.sidenav}>
            {[
              { key: "courses", label: "My Courses", icon: <path d="M3 9h18M9 21V9"/>, icon2: <rect x="3" y="3" width="18" height="18" rx="2"/> },
            ].map(() => null)}
            <NavItem label="My Courses"    active={activeCard === "courses"}     onClick={() => setActiveCard("courses")}     icon="grid" />
            <NavItem label="Submissions"   active={activeCard === "submissions"}  onClick={() => setActiveCard("submissions")} icon="file" />
            <div style={S.navsep} />
            <NavItem label="Department"    active={false} onClick={() => {}} icon="users" />
            <NavItem label="Notifications" active={false} onClick={() => {}} icon="bell" />
          </nav>
          <div style={S.sidefoot}>
            <div style={S.avatar}>{(hodName || "?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}</div>
            <div>
              <div style={S.avn}>{hodName}</div>
              <div style={S.avr}>Head of Department</div>
            </div>
          </div>
        </aside>

        <div style={S.main}>

          {/* ── Top bar ── */}
          <div style={S.topbar}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={S.topeyebrow}>Head of Department Portal</div>
              <div style={S.topname}>
                Welcome back, <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.85)" }}>{firstName}.</em>
              </div>
              <div style={S.topsub}>Manage your courses &amp; department submissions</div>
            </div>
            <div style={S.topright}>
              <span style={S.termbadge}>Spring 2026</span>
              <button className="hod-logout" style={S.logout} onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          </div>

          <div style={S.content}>

            {submitSuccess && (
              <div style={S.successBanner}>
                Form submitted successfully — sent to the bookstore for processing.
              </div>
            )}

            {/* ── Overview ── */}
            <div style={S.seclabel}>
              <span>Overview</span>
              <div style={S.seclabelLine} />
            </div>

            <div style={S.cardrow}>
              {[
                { key: "courses",     label: "My Courses",    count: courses.length },
                { key: "submissions", label: "My Submissions", count: mySubmissions.length },
                { key: "approved",    label: "Approved",       count: approvedForms.length },
                { key: "rejected",    label: "Rejected",       count: rejectedForms.length },
              ].map(({ key, label, count }) => {
                const isActive = activeCard === key;
                return (
                  <div
                    key={key}
                    className={isActive ? "" : "hod-card-col"}
                    style={{
                      ...S.card,
                      flex: isActive ? 1 : "0 0 108px",
                      background: isActive ? COLORS.orangeSoft : COLORS.orange,
                      border: isActive ? `1px solid rgba(229,101,21,.25)` : "none",
                      cursor: isActive ? "default" : "pointer",
                    }}
                    onClick={() => !isActive && setActiveCard(key)}
                  >
                    <div style={{ ...S.cardtop, borderBottom: isActive ? `1px solid rgba(229,101,21,.15)` : "none", background: isActive ? COLORS.orangeSoft : "transparent" }}>
                      <span style={{ ...S.cardlabel, color: isActive ? COLORS.orange : "rgba(255,255,255,.9)" }}>{label}</span>
                      <span style={{ fontSize: 9, color: isActive ? COLORS.orange : "rgba(255,255,255,.6)" }}>{isActive ? "▲" : "▼"}</span>
                    </div>
                    {isActive && renderCardBody()}
                  </div>
                );
              })}
            </div>

            {/* ── Forms ── */}
            <div style={S.seclabel}>
              <span>Forms</span>
              <div style={S.seclabelLine} />
            </div>

            <div style={S.midrow} ref={formRef}>

              {/* Left — textbook form */}
              <div style={S.panel}>
                {selectedCourse ? (
                  <>
                    <div style={S.ftopbar}>
                      <div style={S.fcname}>{selectedCourse.course_name}</div>
                      <div style={S.fcmeta}>{selectedCourse.course_number} · {selectedCourse.term} — pre-filled</div>
                    </div>
                    <div style={S.pbody}>
                      <form onSubmit={handleSubmitForm}>
                        <div style={S.fgrid}>
                          <FormField label="Title *"     value={formData.title}     onChange={v => setFormData({ ...formData, title: v })}     placeholder="e.g. Calculus" />
                          <FormField label="Author *"    value={formData.author}    onChange={v => setFormData({ ...formData, author: v })}    placeholder="e.g. Stewart" />
                          <FormField label="Publisher *" value={formData.publisher} onChange={v => setFormData({ ...formData, publisher: v })} placeholder="e.g. Cengage" />
                          <FormField label="ISBN"        value={formData.isbn}      onChange={v => setFormData({ ...formData, isbn: v })}      placeholder="978-..." />
                          <FormField label="Edition"     value={formData.edition}   onChange={v => setFormData({ ...formData, edition: v })}   placeholder="e.g. 8th" />
                          <FormField label="Quantity *"  value={formData.quantity}  onChange={v => setFormData({ ...formData, quantity: v })}  placeholder="e.g. 30" type="number" />
                        </div>
                        <FormField label="Other Materials / Notes" value={formData.otherMaterials} onChange={v => setFormData({ ...formData, otherMaterials: v })} placeholder="e.g. Lab manual" />
                        <div style={S.sep} />
                        <button type="submit" style={S.borange} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit for Approval"}</button>
                        <button type="button" className="hod-boutline" style={S.boutline} onClick={() => setSelectedCourse(null)}>Cancel</button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div style={S.fempty}>
                    <div style={S.femptybox}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <div style={S.femptytitle}>Select a course to begin</div>
                    <div style={S.femptysub}>Click "Create Form →" on any course above to pre-fill this textbook adoption form.</div>
                  </div>
                )}
              </div>

              {/* Right — pending dept forms */}
              <div style={S.panel}>
                <div style={S.phead}>
                  <span style={S.ptitle}>Pending Department Forms</span>
                  <span style={{ fontSize: 11, color: COLORS.orange, fontWeight: 700 }}>
                    {loadingDept ? "Loading..." : `${pendingForms.length} awaiting review`}
                  </span>
                </div>
                <div style={S.pbody}>
                  {pendingForms.length === 0 && !loadingDept ? (
                    <p style={S.muted}>No pending submissions.</p>
                  ) : (
                    <div className="hod-plist" style={S.plist}>
                      {pendingForms.map(form => {
                        const isExp      = expandedIds.has(form.request_id);
                        const isRejecting = rejectingId === form.request_id;
                        return (
                          <div key={form.request_id} className="hod-pitem" style={S.pitem}>
                            <div style={S.pitemhead}>
                              <div>
                                <div style={S.pcourse}>{form.course_name}</div>
                                <div style={S.pinstr}>{form.instructor_name} · {formatDate(form.created_at)} · {form.term}</div>
                              </div>
                              <div style={S.pright}>
                                <span style={S.badgeP}>Pending</span>
                                <button style={S.btog} onClick={() => toggleExpand(form.request_id)}>
                                  {isExp ? "Collapse ▴" : "Details ▾"}
                                </button>
                              </div>
                            </div>
                            {isExp && (
                              <div style={S.pdet}>
                                <div style={S.dgrid}>
                                  {[["Title", form.title], ["Author", form.author], ["Publisher", form.publisher], ["ISBN", form.isbn || "—"], ["Edition", form.edition || "—"], ["Quantity", form.quantity]].map(([l, v]) => (
                                    <div key={l}><div style={S.dl}>{l}</div><div style={S.dv}>{v}</div></div>
                                  ))}
                                  {form.otherMaterials && <div style={{ gridColumn: "1/-1" }}><div style={S.dl}>Other Materials</div><div style={S.dv}>{form.otherMaterials}</div></div>}
                                </div>
                                {!isRejecting ? (
                                  <div style={S.arow}>
                                    <button style={S.bapprove} onClick={() => handleApprove(form.request_id)}>Approve</button>
                                    <button style={S.breject} onClick={() => { setRejectingId(form.request_id); setRejectComment(""); setRejectError(""); }}>Reject</button>
                                  </div>
                                ) : (
                                  <div style={S.rbox}>
                                    <span style={S.rlabel}>Reason for rejection *</span>
                                    <textarea
                                      style={S.rtxt}
                                      value={rejectComment}
                                      onChange={e => { setRejectComment(e.target.value); setRejectError(""); }}
                                      placeholder="Explain why this form is being rejected..."
                                    />
                                    {rejectError && <p style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>{rejectError}</p>}
                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                      <button style={S.brcnf} onClick={() => handleReject(form.request_id)}>Confirm Rejection</button>
                                      <button className="hod-boutline" style={{ ...S.boutline, marginLeft: 0, fontSize: 11, padding: "6px 12px" }} onClick={() => { setRejectingId(null); setRejectComment(""); }}>Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── Timeline ── */}
            <div style={S.seclabel}>
              <span>All Submissions Timeline</span>
              <div style={S.seclabelLine} />
            </div>

            <div style={S.timeline}>
              <div style={S.thead}>
                <span style={S.ptitle}>All forms — sorted by date</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Approved", "Pending", "Rejected"].map(f => (
                    <button
                      key={f}
                      className={timelineFilter === f ? "" : "hod-fbtn"}
                      style={{ ...S.fbtn, background: timelineFilter === f ? COLORS.orange : COLORS.white, color: timelineFilter === f ? "#fff" : COLORS.text2, borderColor: timelineFilter === f ? COLORS.orange : COLORS.border2 }}
                      onClick={() => setTimelineFilter(f)}
                    >{f}</button>
                  ))}
                </div>
              </div>
              <div style={S.tbody}>
                {filteredTimeline.length === 0 ? (
                  <p style={{ ...S.muted, padding: "10px 0" }}>No forms to show.</p>
                ) : filteredTimeline.map(item => (
                  <div key={`${item.request_id}-${item.status}`} className="hod-titem" style={S.titem}>
                    <div style={{ ...S.tdot, background: item.status === "Approved" ? "#16a34a" : item.status === "Rejected" ? COLORS.red : COLORS.orange }} />
                    <div style={S.tinfo}>
                      <div style={S.tcourse}>{item.course_name}</div>
                      <div style={S.tbook}>{item.title} — {item.author} — {item.publisher}</div>
                      <div style={S.tinstr}>{item.instructor_name || "You"}</div>
                    </div>
                    <div style={S.tright}>
                      <div style={S.tdate}>{formatDate(item.created_at)}</div>
                      <span style={badge(item.status)}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

// ── Sub-components ───────────────────────────────────────

const NavItem = ({ label, active, onClick, icon }) => {
  const icons = {
    grid:  <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
    file:  <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    bell:  <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  };
  return (
    <div
      className={active ? "" : "hod-navitem"}
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: active ? "#fff" : "rgba(255,255,255,.4)", background: active ? "#E56515" : "transparent", transition: "all .15s" }}
      onClick={onClick}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>{icons[icon]}</svg>
      {label}
    </div>
  );
};

const FormField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 10, fontWeight: 600, color: "#919599", display: "block", marginBottom: 3, letterSpacing: ".02em" }}>{label}</label>
    <input
      className="hod-fi"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={type === "number" ? "1" : undefined}
      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1.5px solid #CDCDCB`, background: "#F8F8F8", fontSize: 13, color: "#1C1C1E", fontFamily: "Inter, sans-serif", transition: "border-color .15s" }}
    />
  </div>
);

// ── Styles ────────────────────────────────────────────────

const S = {
  shell:       { display: "flex", minHeight: "100vh", background: SITE_BG },
  sidebar:     { width: 236, flexShrink: 0, background: "#2a2a2a", display: "flex", flexDirection: "column" },
  sidelogo:    { padding: "22px 18px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.07)" },
  logobox:     { width: 30, height: 30, background: COLORS.orange, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logotxt:     { fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" },
  logosubtxt:  { fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 1, letterSpacing: ".04em" },
  sidenav:     { padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 1 },
  navsep:      { height: 1, background: "rgba(255,255,255,.06)", margin: "6px 0" },
  sidefoot:    { padding: "13px 12px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 10 },
  avatar:      { width: 34, height: 34, borderRadius: 9, background: COLORS.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
  avn:         { fontSize: 12, color: "#fff", fontWeight: 600, lineHeight: 1.3 },
  avr:         { fontSize: 10, color: "rgba(255,255,255,.3)" },

  main:        { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },

  topbar:      { background: COLORS.orange, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", overflow: "hidden" },
  topeyebrow:  { fontSize: 10, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginBottom: 6 },
  topname:     { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.15, letterSpacing: "-.01em" },
  topsub:      { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 5 },
  topright:    { display: "flex", alignItems: "center", gap: 10, flexShrink: 0, position: "relative", zIndex: 1 },
  termbadge:   { background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 20, padding: "7px 16px", fontSize: 11, fontWeight: 600, letterSpacing: ".04em" },
  logout:      { background: "#fff", color: COLORS.orange, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s", letterSpacing: ".01em" },

  content:     { flex: 1, padding: "28px 28px 52px", background: SITE_BG },
  successBanner: { background: COLORS.orangeSoft, border: `1.5px solid ${COLORS.orangeMid}`, borderRadius: 8, padding: "11px 16px", color: COLORS.orange, fontWeight: 700, fontSize: 13, marginBottom: 20 },

  seclabel:    { fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, letterSpacing: "-.01em" },
  seclabelLine:{ flex: 1, height: 1.5, background: COLORS.border2, borderRadius: 1 },

  cardrow:     { display: "flex", gap: 10, marginBottom: 30, alignItems: "stretch" },
  card:        { borderRadius: 12, overflow: "hidden", transition: "all .3s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,.07)" },
  cardtop:     { padding: "14px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 },
  cardlabel:   { fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", whiteSpace: "nowrap" },
  cardbody:    { padding: 16 },

  courselist:  { display: "flex", flexDirection: "column", gap: 6, maxHeight: 210, overflowY: "auto", marginBottom: 14 },
  crow:        { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.white, transition: "all .15s", cursor: "default" },
  cbar:        { width: 3, height: 32, borderRadius: 2, background: COLORS.orange, flexShrink: 0 },
  cinfo:       { flex: 1, minWidth: 0 },
  cnum:        { fontSize: 10, fontWeight: 700, color: COLORS.orange, letterSpacing: ".07em", textTransform: "uppercase" },
  cname:       { fontSize: 13, fontWeight: 600, color: COLORS.text },
  cterm:       { fontSize: 11, color: COLORS.text2 },
  bcreate:     { background: COLORS.dark, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "background .15s" },

  sep:         { height: 1, background: COLORS.border, margin: "12px 0" },
  addhead:     { fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.text2, marginBottom: 10 },

  sublist:     { display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" },
  sitem:       { padding: "10px 12px", borderRadius: 9, border: `1px solid ${COLORS.border}`, background: COLORS.white },
  scourse:     { fontSize: 13, fontWeight: 600, color: COLORS.text },
  sbook:       { fontSize: 11, color: COLORS.text2, marginTop: 1 },
  smeta:       { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  sdate:       { fontSize: 10, color: COLORS.text2, fontWeight: 500 },
  muted:       { color: COLORS.grayMid, fontSize: 13, fontWeight: 500 },

  badgeP:      { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: COLORS.orangeSoft, color: COLORS.orange },
  badgeA:      { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: COLORS.greenSoft, color: COLORS.green },
  badgeR:      { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: COLORS.redSoft, color: COLORS.red },

  midrow:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 },
  panel:       { background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,.07)", overflow: "hidden" },
  phead:       { padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
  ptitle:      { fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.text2 },
  pbody:       { padding: "18px 20px" },

  ftopbar:     { background: COLORS.orangeSoft, borderBottom: `1.5px solid rgba(229,101,21,.15)`, padding: "13px 20px" },
  fcname:      { fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: COLORS.text },
  fcmeta:      { fontSize: 11, color: COLORS.orange, fontWeight: 500, marginTop: 3 },
  fgrid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" },
  fempty:      { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 20px", textAlign: "center", gap: 10 },
  femptybox:   { width: 46, height: 46, borderRadius: 14, background: COLORS.orangeSoft, display: "flex", alignItems: "center", justifyContent: "center" },
  femptytitle: { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: COLORS.text },
  femptysub:   { fontSize: 12, color: COLORS.text2, lineHeight: 1.55 },

  borange:     { background: COLORS.orange, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background .15s", letterSpacing: ".01em" },
  boutline:    { background: COLORS.white, color: COLORS.orange, border: `1.5px solid ${COLORS.orange}`, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: 8, transition: "all .15s" },

  plist:       { display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto", paddingRight: 2 },
  pitem:       { borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden", transition: "border-color .15s" },
  pitemhead:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, padding: "12px 14px", background: COLORS.white },
  pcourse:     { fontSize: 13, fontWeight: 700, color: COLORS.text },
  pinstr:      { fontSize: 11, color: COLORS.text2, marginTop: 2 },
  pright:      { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 },
  btog:        { background: COLORS.offWhite, color: COLORS.text2, border: `1px solid ${COLORS.border2}`, borderRadius: 7, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  pdet:        { padding: "12px 14px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.orangePale },
  dgrid:       { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px", marginBottom: 10 },
  dl:          { fontSize: 9, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.text2, marginBottom: 2 },
  dv:          { fontSize: 12, fontWeight: 600, color: COLORS.text },
  arow:        { display: "flex", gap: 7 },
  bapprove:    { background: COLORS.green, color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  breject:     { background: COLORS.white, color: COLORS.red, border: `1px solid rgba(192,57,43,.2)`, borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s" },
  rbox:        { background: COLORS.redSoft, border: `1px solid rgba(192,57,43,.15)`, borderRadius: 8, padding: "10px 12px", marginTop: 8 },
  rlabel:      { fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: COLORS.red },
  rtxt:        { width: "100%", height: 50, padding: "7px 9px", border: `1px solid rgba(192,57,43,.2)`, borderRadius: 7, fontSize: 12, color: COLORS.text, background: COLORS.white, fontFamily: "Inter, sans-serif", resize: "none", marginTop: 6, display: "block" },
  brcnf:       { background: COLORS.red, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },

  timeline:    { background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,.07)", overflow: "hidden" },
  thead:       { padding: "14px 22px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  fbtn:        { border: `1.5px solid ${COLORS.border2}`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s", fontFamily: "Inter, sans-serif" },
  tbody:       { padding: "14px 22px", display: "flex", flexDirection: "column", gap: 8 },
  titem:       { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.offWhite, transition: "all .15s", cursor: "pointer" },
  tdot:        { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  tinfo:       { flex: 1, minWidth: 0 },
  tcourse:     { fontSize: 13, fontWeight: 600, color: COLORS.text },
  tbook:       { fontSize: 11, color: COLORS.text2, marginTop: 1 },
  tinstr:      { fontSize: 10, color: COLORS.grayMid, marginTop: 2, fontWeight: 500 },
  tright:      { textAlign: "right", flexShrink: 0 },
  tdate:       { fontSize: 11, color: COLORS.text2, fontWeight: 500, marginBottom: 5 },
};

export default HoDPage;