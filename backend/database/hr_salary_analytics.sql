-- Select the student's existing database before importing this file.
USE ip_std6730202629;

CREATE TABLE IF NOT EXISTS Tanawin_6730202629 (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(150) NOT NULL,
  status ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
  salary DECIMAL(12, 2) UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add demo employees only when the existing table has no rows.
INSERT INTO Tanawin_6730202629 (first_name, last_name, position, status, salary)
SELECT demo.first_name, demo.last_name, demo.position, demo.status, demo.salary
FROM (
  SELECT 'John' AS first_name, 'Doe' AS last_name, 'Software Engineer' AS position, 'Active' AS status, 45000 AS salary
  UNION ALL SELECT 'Jane', 'Smith', 'HR Manager', 'Active', 65000
  UNION ALL SELECT 'Alex', 'Johnson', 'UI/UX Designer', 'On Leave', 38000
  UNION ALL SELECT 'Maya', 'Chen', 'Data Analyst', 'Active', 52000
  UNION ALL SELECT 'Sam', 'Wilson', 'Intern', 'Active', 18000
  UNION ALL SELECT 'Nina', 'Patel', 'Engineering Lead', 'Active', 85000
) AS demo
WHERE NOT EXISTS (SELECT 1 FROM Tanawin_6730202629 LIMIT 1);
