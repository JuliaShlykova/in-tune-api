const express = require('express');
const router = express.Router();
const { uploadProfileImg, editProfile, getProfile, getFriendsList, getRequestsList, getSentRequestsList, getSuggestedUsers, sendFriendRequest, acceptFriendRequest, deleteProfileImg } = require('../controllers/userController');
const authentication = require('../middlewares/authentication');

router.use(authentication)
router.post('/edit-profile', editProfile);
router.post('/update-profile-img', uploadProfileImg);
router.post('/delete-profile-img', deleteProfileImg);
router.get('/friends', getFriendsList);
router.get('/friend-requests', getRequestsList);
router.get('/sent-friend-requests', getSentRequestsList);
router.get('/friend-suggestions', getSuggestedUsers);
router.get('/:userId/profile', getProfile);
router.post('/:friendId/send-friend-request', sendFriendRequest);
router.post('/:friendId/accept-friend-request', acceptFriendRequest);

module.exports = router;
