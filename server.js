require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'attempts.json');

// Make sure the data file exists before we try to read/write it
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readAttempts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeAttempts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------
// PUBLIC: the game calls this after every question is answered
// ---------------------------------------------------------------------
app.post('/api/attempt', (req, res) => {
  const { sessionId, studentName, expr, submittedAnswer, correctAnswer, isCorrect, points } = req.body || {};

  if (!sessionId || !studentName || !expr) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const attempts = readAttempts();
  attempts.push({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    sessionId: String(sessionId).slice(0, 80),
    studentName: String(studentName).slice(0, 60),
    expr: String(expr).slice(0, 100),
    submittedAnswer,
    correctAnswer,
    isCorrect: !!isCorrect,
    points: Number(points) || 0,
    timestamp: new Date().toISOString(),
  });
  writeAttempts(attempts);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------
// ADMIN: everything below requires the admin username/password
// (the browser will show a native login prompt)
// ---------------------------------------------------------------------
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || 'changeme';

const adminAuth = basicAuth({
  users: { [adminUser]: adminPass },
  challenge: true,
  realm: 'BODMAS Admin',
});

app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

function summarize(attempts) {
  const sessions = {};
  attempts.forEach((a) => {
    if (!sessions[a.sessionId]) {
      sessions[a.sessionId] = {
        sessionId: a.sessionId,
        studentName: a.studentName,
        totalQuestions: 0,
        correctCount: 0,
        score: 0,
        firstAttempt: a.timestamp,
        lastAttempt: a.timestamp,
      };
    }
    const s = sessions[a.sessionId];
    s.totalQuestions += 1;
    if (a.isCorrect) s.correctCount += 1;
    s.score += a.points;
    if (a.timestamp < s.firstAttempt) s.firstAttempt = a.timestamp;
    if (a.timestamp > s.lastAttempt) s.lastAttempt = a.timestamp;
  });
  return Object.values(sessions).sort(
    (a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt)
  );
}

app.get('/api/admin/data', adminAuth, (req, res) => {
  const attempts = readAttempts();
  res.json({
    summary: summarize(attempts),
    attempts: attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
  });
});

app.get('/api/admin/export', adminAuth, async (req, res) => {
  const attempts = readAttempts();
  const summary = summarize(attempts);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BODMAS Challenge';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Correct', key: 'correctCount', width: 10 },
    { header: 'Total Questions', key: 'totalQuestions', width: 16 },
    { header: 'First Attempt', key: 'firstAttempt', width: 24 },
    { header: 'Last Attempt', key: 'lastAttempt', width: 24 },
    { header: 'Session ID', key: 'sessionId', width: 22 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  summary.forEach((s) => summarySheet.addRow(s));

  const attemptsSheet = workbook.addWorksheet('Attempts (Detail)');
  attemptsSheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Expression', key: 'expr', width: 22 },
    { header: 'Submitted Answer', key: 'submittedAnswer', width: 16 },
    { header: 'Correct Answer', key: 'correctAnswer', width: 15 },
    { header: 'Correct?', key: 'isCorrect', width: 10 },
    { header: 'Points', key: 'points', width: 8 },
    { header: 'Timestamp', key: 'timestamp', width: 24 },
    { header: 'Session ID', key: 'sessionId', width: 22 },
  ];
  attemptsSheet.getRow(1).font = { bold: true };
  attempts.forEach((a) =>
    attemptsSheet.addRow({ ...a, isCorrect: a.isCorrect ? 'Yes' : 'No' })
  );

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="bodmas-scores-${Date.now()}.xlsx"`
  );
  await workbook.xlsx.write(res);
  res.end();
});

app.listen(PORT, () => {
  console.log(`BODMAS server running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});
