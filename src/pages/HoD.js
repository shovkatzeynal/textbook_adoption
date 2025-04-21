import React, { useEffect, useState } from "react";

const hodId = localStorage.getItem("userId"); // Assuming the HoD ID is stored in localStorage
const response = await fetch(`http://localhost:5009/api/hod-forms?hodId=${hodId}`);

const HoD = () => {
  const [forms, setForms] = useState([]); // Forms submitted by instructors
  const [formData, setFormData] = useState({
    courseId: "",
    courseName: "",
    term: "",
    date: new Date().toISOString().split("T")[0], // Today's date
    publisher: "",
    title: "",
    author: "",
    isbn: "",
    edition: "",
    quantity: "",
    otherMaterials: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId"); // HoD ID

  // Fetch forms submitted by instructors
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const hodId = localStorage.getItem("userId");
        const response = await fetch(`http://localhost:5009/api/hod-forms?hodId=${hodId}`);
        const result = await response.json();
  
        if (response.ok) {
          setForms(result.forms);
        } else {
          console.error("Error fetching forms:", result.message);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      }
    };
  
    fetchForms();
  }, []);
  

  // Handle creating a form
  const handleCreateForm = async () => {
    if (!window.confirm("Are you sure you want to submit this form?")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5009/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requestedBy: userId, // HoD ID
          approvedBy: "bookstore", // Directly goes to bookstore
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        setFormData({
          courseId: "",
          courseName: "",
          term: "",
          date: new Date().toISOString().split("T")[0],
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
      console.error("Error submitting form:", err);
      alert("Failed to submit the form.");
    }
  };

  // Handle accepting a form
  const handleAcceptForm = async (formId) => {
    try {
      const response = await fetch(`http://localhost:5009/api/approve-form/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: userId, status: "Approved" }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Form approved successfully!");
        setForms(forms.filter((form) => form.request_id !== formId));
      } else {
        alert(result.message || "Failed to approve the form.");
      }
    } catch (err) {
      console.error("Error approving form:", err);
      alert("Failed to approve the form.");
    }
  };

  // Handle rejecting a form
  const handleRejectForm = async (formId) => {
    const rejectionComments = prompt("Enter rejection reason:");
    if (!rejectionComments) return;

    try {
      const response = await fetch(`http://localhost:5009/api/reject-form/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedBy: userId, status: "Rejected", rejectionComments }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Form rejected successfully!");
        setForms(forms.filter((form) => form.request_id !== formId));
      } else {
        alert(result.message || "Failed to reject the form.");
      }
    } catch (err) {
      console.error("Error rejecting form:", err);
      alert("Failed to reject the form.");
    }
  };

  return (
    <div>
      <h1>Head of Department Dashboard</h1>
      {loading && <p>Loading forms...</p>}
      {error && <p>{error}</p>}

      {/* Create Form Section */}
      <div>
        <h2>Create a Textbook Adoption Form</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateForm();
          }}
        >
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

      {/* Forms Management Section */}
      <div>
        <h2>Submitted Forms</h2>
        {forms.length === 0 ? (
          <p>No forms available.</p>
        ) : (
          <ul>
            {forms.map((form) => (
              <li key={form.request_id}>
                <p>
                  <strong>Course:</strong> {form.course_name} ({form.course_number})
                </p>
                <p>
                  <strong>Title:</strong> {form.title} | <strong>Author:</strong> {form.author}
                </p>
                <p>
                  <button onClick={() => handleAcceptForm(form.request_id)}>Accept</button>
                  <button onClick={() => handleRejectForm(form.request_id)}>Reject</button>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HoD;
