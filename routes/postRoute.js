const express = require('express');
const router = express.Router();
const authentication = require('../middlewares/authentication');
const { getPublicPosts, getFriendsPosts, getLikes, createPost, likePost, deletePost } = require('../controllers/postController');
const { deleteComment, createComment, likeComment, getComments } = require('../controllers/commentController');

router.use(authentication);

router.get('/public-posts', getPublicPosts);
router.get('/friends-posts', getFriendsPosts);
router.get('/:postId/likes', getLikes);
router.get('/:postId/comments', getComments);
router.post('/create', createPost);
router.post('/:postId/like', likePost);
router.post('/:postId/delete', deletePost);
router.post('/:postId/comments/create', createComment);
router.post('/:postId/comments/:commentId/like', likeComment);
router.post('/:postId/comments/:commentId/delete', deleteComment);

module.exports = router;