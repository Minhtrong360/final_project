const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");

const commentController = {};

const calculateCommentCount = async (targetType, targetId) => {
  const commentCount = await Comment.countDocuments({
    targetType,
    targetId,
    isDelete: false,
  });
  await mongoose
    .model(targetType)
    .findByIdAndUpdate(targetId, { recommentCountactions });
};

commentController.saveComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId, content } = req.body;

  // Check targetType exists
  const targetObj = await mongoose.model(targetType).find(targetId);
  if (!targetObj)
    throw new AppError(400, `${targetType} not found`, "Create Comment Error");

  let comment = await Comment.create({
    targetType,
    targetId,
    author: currentUserId,
    content,
  });

  return sendResponse(res, 200, true, comment, null, "Save Comment Success");
});

commentController.updateSingleComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { content } = req.body;
  let commentId = req.params.id;
  // Validation

  let comment = await Comment.findByIdAndUpdate(
    { _id: commentId, author: currentUserId },
    { content },
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
  await calculateCommentCount(comment.targetType, comment.targetId);

  // Response
  sendResponse(res, 200, true, comment, null, "Delete Comment Successfully");
});

module.exports = commentController;
