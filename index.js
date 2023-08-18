if (process.env.NODE_ENV!=='production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const dbConnect = require('./configs/db.config');

const postRouter = require('./routes/postRoute');
const userRouter = require('./routes/userRoute');

const authRouter = require('./routes/authRoute');
const passport = require('passport');
require('./configs/passport.config')(passport);

const app = express();

app.use(cors({
  'origin': '*'
}));
app.use(helmet());
app.use(compression());
app.use(rateLimit({
  widnowMs: 1*60*1000,
  max: 40
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use('/posts', postRouter);
app.use('/user', userRouter);

app.use('/auth', authRouter);

app.use((req, res) => {
  res.sendStatus(404);
})

app.use((err, req, res) => {
  res.sendStatus(err.status||500);
})

const PORT = process.env.PORT || 5000;


dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log('server is listening on port ' + PORT);
  })
})