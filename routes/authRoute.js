const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getToken } = require('../utils/jwt');
const router = express.Router();
const passport = require('passport');

const User = require('../models/User');

router.post('/signup', 
  body('firstName')
  .trim()
  .isLength({min: 1})
  .escape()
  .withMessage('first name must be specified')
  .isLength({max: 40})
  .withMessage('first name mustn\'t exceed 40 characters'),
  body('lastName')
  .trim()
  .isLength({min: 1})
  .escape()
  .withMessage('last name must be specified')
  .isLength({max: 40})
  .withMessage('last name mustn\'t exceed 40 characters'),
  body('email')
  .trim()
  .isEmail()
  .isLength({min: 1})
  .escape()
  .withMessage('email must be specified')
  .isLength({max: 254})
  .withMessage('email mustn\'t exceed 254 characters'),  
  body('password')
  .trim()
  .isLength({min: 8})
  .escape()
  .withMessage('password must be at least 8 characters'),
  body('confirm_password')
  .trim()
  .escape()
  .custom((value, {req}) => {
    if (value!==req.body.password) {
      throw new Error('Passwords must be the same');
    }
    return true;
  }),
  async(req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({"errors": errors.array()});
      }
      const existingUser = await User.findOne({email});
      if (existingUser) {
        return res.status(409).json({"errors": [{ msg: 'The email is already in the database. Please, login.' }]})
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, firstName, lastName, password: hashedPassword });
      await newUser.save();
      const token = getToken({userId: newUser._id});
      res.status(200).json({ message: 'User registered successfully', token, userId: newUser._id});
    } catch(err) {
      console.log(err.message);
      res.sendStatus(500);
    }
  }
)

router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = getToken({userId: user._id});

    res.status(200).json({ message: "Logged in successfully", token, userId: user._id});
  } catch(err) {
    console.log(err.message);
    res.sendStatus(500);
  }
})

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email'], session: false}));

router.get('/google/callback', (req, res) => {
  passport.authenticate( 'google', {
    session: false
  }, (err, user) => {
    if (!user) {
      return res.sendStatus(400);
    }
    const token = getToken({userId: user._id});
    res.cookie('token', token, {
      domain: 'in-tune-frontend.vercel.app',
      sameSite: 'none'
    });
    res.cookie('user', user._id.toString(), {
      domain: 'in-tune-frontend.vercel.app',
      sameSite: 'none'
    });
    res.redirect(process.env.HOST_URL);
  })(req, res)
}
);

module.exports = router;