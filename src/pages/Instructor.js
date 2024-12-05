import React, { useEffect, useState } from "react";

const Instructor = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      const userId = localStorage.getItem("userId");
      console.log("Fetched userId from local storage:", userId);

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
        if (data.courses) {
          setCourses(data.courses);
        } else {
          setError(data.message || "No courses assigned to you.");
        }
      } catch (err) {
        setError(err.message || "Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Instructor;
