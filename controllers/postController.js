const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

exports.getPublicPosts = async (req, res, next) => {
  try {
    const publicPosts = await Post
      .find({private: false})
      .sort({createdAt: -1})
      .select('-__v -private')
      .populate('author', 'firstName lastName profileImgUrl');
    res.status(200).json({requestedPosts: publicPosts});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getFriendsPosts = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id, 'friends').lean();
    const curUserFriends = currentUser['friends'].map(friend => friend.user);
    const privatePosts = await Post
      .find({private: true, author: {$in: [...curUserFriends, req.user._id]}})
      .sort({createdAt: -1})
      .select('-__v -private')
      .populate('author', 'firstName lastName profileImgUrl');
    res.status(200).json({requestedPosts: privatePosts});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getLikes = async (req, res, next) => {
  try {
    const currentPost = await Post
      .findById(req.params.postId, 'likes')
      .populate('likes', 'firstName lastName')
      .lean();
    const curPostLikes = currentPost.likes;
    res.status(200).json({likes: curPostLikes});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.createPost = [
  body('text')
    .isLength({min: 1})
    .withMessage('post text must be specified')
    // maximum limit has been taken from facebook
    .isLength({max: 63000})
    .withMessage('post text mustn\'t exceed 63000')
    .escape(),
  body('private')
    .optional({values: undefined})
    .isBoolean()
    .withMessage('private field must be of Boolean type'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const {text, private} = req.body;
      const newPost = new Post({text, private, author: req.user._id});
      await newPost.save();
      const usersPosts = await Post.find({author: req.user._id}).sort({'createdAt':-1});
      res.status(200).json({posts: usersPosts});
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  }
]

exports.likePost = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(
      req.params.postId,
      {$push: {'likes': req.user._id}});
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.deletePost = async (req, res, next) => {
  try {
    await Promise.all([Post.findByIdAndDelete(req.params.postId), Comment.deleteMany({post: req.params.postId})]);
    const usersPosts = await Post.find({author: req.user._id}).sort({'createdAt':-1});
    res.status(200).json({posts: usersPosts});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}