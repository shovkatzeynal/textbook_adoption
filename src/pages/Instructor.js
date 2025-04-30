import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";

const InstructorPage = () => {
  const [courses, setCourses] = useState([]);
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const instructorName = localStorage.getItem("fullName") || "Instructor";

  // Facebook-style Steel Blue colors
  const colors = {
    steelBlue: "#4682B4",
    lightBlue: "#d0e7ff",
    paleBlue: "#eaf4ff",
    white: "#ffffff",
    darkText: "#1f2d3d"
  };

  // Fetch instructor's courses on load
  useEffect(() => {
    const fetchCourses = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("No user ID found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5009/api/courses?userId=${userId}`);
        const data = await response.json();
        if (response.ok && data.courses) {
          setCourses(data.courses);
        } else {
          setError(data.message || "Failed to fetch courses.");
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err.message || "Network error.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleFetchTextbook = async (course) => {
    setSelectedCourse(course);

    try {
      const response = await fetch(`http://localhost:5009/api/textbooks/${course.course_id}`);
      const data = await response.json();
      if (response.ok && data.course) {
        const textbook = data.course;
        setFormData({
          publisher: textbook.publisher || "",
          title: textbook.title || "",
          author: textbook.author || "",
          isbn: textbook.isbn || "",
          edition: textbook.edition || "",
          quantity: textbook.quantity || "",
          otherMaterials: textbook.other_materials || "",
        });
      } else {
        // No textbook, clear fields
        setFormData({
          publisher: "",
          title: "",
          author: "",
          isbn: "",
          edition: "",
          quantity: "",
          otherMaterials: "",
        });
      }
    } catch (err) {
      console.error("Error fetching textbook:", err);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      console.log("Submitting form with approvedBy (HoD ID):", selectedCourse.hod_id); // Debug log

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
          requestedBy: localStorage.getItem("userId"),
          approvedBy: selectedCourse.hod_id,
        }),
      });

      const result = await response.json();

      console.log("Submission result:", result); // debug log

      if (response.ok) {
        setSubmitSuccess(true);
        setSelectedCourse(null);
        setFormData({
          publisher: "",
          title: "",
          author: "",
          isbn: "",
          edition: "",
          quantity: "",
          otherMaterials: "",
        });
      } else {
        alert(result.message || "Failed to submit the form.");
      }
    } catch (err) {
      console.error("Error submitting the form:", err);
      alert("Error submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: colors.steelBlue, minHeight: "100vh", padding: "30px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: colors.white }}>Welcome, {instructorName}!</h1>
        <LogoutButton />
      </div>

      {/* Courses Section */}
      <div style={{ background: colors.paleBlue, padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
        <h2 style={{ color: colors.darkText }}>Your Courses</h2>
        {loading ? (
          <p>Loading courses...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : courses.length === 0 ? (
          <p>No courses assigned yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {courses.map((course) => (
              <li key={course.course_id} style={{ marginBottom: "10px" }}>
                <button
                  onClick={() => handleFetchTextbook(course)}
                  style={buttonStyle(colors)}
                >
                  {course.course_name} ({course.term})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form Section */}
      {selectedCourse && (
        <div style={{ background: colors.lightBlue, padding: "20px", borderRadius: "10px" }}>
          <h2>Textbook Adoption for {selectedCourse.course_name}</h2>

          {submitSuccess && <p style={{ color: "green" }}>Form submitted successfully!</p>}

          <form onSubmit={handleSubmitForm}>
            <div style={{ marginBottom: "20px" }}>
              <strong>Course:</strong> {selectedCourse.course_name}<br />
              <strong>Term:</strong> {selectedCourse.term}<br />
              <strong>Date:</strong> {new Date().toISOString().split("T")[0]}
            </div>

            {/* Form Fields in Two Columns */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: "1" }}>
                <label>Publisher:</label>
                <input type="text" value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} style={inputStyle(colors)} />

                <label>Title:</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={inputStyle(colors)} />

                <label>Author:</label>
                <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} style={inputStyle(colors)} />
              </div>

              <div style={{ flex: "1" }}>
                <label>Quantity:</label>
                <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} style={inputStyle(colors)} />

                <label>ISBN:</label>
                <input type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} style={inputStyle(colors)} />

                <label>Edition:</label>
                <input type="text" value={formData.edition} onChange={(e) => setFormData({ ...formData, edition: e.target.value })} style={inputStyle(colors)} />
              </div>
            </div>

            {/* Other Materials Field */}
            <label>Other Materials:</label>
            <textarea
              value={formData.otherMaterials}
              onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
              style={{ ...inputStyle(colors), height: "80px" }}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={buttonStyle(colors)}
            >
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// Style for input fields
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

// Style for buttons
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

export default InstructorPage;
