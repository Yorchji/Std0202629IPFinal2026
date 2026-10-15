const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const TOKEN = 'mock-jwt-token';

// The exam specifies in-memory storage. Data resets when this process restarts.
let employees = [
  { id: '1', name: 'John Doe', position: 'Software Engineer', status: 'Active', salary: 45000 },
  { id: '2', name: 'Jane Smith', position: 'HR Manager', status: 'Active', salary: 65000 },
  { id: '3', name: 'Alex Johnson', position: 'UI/UX Designer', status: 'On Leave', salary: 38000 },
  { id: '4', name: 'Maya Chen', position: 'Data Analyst', status: 'Active', salary: 52000 },
  { id: '5', name: 'Sam Wilson', position: 'Intern', status: 'Active', salary: 18000 },
  { id: '6', name: 'Nina Patel', position: 'Engineering Lead', status: 'Active', salary: 85000 },
];
let nextEmployeeId = 7;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, api: 'online', storage: 'in-memory' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({ success: true, token: TOKEN });
  }
  return res.status(401).json({ success: false, error: 'Invalid username or password.' });
});

function requireAuth(req, res, next) {
  if (req.get('Authorization') !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
  }
  next();
}
app.use('/api/employees', requireAuth);

app.get('/api/employees', (_req, res) => res.json(employees));

app.post('/api/employees', (req, res) => {
  const { name, position, salary } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof position !== 'string' || !position.trim() || salary === '' || salary === undefined || salary === null) {
    return res.status(400).json({ success: false, error: 'Name, position, and salary are required.' });
  }
  const parsedSalary = Number(salary);
  if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
    return res.status(400).json({ success: false, error: 'Salary must be a non-negative number.' });
  }
  const employee = { id: String(nextEmployeeId++), name: name.trim(), position: position.trim(), status: 'Active', salary: parsedSalary };
  employees.push(employee);
  res.status(201).json(employee);
});

app.put('/api/employees/:id/status', (req, res) => {
  const employee = employees.find((item) => item.id === req.params.id);
  if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });
  employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
  res.json(employee);
});

app.delete('/api/employees/:id', (req, res) => {
  const index = employees.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Employee not found.' });
  const [removed] = employees.splice(index, 1);
  res.json({ success: true, employee: removed });
});

function kMeans1D(values, k = 3) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return [];
  const clusterCount = Math.min(k, sorted.length);
  let centroids = Array.from({ length: clusterCount }, (_, i) => sorted[Math.floor((i + 0.5) * sorted.length / clusterCount)]);
  let assignments = new Array(sorted.length).fill(-1);
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const nextAssignments = sorted.map((value) => {
      let nearest = 0;
      for (let i = 1; i < centroids.length; i += 1) {
        if (Math.abs(value - centroids[i]) < Math.abs(value - centroids[nearest])) nearest = i;
      }
      return nearest;
    });
    const nextCentroids = centroids.map((centroid, i) => {
      const members = sorted.filter((_value, index) => nextAssignments[index] === i);
      return members.length ? members.reduce((sum, value) => sum + value, 0) / members.length : centroid;
    });
    const stable = nextAssignments.every((value, index) => value === assignments[index]);
    assignments = nextAssignments;
    centroids = nextCentroids;
    if (stable) break;
  }
  return centroids.map((centroid, i) => ({ centroid, count: assignments.filter((assignment) => assignment === i).length }))
    .filter((cluster) => cluster.count > 0)
    .sort((a, b) => a.centroid - b.centroid)
    .map((cluster, i) => ({ group: `Tier ${i + 1}`, centroid: Math.round(cluster.centroid * 100) / 100, count: cluster.count }));
}

app.get('/api/employees/salary-clusters', (_req, res) => {
  const salaries = employees.map((employee) => employee.salary).filter(Number.isFinite);
  res.json({ success: true, employeeCount: salaries.length, clusters: kMeans1D(salaries) });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`HR API running on http://localhost:${PORT} (in-memory storage)`));
