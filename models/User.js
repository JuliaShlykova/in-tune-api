const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: {type: String},
  email: {type: String},
  password: {type: String},
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
}, {
  toJSON: {virtuals: true}
});

userSchema.virtual('formatted_dateOfBirth').get(function(){
  return DateTime.fromJSDate(this.profileInfo.dateOfBirth).toLocaleString(DateTime.DATE_MED);
})

module.exports = mongoose.model('User', userSchema );