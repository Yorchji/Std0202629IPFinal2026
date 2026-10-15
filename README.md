# HR Manager & Salary Analytics System

Exam project for Internet Programming (2026), built with an Express API and an Expo / React Native app.

## Requirements

- Node.js 18 or later
- npm

## Start the backend

```powershell
cd backend
npm install
npm start
```

The API listens on port 3000 and uses the in-memory employee array specified in the exam. Data resets when the backend process restarts. Check `http://localhost:3000/api/health` to confirm the API is running.

## Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm start
```

Use Expo Go or an emulator to open the app. The default API address is `http://localhost:3000/api`. For a physical phone, set `EXPO_PUBLIC_API_URL` to `http://<your-computer-LAN-IP>:3000/api` before starting Expo. Android emulator users may need `http://10.0.2.2:3000/api`.

## Demo login

- Username: `admin`
- Password: `password123`

All employee endpoints require `Authorization: Bearer mock-jwt-token`, returned by the login endpoint.

## API

- `POST /api/login`
- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id/status`
- `DELETE /api/employees/:id`
- `GET /api/employees/salary-clusters`

The repository must be named `Std0202629IPFinal2026` before public GitHub submission.
