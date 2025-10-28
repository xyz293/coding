import express from 'express';
const app = express();
const PORT = 3000;
app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});
app.listen(PORT, () => {
  console.log(` http://localhost:${PORT}`);
})