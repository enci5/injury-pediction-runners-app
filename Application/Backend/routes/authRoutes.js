const express = require('express');
const router = express.Router();
const {signup} = require('../controllers/authController')


// POST /signup (Create a new user)
router.post('/signup', signup);

// POST /login (Login a user)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Error during login', error: err.message });
  }
});

module.exports = router;
