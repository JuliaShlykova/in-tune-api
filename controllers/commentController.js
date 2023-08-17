const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment
      .find({'post': req.params.postId})
      .sort({'createdAt': 1})
      .populate('author', 'firstName lastName')
      .lean();
    res.status(200).json({comments});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.createComment = [
  body('text')
    .isLength({min: 1})
    .withMessage('comment must be specified')
    // maximum limit has been taken from facebook
    .isLength({max: 8000})
    .withMessage('comment mustn\'t exceed 8000')
    .escape(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const { text } = req.body;
      const newComment = new Comment({ text, post: req.params.postId, author: req.user._id });
      await newComment.save();
      res.sendStatus(200);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  }
]

exports.likeComment = async (req, res, next) => {
  try {
    await Comment.findByIdAndUpdate(
      req.params.commentId, 
      {$push: {'likes': req.user._id}});
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.deleteComment = async (req, res, next) => {
  try {
    await Comment.findByIdAndDelete(req.params.commentId);
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}