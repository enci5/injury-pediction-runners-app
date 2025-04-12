const express = require('express');
const router = express.Router();
const {signup, login} = require('../controllers/authController')


// POST /signup (Create a new user)
router.post('/signup', signup);

// POST /login (Login a user)
router.post('/login', login);

module.exports = router;
