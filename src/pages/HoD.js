// Full updated HoD.js with steel blue theming, ability to add courses (with hidden HoD ID), and expandable textbook requests
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import AddCourseForm from "../components/AddCourseForm";

const HoD = () => {
  const [courses, setCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [expandedForms, setExpandedForms] = useState(new Set());
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    publisher: "",
    title: "",
    author: "",
    isbn: "",
    edition: "",
    quantity: "",
    otherMaterials: ""
  });
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");
  const fullName = localStorage.getItem("fullName") || "Head of Department";
  const navigate = useNavigate();

  const colors = {
    steelBlue: "#4682B4",
    lightBlue: "#d0e7ff",
    paleBlue: "#eaf4ff",
    white: "#ffffff",
    darkText: "#1f2d3d"
  };

  useEffect(() => {
    const fetchForms = async () => {
      console.log("[DEBUG] Fetching HoD forms for userId:", userId);
      try {
        const response = await fetch(`http://localhost:5009/api/hod-forms?hodId=${userId}`);
        const result = await response.json();
        console.log("[DEBUG] Forms fetched:", result.forms);
        if (response.ok) setForms(result.forms || []);
        else setError(result.message || "Failed to fetch forms.");
      } catch (err) {
        console.error("[ERROR] Fetching forms:", err);
        setError("Network error while fetching forms.");
      } finally {
        setLoadingForms(false);
      }
    };

    const fetchCourses = async () => {
      console.log("[DEBUG] Fetching HoD courses for userId:", userId);
      try {
        const response = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
        const result = await response.json();
        console.log("[DEBUG] Courses fetched:", result.courses);
        if (response.ok) setCourses(result.courses || []);
        else setError(result.message || "Failed to fetch courses.");
      } catch (err) {
        console.error("[ERROR] Fetching courses:", err);
        setError("Network error while fetching courses.");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchForms();
    fetchCourses();
  }, [userId]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const confirmed = window.confirm("Are you sure that you want to submit the textbook adoption form?");
    if (!confirmed) return;

    setIsSubmitting(true);
    console.log("[DEBUG] Submitting form for course:", selectedCourse);
    console.log("[DEBUG] Form data:", formData);

    try {
      const response = await fetch("http://localhost:5009/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.course_id,
          publisher: formData.publisher,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          edition: formData.edition,
          quantity: formData.quantity,
          otherMaterials: formData.otherMaterials,
          requestedBy: userId,
          approvedBy: userId
        })
      });
      const result = await response.json();
      console.log("[DEBUG] Form submission result:", result);
      if (response.ok) {
        alert("Form submitted successfully!");
        setSelectedCourse(null);
        setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
      } else {
        alert(result.message || "Failed to submit form.");
      }
    } catch (err) {
      console.error("[ERROR] Submitting form:", err);
      alert("Error submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptForm = async (formId) => {
    console.log("[DEBUG] Approving form ID:", formId);
    try {
      const response = await fetch(`http://localhost:5009/api/approve-form/${formId}`, { method: "PATCH" });
      const result = await response.json();
      if (response.ok) {
        alert("Form approved successfully!");
        setForms(forms.filter((form) => form.request_id !== formId));
      } else alert(result.message || "Failed to approve the form.");
    } catch (err) {
      console.error("[ERROR] Approving form:", err);
      alert("Error approving the form.");
    }
  };

  const handleRejectForm = async (formId) => {
    const rejectionComments = prompt("Enter a reason for rejection:");
    if (!rejectionComments) return;
    console.log("[DEBUG] Rejecting form ID:", formId, "with comments:", rejectionComments);

    try {
      const response = await fetch(`http://localhost:5009/api/reject-form/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionComments }),
      });
      const result = await response.json();
      if (response.ok) {
        alert("Form rejected successfully!");
        setForms(forms.filter((form) => form.request_id !== formId));
      } else alert(result.message || "Failed to reject the form.");
    } catch (err) {
      console.error("[ERROR] Rejecting form:", err);
      alert("Error rejecting the form.");
    }
  };

  const toggleExpand = (formId) => {
    setExpandedForms((prev) => {
      const next = new Set(prev);
      if (next.has(formId)) next.delete(formId);
      else next.add(formId);
      return next;
    });
  };

  return (
    <div style={{ backgroundColor: colors.steelBlue, minHeight: "100vh", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: colors.white }}>Welcome, {fullName}!</h1>
        <LogoutButton />
      </div>

      {/* Add Course Section (HoD ID passed internally and hidden visually) */}
      <AddCourseForm colors={colors} onCourseAdded={() => window.location.reload()} hideHodField />

      {/* Courses Section */}
      <div style={{ background: colors.paleBlue, padding: "20px", borderRadius: "10px", marginTop: "30px" }}>
        <h2 style={{ color: colors.darkText }}>Your Courses</h2>
        {loadingCourses ? <p>Loading courses...</p> : (
          courses.length === 0 ? <p>No courses assigned yet.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {courses.map(course => (
                <li key={course.course_id} style={{ marginBottom: "10px" }}>
                  <button onClick={() => setSelectedCourse(course)} style={buttonStyle(colors)}>
                    {course.course_name} ({course.term})
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* Form Submission Section */}
      {selectedCourse && (
        <div style={{ background: colors.lightBlue, padding: "20px", borderRadius: "10px", marginTop: "20px" }}>
          <h2>Create Textbook Adoption for {selectedCourse.course_name}</h2>
          <form onSubmit={handleSubmitForm}>
            <label>Publisher:</label>
            <input type="text" value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} style={inputStyle(colors)} />

            <label>Title:</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={inputStyle(colors)} />

            <label>Author:</label>
            <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} style={inputStyle(colors)} />

            <label>ISBN:</label>
            <input type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} style={inputStyle(colors)} />

            <label>Edition:</label>
            <input type="text" value={formData.edition} onChange={(e) => setFormData({ ...formData, edition: e.target.value })} style={inputStyle(colors)} />

            <label>Quantity:</label>
            <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} style={inputStyle(colors)} />

            <label>Other Materials:</label>
            <textarea value={formData.otherMaterials} onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })} style={{ ...inputStyle(colors), height: "60px" }} />

            <button type="submit" disabled={isSubmitting} style={buttonStyle(colors)}>
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </button>
          </form>
        </div>
      )}

      {/* Requests Section */}
      <div style={{ background: colors.paleBlue, padding: "20px", borderRadius: "10px", marginTop: "30px" }}>
        <h2 style={{ color: colors.darkText }}>Pending Requests for Approval</h2>
        {loadingForms ? <p>Loading...</p> : (
          forms.length === 0 ? <p>No pending requests.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {forms.map((form, index) => {
                const isExpanded = expandedForms.has(form.request_id) || index === 0;
                return (
                  <li key={form.request_id} style={{ backgroundColor: colors.white, padding: "15px", marginBottom: "15px", borderRadius: "8px" }}>
                    <p><strong>Course:</strong> {form.course_name}</p>
                    <p><strong>Instructor:</strong> {form.instructor_name}</p>
                    {!isExpanded && <button onClick={() => toggleExpand(form.request_id)} style={buttonStyle(colors)}>View Details</button>}

                    {isExpanded && (
                      <>
                        <p><strong>Term:</strong> {form.term}</p>
                        <p><strong>Date Submitted:</strong> {new Date(form.created_at).toLocaleDateString()}</p>
                        <p><strong>Title:</strong> {form.title}</p>
                        <p><strong>Author:</strong> {form.author}</p>
                        <p><strong>Publisher:</strong> {form.publisher}</p>
                        <p><strong>ISBN:</strong> {form.isbn}</p>
                        <p><strong>Edition:</strong> {form.edition}</p>
                        <p><strong>Quantity:</strong> {form.quantity}</p>
                        <p><strong>Other Materials:</strong> {form.otherMaterials || "None"}</p>
                        <p><strong>Status:</strong> {form.status}</p>
                        <button onClick={() => handleAcceptForm(form.request_id)} style={buttonStyle(colors)}>Approve</button>
                        <button onClick={() => handleRejectForm(form.request_id)} style={{ ...buttonStyle(colors), backgroundColor: "#ff7373", marginLeft: "10px" }}>Reject</button>
                        <button onClick={() => toggleExpand(form.request_id)} style={{ ...buttonStyle(colors), marginLeft: "10px", backgroundColor: "#ccc", color: colors.darkText }}>Collapse</button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        )}
      </div>
    </div>
  );
};

const inputStyle = (colors) => ({
  width: "100%",
  marginBottom: "10px",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  color: colors.darkText,
  fontSize: "15px"
});

const buttonStyle = (colors) => ({
  background: colors.steelBlue,
  color: "#fff",
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "10px"
});

export default HoD;
