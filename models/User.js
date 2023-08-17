const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  profileImgUrl: {type: String},
  profileImgId: {type: String},
  profileInfo: {
    location: {type: String},
    dateOfBirth: {type: Date},
    occupation: {type: String},
    hobbies: {type: String}
  },
  friends: [{user: {type: Schema.Types.ObjectId, ref: 'User'}, status: {type: String, enum: ['Friend', 'RequestReceived', 'RequestSent'], default: 'Friend'}}]
});

module.exports = mongoose.model('User', userSchema );