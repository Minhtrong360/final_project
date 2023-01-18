const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");

const Friend = require("../models/Friend");
const commentController = {};

const calculateCommentCount = async (postId) => {
  const commentCount = await Comment.countDocuments({
    post: postId,
    isDelete: false,
  });
  await Post.findByIdAndUpdate(postId, { commentCount });
};

commentController.createNewComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { content, image, postId } = req.body;
  // Validation
  /// Check post exists
  const post = await Post.findById({ postId });
  if (!post)
    throw new AppError(400, "Post does not exist", "Create new comment error");
  /// Create new comment
  let comment = await Comment.create({
    author: currentUserId,
    post: postId,
    content,
    image,
  });

  ///Update CommentCount of the post
  await calculateCommentCount(postId);
  // Process
  comment = await comment.populate("author");

  // Response
  sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Create new comment Successfully"
  );
});

commentController.updateSingleComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { content, image, postId } = req.body;
  let commentId = req.params.id;
  // Validation

  const post = await Post.findById(postId);
  if (!post)
    throw new AppError(400, "Post does not exist", "Create new comment error");

  let comment = await Comment.findByIdAndUpdate(
    { _id: commentId, author: currentUserId },
    { content, image },
    { new: true }
  );
  if (!comment)
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Update Comment Error"
    );

  // Process

  // Response
  sendResponse(res, 200, true, comment, null, "Update Comment Successfully");
});

commentController.deleteSingleComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let commentId = req.params.id;

  // Validation
  let comment = await Comment.findByIdAndDelete({
    _id: commentId,
    author: currentUserId,
  });
  if (!comment)
    throw new AppError(
      400,
      "Comment not found or User not authorized",
      "Delete Comment Error"
    );

  // Process
  await calculateCommentCount(comment.post);

  // Response
  sendResponse(res, 200, true, comment, null, "Delete Comment Successfully");
});

commentController.getSingleComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let commentId = req.params.id;

  // Validation
  let comment = await Comment.findById({ _id: commentId });
  if (!comment)
    throw new AppError(400, "Comment not found", "Delete Comment Error");

  // Process
  await calculateCommentCount(comment.post);

  // Response
  sendResponse(res, 200, true, comment, null, "Get Comment Successfully");
});

module.exports = commentController;
