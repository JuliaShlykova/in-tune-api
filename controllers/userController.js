const imageKit = require('../configs/storage.config');
const { body, validationResult } = require('express-validator');
const multer = require('../configs/multer.cofig');
const {removeProfileImg, uploadProfileImg } = require('../utils/profileImg');
const User = require('../models/User');
const Post = require('../models/Post');

exports.getProfile = async (req, res, next) => {
  try {
    let userInfo = await User.findById(req.params.userId, '-friends -email -password').lean();
    const posts = await Post.find({author: req.params.userId});
    res.status(200).json({user: userInfo, posts});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.editProfile = [
  body('location')
    .optional({values: 'undefined'})
    .isLength({max: 100})
    .escape()
    .withMessage('location mustn\'t exceed 100 characters'),
  body('dateOfBirth')
    .optional({values: 'falsy'})
    // ISO format YYYY-MM-DD
    .isISO8601()
    .withMessage('date of birth must be in date format'),
  body('occupation')
    .optional({values: 'undefined'})
    .isLength({max: 200})
    .escape()
    .withMessage('occupation mustn\'t exceed 200 characters'),
  body('hobbies')
    .optional({values: 'undefined'})
    .isLength({max: 1000})
    .escape()
    .withMessage('hobbies musn\'t exceed 1000 characters')
  ,async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const { location, dateOfBirth, occupation, hobbies } = req.body;
      const profileInfoUpdated = { location, dateOfBirth, occupation, hobbies };
      if (profileInfoUpdated) {
        await User.findByIdAndUpdate(req.user._id, {profileInfo: profileInfoUpdated})
      }
      res.sendStatus(200);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
}]

exports.uploadProfileImg = [
  multer.single('profileImg'),
  body('profileImg')
    .custom((value, { req }) => {
      if (
        req.file?.mimetype !== 'image/jpeg'
        && req.file?.mimetype !== 'image/png'
        && req.file?.mimetype !== 'image/webp'
      ) {
        return false
      }
      return true;
    })
    .withMessage('Upload only image formats'),
  async(req, res, next) => {
    if (!req.file) {
      return res.status(400).json({message: 'no file attached'});
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    try {
      const currentUser = await User.findById(req.user._id);
      let oldImgId = currentUser.profileImgId;
      if (oldImgId) {
        removeProfileImg(oldImgId);
      }
      const fileResponse = await uploadProfileImg(req.file);
      currentUser.profileImgId = fileResponse.fileId;
      currentUser.profileImgUrl = fileResponse.url;
      await currentUser.save();
      res.sendStatus(200);
    } catch(err) {
      res.status(500).json({error: err.message});
    }
}]

exports.deleteProfileImg = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    let oldImgId = currentUser.profileImgId;
    if (oldImgId) {
      removeProfileImg(oldImgId);
    } else {
      return res.status(409).json({message: 'No img to delete'});
    }
    currentUser.profileImgId = undefined;
    currentUser.profileImgUrl = undefined;
    await currentUser.save();
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getFriendsList = async (req, res, next) => {
  try{
    // .lean() return plain old JavaScript Objects - accelerate queries
    const currentUser = await User
      .findById(req.user._id, 'friends')
      .populate('friends.user', 'firstName lastName profileImgUrl')
      .lean();
    console.log('current user: ', currentUser);
    const requests = currentUser.friends.filter(friend => friend.status==='Friend').map(friend=>friend.user)
    res.status(200).json({requestedUsers: requests});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getRequestsList = async (req, res, next) => {
  try{
    const currentUser = await User
      .findById(req.user._id, 'friends')
      .populate('friends.user', 'firstName lastName profileImgUrl')
      .lean();
    const requests = currentUser.friends.filter(friend => friend.status==='RequestReceived').map(friend=>friend.user)
    res.status(200).json({requestedUsers: requests});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getSentRequestsList = async (req, res, next) => {
  try{
    const currentUser = await User
      .findById(req.user._id, 'friends')
      .populate('friends.user', 'firstName lastName profileImgUrl')
      .lean();
    const requests = currentUser.friends.filter(friend => friend.status==='RequestSent').map(friend=>friend.user)
    res.status(200).json({requestedUsers: requests});
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User
      .findById(req.user._id, 'friends')
      .lean();
    const curUserFriends = currentUser['friends'].map(friend => friend.user);
    const suggestedUsers = await User
      .find(
        {_id: {$nin: [...curUserFriends, req.user._id]}}, 
        'firstName lastName profileImgUrl')
      .lean();
    res.status(200).json({requestedUsers: suggestedUsers});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
}

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const friendId = req.params.friendId;
    if (friendId == req.user._id) {
      return res.status(409).json({message: "You can't add yourself as a friend"});
    }
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.find(friend => friend.user == friendId)) {
      return res.status(409).json({message: "User is already in the list"});
    }
    const friendUser = await User.findById(friendId);
    if (!friendUser) {
      return res.status(409).json({message: "No such user to be friends with"});
    }
    const addFriendPomise = User.findByIdAndUpdate(
      req.user._id, 
      {$push: {'friends': {user: friendId, status: 'RequestSent'}}}
    );
    const addUserAsFriendPromise = User.findByIdAndUpdate(
      friendId, 
      {$push: {'friends': {user: req.user._id, status: 'RequestReceived'}}}
    );
    await Promise.all([addFriendPomise, addUserAsFriendPromise]);
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const friendId = req.params.friendId;
    const currentUser = await User.findById(req.user._id);
    const friendIndex = currentUser.friends.findIndex(friend => friend.user == friendId);
    if (friendIndex === -1) {
      return res.status(409).json({message: 'No such person in the friend list'});
    }
    if (currentUser.friends[friendIndex].status === 'Friend') {
      return res.status(409).json({message: 'You are already friends'});
    }

    const friendUser = await User.findById(friendId);
    const userIndex = friendUser.friends.findIndex(friend => friend.user == req.user._id);
    if (userIndex === -1) {
      return res.status(409).json({message: 'You are not in the friend list'});
    }

    const addFriendPomise = User.findByIdAndUpdate(
      req.user._id, 
      {$set: {'friends.$[i].status': 'Friend'}}, 
      {arrayFilters: [{'i.user': friendId}]}
    );
    const addUserAsFriendPromise = User.findByIdAndUpdate(
      friendId, 
      {$set: {'friends.$[i].status': 'Friend'}}, 
      {arrayFilters: [{'i.user': req.user._id}]}
    );
    await Promise.all([addFriendPomise, addUserAsFriendPromise]);
    res.sendStatus(200);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
}

