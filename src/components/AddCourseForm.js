import React, { useState } from "react";

const AddCourseForm = ({ colors, onCourseAdded, hideHodField = false }) => {
  const [courseData, setCourseData] = useState({
    courseNumber: "",
    courseName: "",
    term: ""
  });

  const handleAddCourse = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    const hodId = role === "HoD" ? userId : "536488964";

    console.log("[DEBUG] Adding course:", {
      ...courseData,
      instructorId: userId,
      hodId,
    });

    if (!courseData.courseNumber || !courseData.courseName || !courseData.term) {
      alert("All fields are required.");
      return;
    }

    const response = await fetch("http://localhost:5009/api/add-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseNumber: courseData.courseNumber,
        courseName: courseData.courseName,
        term: courseData.term,
        instructorId: userId,
        hodId,
      }),
    });

    const result = await response.json();
    console.log("[DEBUG] Add course response:", result);

    if (response.ok) {
      alert("Course added!");
      setCourseData({ courseNumber: "", courseName: "", term: "" });
      onCourseAdded(); // refresh course list
    } else {
      alert(result.message || "Failed to add course.");
    }
  };

  return (
    <div style={{ background: colors.lightBlue, padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
      <h2 style={{ color: colors.darkText }}>Add a New Course</h2>
      <form onSubmit={handleAddCourse}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label>Course Number:</label>
            <input
              type="text"
              value={courseData.courseNumber}
              onChange={(e) => setCourseData({ ...courseData, courseNumber: e.target.value })}
              style={inputStyle(colors)}
            />
            <label>Course Name:</label>
            <input
              type="text"
              value={courseData.courseName}
              onChange={(e) => setCourseData({ ...courseData, courseName: e.target.value })}
              style={inputStyle(colors)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Term:</label>
            <input
              type="text"
              placeholder="e.g. Spring 2025"
              value={courseData.term}
              onChange={(e) => setCourseData({ ...courseData, term: e.target.value })}
              style={inputStyle(colors)}
            />

            {/* Only show HoD ID if hideHodField is false */}
            {!hideHodField && (
              <>
                <label>HoD ID:</label>
                <input
                  type="text"
                  value={localStorage.getItem("role") === "HoD" ? localStorage.getItem("userId") : "536488964"}
                  disabled
                  style={{ ...inputStyle(colors), backgroundColor: "#f0f0f0" }}
                />
              </>
            )}
          </div>
        </div>

        <button style={buttonStyle(colors)} type="submit">
          + Add Course
        </button>
      </form>
    </div>
  );
};

// Styles
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

export default AddCourseForm;
