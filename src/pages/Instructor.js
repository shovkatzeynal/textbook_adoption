import React, { useEffect, useState } from "react";

const Instructor = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formCourse, setFormCourse] = useState(null); // Track the course for which the form is being created
  const [formData, setFormData] = useState({}); // Store form data

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
        if (!response.ok) {
          throw new Error("Failed to fetch courses.");
        }

        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message || "Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCreateForm = async (course) => {
    setFormCourse(course); // Set the course for which the form is being created
    try {
      const response = await fetch(
        `http://localhost:5009/api/textbook?courseNumber=${course.course_number}&term=${course.term}`
      );
      const data = await response.json();

      // If existing textbook data is found, pre-fill the form
      setFormData(
        data.textbook || {
          course_name: course.course_name,
          course_number: course.course_number,
          term: course.term,
          date: new Date().toLocaleDateString(),
          instructor: localStorage.getItem("instructorName") || "Instructor Name",
          quantity: "",
          publisher: "",
          title: "",
          author: "",
          isbn: "",
          edition: "",
          other_materials: "",
        }
      );
    } catch (err) {
      console.error("Error fetching existing textbook:", err);
      setFormData({
        course_name: course.course_name,
        course_number: course.course_number,
        term: course.term,
        date: new Date().toLocaleDateString(),
        instructor: localStorage.getItem("instructorName") || "Instructor Name",
        quantity: "",
        publisher: "",
        title: "",
        author: "",
        isbn: "",
        edition: "",
        other_materials: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);

    try {
      const response = await fetch("http://localhost:5009/api/submitForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Form submitted successfully!");
        setFormCourse(null); // Close the form
      } else {
        alert("Failed to submit the form. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("A network or server error occurred. Please try again later.");
    }
  };

  return (
    <div>
      <h1>Welcome to the Instructor Dashboard!</h1>
      {loading && <p>Loading courses...</p>}
      {error && <p>{error}</p>}
      {!loading && courses.length > 0 && (
        <div>
          <h2>Your Courses</h2>
          <ul>
            {courses.map((course) => (
              <li key={course.course_number}>
                {course.course_name} ({course.term})
                <button onClick={() => handleCreateForm(course)}>Create/Edit Form</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loading && courses.length === 0 && <p>No courses assigned to you.</p>}

      {formCourse && (
        <form onSubmit={handleSubmitForm} style={{ marginTop: "20px" }}>
          <h3>Create/Edit Form for {formCourse.course_name}</h3>
          <div>
            <label>Course Name:</label>
            <input type="text" value={formData.course_name} disabled />
          </div>
          <div>
            <label>Course Number:</label>
            <input type="text" value={formData.course_number} disabled />
          </div>
          <div>
            <label>Term:</label>
            <input type="text" value={formData.term} disabled />
          </div>
          <div>
            <label>Date:</label>
            <input type="text" value={formData.date} disabled />
          </div>
          <div>
            <label>Instructor Signature:</label>
            <input type="text" value={formData.instructor} disabled />
          </div>
          <div>
            <label>Quantity:</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
          </div>
          <div>
            <label>Publisher:</label>
            <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} required />
          </div>
          <div>
            <label>Textbook Title:</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
          </div>
          <div>
            <label>Author:</label>
            <input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
          </div>
          <div>
            <label>ISBN#:</label>
            <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} required />
          </div>
          <div>
            <label>Edition:</label>
            <input type="text" name="edition" value={formData.edition} onChange={handleInputChange} required />
          </div>
          <div>
            <label>Other Materials:</label>
            <textarea name="other_materials" value={formData.other_materials} onChange={handleInputChange} />
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={() => setFormCourse(null)} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default Instructor;
