import React, { useState, useEffect } from "react";

const Instructor = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState({
    course_id: "",
    textbook_title: "",
    author: "",
    edition: "",
    isbn: "",
    quantity: "",
    other_materials: "",
  });
  const [submittedForms, setSubmittedForms] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch courses taught by the instructor (hardcoded for now)
    const mockCourses = [
      { course_id: 1, course_name: "Intro to Data Processing", term: "Fall 2024" },
      { course_id: 2, course_name: "Survey of Computer Science", term: "Fall 2024" },
    ];
    setCourses(mockCourses);

    // Fetch submitted forms (mock data for now)
    const mockSubmittedForms = [
      {
        course_id: 1,
        textbook_title: "Data Structures 101",
        author: "John Doe",
        edition: "1st",
        isbn: "1111111111",
        quantity: 50,
        other_materials: "None",
        status: "Rejected",
        rejection_comments: "Please correct the edition.",
      },
    ];
    setSubmittedForms(mockSubmittedForms);

    // Fetch notifications (mock data for now)
    const mockNotifications = [
      { id: 1, type: "Form Rejected", message: "Your form for Intro to Data Processing was rejected." },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);

    // Check if a form already exists for this course
    const existingForm = submittedForms.find((form) => form.course_id === course.course_id);
    if (existingForm) {
      setForm(existingForm);
    } else {
      setForm({
        course_id: course.course_id,
        textbook_title: "",
        author: "",
        edition: "",
        isbn: "",
        quantity: "",
        other_materials: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmitForm = () => {
    alert(`Form for ${selectedCourse.course_name} submitted to HoD!`);
    // Add logic to send the form to the backend for submission
  };

  return (
    <div>
      <h1>Welcome to the Instructor Dashboard!</h1>

      <h2>Your Courses</h2>
      <ul>
        {courses.map((course) => (
          <li key={course.course_id}>
            {course.course_name} ({course.term})
            <button onClick={() => handleCourseSelect(course)}>Create/Edit Form</button>
          </li>
        ))}
      </ul>

      {selectedCourse && (
        <div>
          <h2>Create/Edit Form for {selectedCourse.course_name}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitForm();
            }}
          >
            <div>
              <label>Course Name:</label>
              <input type="text" value={selectedCourse.course_name} disabled />
            </div>
            <div>
              <label>Term:</label>
              <input type="text" value={selectedCourse.term} disabled />
            </div>
            <div>
              <label>Textbook Title:</label>
              <input
                type="text"
                name="textbook_title"
                value={form.textbook_title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Author:</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Edition:</label>
              <input
                type="text"
                name="edition"
                value={form.edition}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label>ISBN:</label>
              <input
                type="text"
                name="isbn"
                value={form.isbn}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Other Materials:</label>
              <textarea
                name="other_materials"
                value={form.other_materials}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <button type="submit">Submit Form</button>
          </form>
        </div>
      )}

      <h2>Submitted Forms</h2>
      {submittedForms.length > 0 ? (
        <ul>
          {submittedForms.map((form) => (
            <li key={form.course_id}>
              <strong>{courses.find((c) => c.course_id === form.course_id)?.course_name}</strong> -{" "}
              {form.status}
              {form.status === "Rejected" && <p>Comments: {form.rejection_comments}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No forms submitted yet.</p>
      )}

      <h2>Notifications</h2>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>{notification.message}</li>
          ))}
        </ul>
      ) : (
        <p>No notifications at the moment.</p>
      )}
    </div>
  );
};

export default Instructor;
