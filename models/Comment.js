const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  text: {type: String, required: true},
  post: {type: Schema.Types.ObjectId, ref: 'Post'},
  author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  likes: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {
  timestamps: true,
  toJSON: {virtuals: true}
});

commentSchema.virtual('formatted_timestamp').get(function(){
  return DateTime.fromJSDate(this.updatedAt).toLocaleString(DateTime.DATETIME_MED);
})

module.exports = mongoose.model('Comment', commentSchema);