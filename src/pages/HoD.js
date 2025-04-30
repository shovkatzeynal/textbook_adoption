// Full updated HoD.js with steel blue theming and visible form list
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";

const HoD = () => {
  const [courses, setCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    publisher: "",
    title: "",
    author: "",
    isbn: "",
    edition: "",
    quantity: "",
    otherMaterials: "",
  });
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingForms, setLoadingForms] = useState(true);
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
    const fetchCourses = async () => {
      try {
        const response = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
        const result = await response.json();
        if (response.ok) setCourses(result.courses || []);
        else setError(result.message || "Failed to fetch courses.");
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Network error while fetching courses.");
      } finally {
        setLoadingCourses(false);
      }
    };

    console.log("HoD userId from localStorage 1:", userId);

    const fetchForms = async () => {
      try {
        const response = await fetch(`http://localhost:5009/api/hod-forms?hodId=${userId}`);
        const result = await response.json();
        console.log("HoD userId from localStorage:", userId);

        if (response.ok) setForms(result.forms || []);
        else setError(result.message || "Failed to fetch forms.");
      } catch (err) {
        console.error("Error fetching forms:", err);
        setError("Network error while fetching forms.");
      } finally {
        setLoadingForms(false);
      }
    };

    fetchCourses();
    fetchForms();
  }, [userId]);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setFormData({ publisher: "", title: "", author: "", isbn: "", edition: "", quantity: "", otherMaterials: "" });
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to submit this textbook adoption form?")) return;

    setIsSubmitting(true);

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
          requestedBy: userId
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert("✅ Textbook Adoption Form Submitted!");
        setSelectedCourse(null);
      } else {
        alert(result.message || "Failed to submit the form.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Error submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptForm = async (formId) => {
    try {
      const response = await fetch(`http://localhost:5009/api/approve-form/${formId}`, { method: "PATCH" });
      const result = await response.json();
      if (response.ok) {
        alert("Form approved successfully!");
        setForms(forms.filter((form) => form.request_id !== formId));
      } else alert(result.message || "Failed to approve the form.");
    } catch (err) {
      console.error("Error approving form:", err);
      alert("Error approving the form.");
    }
  };

  const handleRejectForm = async (formId) => {
    const rejectionComments = prompt("Enter a reason for rejection:");
    if (!rejectionComments) return;

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
      console.error("Error rejecting form:", err);
      alert("Error rejecting the form.");
    }
  };

  return (
    <div style={{ backgroundColor: colors.steelBlue, minHeight: "100vh", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: colors.white }}>Welcome, {fullName}!</h1>
        <LogoutButton />
      </div>

      {/* Course Buttons */}
      <div style={{ background: colors.paleBlue, padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
        <h2 style={{ color: colors.darkText }}>Your Courses</h2>
        {loadingCourses ? <p>Loading courses...</p> : (
          courses.length === 0 ? <p>No courses assigned yet.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {courses.map(course => (
                <li key={course.course_id} style={{ marginBottom: "10px" }}>
                  <button onClick={() => handleSelectCourse(course)} style={buttonStyle(colors)}>
                    {course.course_name} ({course.term})
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* Textbook Form */}
      {selectedCourse && (
        <div style={{ background: colors.lightBlue, padding: "20px", borderRadius: "10px" }}>
          <h2>Textbook Adoption for {selectedCourse.course_name}</h2>
          <form onSubmit={handleCreateForm}>
            <div style={{ marginBottom: "20px" }}>
              <strong>Course:</strong> {selectedCourse.course_name}<br />
              <strong>Term:</strong> {selectedCourse.term}<br />
              <strong>Date:</strong> {new Date().toISOString().split("T")[0]}
            </div>
            {/* form fields */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: "1" }}>
                <label>Publisher:</label>
                <input type="text" value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} style={inputStyle(colors)} />
                <label>Title:</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={inputStyle(colors)} />
                <label>Author:</label>
                <input type="text" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} style={inputStyle(colors)} />
              </div>
              <div style={{ flex: "1" }}>
                <label>Quantity:</label>
                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={inputStyle(colors)} />
                <label>ISBN:</label>
                <input type="text" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} style={inputStyle(colors)} />
                <label>Edition:</label>
                <input type="text" value={formData.edition} onChange={e => setFormData({ ...formData, edition: e.target.value })} style={inputStyle(colors)} />
              </div>
            </div>
            <label>Other Materials:</label>
            <textarea value={formData.otherMaterials} onChange={e => setFormData({ ...formData, otherMaterials: e.target.value })} style={{ ...inputStyle(colors), height: "80px" }} />
            <button type="submit" disabled={isSubmitting} style={buttonStyle(colors)}>
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </button>
          </form>
        </div>
      )}

      {/* Pending Requests Section */}
      {/* Pending Requests Section */}
<div style={{ background: colors.paleBlue, padding: "20px", borderRadius: "10px", marginTop: "30px" }}>
  <h2 style={{ color: colors.darkText }}>Pending Requests for Approval</h2>
  {loadingForms ? <p>Loading...</p> : (
    forms.length === 0 ? <p>No pending requests.</p> : (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {forms.map(form => (
          <li key={form.request_id} style={{ backgroundColor: colors.white, padding: "15px", marginBottom: "15px", borderRadius: "8px" }}>
            {/* Instructor & Course Info */}
            <p><strong>Instructor:</strong> {form.instructor_name}</p>
            <p><strong>Course:</strong> {form.course_name}</p>
            <p><strong>Term:</strong> {form.term}</p>
            <p><strong>Date Submitted:</strong> {new Date(form.created_at).toLocaleDateString()}</p>

            {/* Book Details */}
            <p><strong>Title:</strong> {form.title}</p>
            <p><strong>Author:</strong> {form.author}</p>
            <p><strong>Publisher:</strong> {form.publisher}</p>
            <p><strong>ISBN:</strong> {form.isbn}</p>
            <p><strong>Edition:</strong> {form.edition}</p>
            <p><strong>Quantity:</strong> {form.quantity}</p>
            <p><strong>Other Materials / Comments:</strong> {form.otherMaterials || "None"}</p>

            {/* Status & Actions */}
            <p><strong>Status:</strong> {form.status}</p>
            <button onClick={() => handleAcceptForm(form.request_id)} style={buttonStyle(colors)}>Approve</button>
            <button onClick={() => handleRejectForm(form.request_id)} style={{ ...buttonStyle(colors), backgroundColor: "#ff7373", marginLeft: "10px" }}>Reject</button>
          </li>
        ))}
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
  fontSize: "15px",
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
