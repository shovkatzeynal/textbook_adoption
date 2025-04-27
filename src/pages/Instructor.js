import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton"; // Assuming you created it

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
  const instructorName = localStorage.getItem("fullName") || "Instructor"; // Display full name


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
      if (response.ok && data.textbooks?.length > 0) {
        const textbook = data.textbooks[0];
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
          approvedBy: "12345",
        }),
      });

      const result = await response.json();

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
      alert("Failed to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Here are your courses, {instructorName}.</h1>
        <LogoutButton />
      </div>

      {loading && <p>Loading courses...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && courses.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {courses.map((course) => (
              <li key={course.course_id} style={{ marginBottom: "10px" }}>
                <button
                  onClick={() => handleFetchTextbook(course)}
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {course.course_name} ({course.term})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

{selectedCourse && (
  <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px", background: "#f9f9f9", marginTop: "30px" }}>
    <h2>Textbook Adoption for {selectedCourse.course_name}</h2>

    {submitSuccess && <p style={{ color: "green" }}>Form submitted successfully!</p>}

    <form onSubmit={handleSubmitForm}>
      {/* Display Fields */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Course Name:</strong> {selectedCourse.course_name}<br />
        <strong>Term:</strong> {selectedCourse.term}<br />
        <strong>Date:</strong> {new Date().toISOString().split("T")[0]}
      </div>

      {/* Editable Fields */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Left column */}
        <div style={{ flex: "1" }}>
          <label>Publisher:</label>
          <input
            type="text"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>Author:</label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        {/* Right column */}
        <div style={{ flex: "1" }}>
          <label>Quantity:</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>ISBN:</label>
          <input
            type="text"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>Edition:</label>
          <input
            type="text"
            value={formData.edition}
            onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
      </div>

      {/* Full width Other Materials */}
      <div style={{ marginTop: "20px" }}>
        <label>Other Materials:</label>
        <textarea
          value={formData.otherMaterials}
          onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
          style={{ width: "100%", height: "100px", marginTop: "5px" }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: isSubmitting ? "#ccc" : "#28a745",
          color: "white",
          border: "none",
          padding: "12px 20px",
          marginTop: "20px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {isSubmitting ? "Submitting..." : "Submit Form"}
      </button>
    </form>
  </div>
)}
    </div>
  );
};

export default InstructorPage;
