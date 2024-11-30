CREATE SCHEMA IF NOT EXISTS textbook_adopt_mvsu;
USE textbook_adopt_mvsu;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Instructor', 'Head of Department', 'Bookstore')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_number VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    term VARCHAR(50) NOT NULL,
    instructor_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE textbooks (
    textbook_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id),
    publisher VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    edition VARCHAR(50),
    quantity INTEGER CHECK (quantity >= 0),
    other_materials TEXT,
    status VARCHAR(50) CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requests (
    request_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id),
    textbook_id INTEGER REFERENCES textbooks(textbook_id),
    requested_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    status VARCHAR(50) CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Sent to Bookstore')) DEFAULT 'Pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP,
    sent_to_bookstore BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES requests(request_id),
    user_id INTEGER REFERENCES users(user_id),
    notification_type VARCHAR(100) NOT NULL, -- e.g., 'Book Ready', 'Form Rejected'
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert mock users
INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES
('John', 'Doe', 'instructor@example.com', '1234567890', 'hashed_password', 'Instructor'),
('Jane', 'Smith', 'hod@example.com', '9876543210', 'hashed_password', 'Head of Department'),
('Admin', 'Bookstore', 'bookstore@example.com', NULL, 'hashed_password', 'Bookstore');

-- Insert mock courses
INSERT INTO courses (course_number, course_name, term, instructor_id) VALUES
('MATH101', 'Mathematics 101', 'Fall 2024', 1),
('PHYS201', 'Physics 201', 'Fall 2024', 1);

-- Insert mock textbooks
INSERT INTO textbooks (course_id, publisher, title, author, isbn, edition, quantity, other_materials) VALUES
(1, 'Pearson', 'Algebra Basics', 'John Algebra', '1234567890', '1st', 30, 'None'),
(2, 'McGraw Hill', 'Physics Fundamentals', 'Jane Physics', '0987654321', '2nd', 20, 'None');

-- Insert mock requests
INSERT INTO requests (course_id, textbook_id, requested_by, approved_by, status) VALUES
(1, 1, 1, 2, 'Pending'),
(2, 2, 1, 2, 'Pending');

