import React, { useEffect, useState } from "react";

const InstructorPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    term: "",
    date: "",
    courseId: "",
    courseName: "",
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
    const { course_id, course_name, term } = course;

    // Pre-fill term, date, courseId, and courseName
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      term,
      date: today,
      courseId: course_id,
      courseName: course_name,
      publisher: "",
      title: "",
      author: "",
      isbn: "",
      edition: "",
      quantity: "",
      otherMaterials: "",
    }));

    try {
      const response = await fetch(`http://localhost:5009/api/textbooks/${course_id}`);
      const data = await response.json();
      if (response.ok && data.textbooks?.length > 0) {
        const textbook = data.textbooks[0]; // Assuming one textbook per course
        setFormData((prev) => ({
          ...prev,
          publisher: textbook.publisher || "",
          title: textbook.title || "",
          author: textbook.author || "",
          isbn: textbook.isbn || "",
          edition: textbook.edition || "",
          quantity: textbook.quantity || "",
          otherMaterials: textbook.other_materials || "",
        }));
      }
    } catch (err) {
      console.error("Error fetching textbook:", err);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5009/api/textbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Textbook adoption form submitted successfully!");
      } else {
        alert(data.message || "Failed to submit form.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("An error occurred while submitting the form.");
    }
  };

  return (
    <div>
      <h1>Instructor Dashboard</h1>
      {loading && <p>Loading courses...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && courses.length > 0 && (
        <div>
          <h2>Your Courses</h2>
          <ul>
            {courses.map((course) => (
              <li key={course.course_id}>
                {course.course_name} ({course.term}){" "}
                <button onClick={() => handleFetchTextbook(course)}>Create/Edit Form</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedCourse && (
        <div>
          <h2>Textbook Adoption Form</h2>
          <form onSubmit={handleSubmitForm}>
  <label>
    Term:
    <input type="text" value={formData.term} readOnly />
  </label>
  <label>
    Date:
    <input type="text" value={formData.date} readOnly />
  </label>
  <label>
    Course ID:
    <input type="text" value={formData.courseId} readOnly />
  </label>
  <label>
    Course Name:
    <input type="text" value={formData.courseName} readOnly />
  </label>
  <label>
    Publisher:
    <input
      type="text"
      value={formData.publisher}
      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
    />
  </label>
  <label>
    Title:
    <input
      type="text"
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
    />
  </label>
  <label>
    Author:
    <input
      type="text"
      value={formData.author}
      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
    />
  </label>
  <label>
    ISBN:
    <input
      type="text"
      value={formData.isbn}
      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
    />
  </label>
  <label>
    Edition:
    <input
      type="text"
      value={formData.edition}
      onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
    />
  </label>
  <label>
    Quantity:
    <input
      type="number"
      value={formData.quantity}
      min="1"
      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
    />
  </label>
  <label>
    Other Materials:
    <textarea
      value={formData.otherMaterials}
      onChange={(e) => setFormData({ ...formData, otherMaterials: e.target.value })}
    />
  </label>
  <button type="submit">Submit</button>
</form>
        </div>
      )}
    </div>
  );
};

export default InstructorPage;
