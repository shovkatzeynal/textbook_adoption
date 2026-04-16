import React, { useState, useEffect } from "react";

const AddCourseForm = ({ colors, onCourseAdded, hideHodField = false }) => {
  const [courseData, setCourseData] = useState({
    courseNumber: "",
    courseName: "",
    term: "",
  });
  const [hods, setHods] = useState([]);
  const [selectedHodId, setSelectedHodId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  // Fetch HoDs on mount (only needed if instructor, not HoD themselves)
  useEffect(() => {
    if (role !== "Head of Department") {
      fetch("http://localhost:5009/api/hods")
        .then((res) => res.json())
        .then((data) => {
          if (data.hods && data.hods.length > 0) {
            setHods(data.hods);
            // Auto-select first HoD if only one exists
            if (data.hods.length === 1) {
              setSelectedHodId(String(data.hods[0].user_id));
            }
          }
        })
        .catch((err) => console.error("[ERROR] Fetching HoDs:", err));
    }
  }, [role]);

  const handleAddCourse = async (e) => {
    e.preventDefault();

    if (!courseData.courseNumber || !courseData.courseName || !courseData.term) {
      alert("All fields are required.");
      return;
    }

    // If the logged-in user is HoD, they are their own HoD
    const hodId = role === "Head of Department" ? userId : selectedHodId;

    if (!hodId) {
      alert("Please select a Head of Department.");
      return;
    }

    setIsSubmitting(true);

    console.log("[DEBUG] Adding course:", {
      ...courseData,
      instructorId: userId,
      hodId,
    });

    try {
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
        if (hods.length !== 1) setSelectedHodId("");
        if (onCourseAdded) onCourseAdded(); // refresh course list
      } else {
        alert(result.message || "Failed to add course.");
      }
    } catch (err) {
      console.error("[ERROR] Adding course:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: colors.lightBlue,
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "30px",
      }}
    >
      <h2 style={{ color: colors.darkText }}>Add a New Course</h2>
      <form onSubmit={handleAddCourse}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label>Course Number:</label>
            <input
              type="text"
              value={courseData.courseNumber}
              onChange={(e) =>
                setCourseData({ ...courseData, courseNumber: e.target.value })
              }
              style={inputStyle(colors)}
            />
            <label>Course Name:</label>
            <input
              type="text"
              value={courseData.courseName}
              onChange={(e) =>
                setCourseData({ ...courseData, courseName: e.target.value })
              }
              style={inputStyle(colors)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Term:</label>
            <input
              type="text"
              placeholder="e.g. Spring 2025"
              value={courseData.term}
              onChange={(e) =>
                setCourseData({ ...courseData, term: e.target.value })
              }
              style={inputStyle(colors)}
            />

            {/* HoD field — shown unless hideHodField is true */}
            {!hideHodField && role !== "Head of Department" && (
              <>
                <label>Head of Department:</label>
                {hods.length === 0 ? (
                  <p style={{ color: "gray", fontSize: "14px" }}>Loading HoDs...</p>
                ) : hods.length === 1 ? (
                  <input
                    type="text"
                    value={`${hods[0].first_name} ${hods[0].last_name}`}
                    readOnly
                    style={{
                      ...inputStyle(colors),
                      backgroundColor: "#f0f0f0",
                      cursor: "not-allowed",
                    }}
                  />
                ) : (
                  <select
                    value={selectedHodId}
                    onChange={(e) => setSelectedHodId(e.target.value)}
                    style={inputStyle(colors)}
                  >
                    <option value="">-- Select Head of Department --</option>
                    {hods.map((hod) => (
                      <option key={hod.user_id} value={String(hod.user_id)}>
                        {hod.first_name} {hod.last_name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        </div>

        <button
          style={buttonStyle(colors)}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "+ Add Course"}
        </button>
      </form>
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
  marginTop: "10px",
});

export default AddCourseForm;