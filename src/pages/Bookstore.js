import React, { useEffect, useState } from "react";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";

const Bookstore = () => {
  const [forms, setForms] = useState([]);

  const colors = {
    steelBlue: "#4682B4",
    lightBlue: "#d0e7ff",
    paleBlue: "#eaf4ff",
    white: "#ffffff",
    darkText: "#1f2d3d"
  };

  // Fetch form data when component mounts
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await axios.get("http://localhost:5009/api/bookstore/forms");
      setForms(response.data.forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };

  // Update form status when dropdown is changed
  const updateStatus = async (requestId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5009/api/bookstore/forms/${requestId}/update-status`, {
        newStatus
      });
      fetchForms();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Delete form after double confirmation
  const deleteForm = async (requestId) => {
    const confirm1 = window.confirm("Are you sure you want to delete this form?");
    if (!confirm1) return;
    const confirm2 = window.confirm("This action is irreversible. Delete permanently?");
    if (!confirm2) return;

    try {
      await axios.delete(`http://localhost:5009/api/bookstore/forms/${requestId}/delete`);
      fetchForms();
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  return (
    <div style={{ backgroundColor: colors.steelBlue, minHeight: "100vh", padding: "30px" }}>
      {/* Header and logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: colors.white }}>📚 Bookstore Dashboard</h1>
        <LogoutButton />
      </div>

      <div style={{ backgroundColor: colors.paleBlue, padding: "20px", borderRadius: "10px" }}>
        {forms.length === 0 ? (
          <p style={{ color: colors.darkText }}>No forms available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: colors.steelBlue, color: colors.white }}>
                <th style={thStyle}>Instructor</th>
                <th style={thStyle}>Course</th>
                <th style={thStyle}>Term</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Author</th>
                <th style={thStyle}>Edition</th>
                <th style={thStyle}>ISBN</th>
                <th style={thStyle}>Publisher</th>
                <th style={thStyle}>Quantity</th>
                <th style={thStyle}>Comments</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.request_id} style={{ backgroundColor: colors.white }}>
                  <td style={tdStyle}>{form.instructor_name}</td>
                  <td style={tdStyle}>{form.course_name}</td>
                  <td style={tdStyle}>{form.term}</td>
                  <td style={tdStyle}>{form.title}</td>
                  <td style={tdStyle}>{form.author}</td>
                  <td style={tdStyle}>{form.edition}</td>
                  <td style={tdStyle}>{form.isbn}</td>
                  <td style={tdStyle}>{form.publisher}</td>
                  <td style={tdStyle}>{form.quantity}</td>
                  <td style={tdStyle}>{form.otherMaterials || "None"}</td>
                  <td style={tdStyle}>{new Date(form.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <select
                      value={form.status}
                      onChange={(e) => updateStatus(form.request_id, e.target.value)}
                      style={{ padding: "5px", borderRadius: "4px" }}
                    >
                      <option value="Ready to be ordered">Ready to be ordered</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Arrived">Arrived</option>
                      <option value="Ready to pick up">Ready to pick up</option>
                      <option value="Picked up">Picked up</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => deleteForm(form.request_id)}
                      style={{ ...buttonStyle(colors), backgroundColor: "#cc0000" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: "10px",
  textAlign: "left",
  borderBottom: "1px solid #ccc"
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top"
};

const buttonStyle = (colors) => ({
  background: colors.steelBlue,
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold"
});

export default Bookstore;
