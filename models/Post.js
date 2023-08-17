const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  text: {type: String, required: true},
  private: {type: Boolean, default: false},
  author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  likes: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {
  timestamps: true,
  toJSON: {virtuals: true}
});

postSchema.virtual('formatted_timestamp').get(function(){
  return DateTime.fromJSDate(this.updatedAt).toLocaleString(DateTime.DATETIME_MED);
})

module.exports = mongoose.model('Post', postSchema);