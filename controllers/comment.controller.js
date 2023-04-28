const Comment = require("../models/Comment");

const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const User = require("../models/User");

const commentController = {};

commentController.saveComment = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId, content } = req.body;

  // Check targetType exists
  const targetObj = await mongoose.model(targetType).find({ targetId });

  if (!targetObj)
    throw new AppError(400, `${targetType} not found`, "Create Comment Error");
  let comment = await Comment.create({
    targetType,
    targetId,
    author: currentUserId,
    content,
  });
  await comment.populate("targetId");
  await comment.populate("author");

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
  const isAdmin = await User.findById(currentUserId);

  // Validation
  let comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError(400, "Comment not found", "Delete Comment Error");
  }

  if (isAdmin.admin || comment.author == currentUserId) {
    // Process
    await Comment.findByIdAndDelete(commentId);

    // Response
    sendResponse(res, 200, true, null, null, "Delete Comment Successfully");
  } else {
    throw new AppError(
      401,
      "User not authorized to delete comment",
      "Delete Comment Error"
    );
  }
});

commentController.updateReactionComment = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const commentId = req.params.id;
  const { data } = req.body;
  // Validation

  // Process
  const comment = await Comment.findById(commentId);

  if (!comment)
    throw new AppError(
      400,
      "Comment is not found",
      "Update Reaction Of Comment Error"
    );

  if (data === "like") {
    const schemaAuthorIds = comment.reactions.authorIdOfLike;

    const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
      return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
    });

    if (isAuthorIdMatched) {
      comment.reactions.like -= 1;
      const index = comment.reactions.authorIdOfLike.indexOf(currentUserId);
      comment.reactions.authorIdOfLike.splice(index, 1);
    }
    if (!isAuthorIdMatched) {
      const schemaAuthorIds = comment.reactions.authorIdOfDisLike;

      const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
        return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
      });
      if (isAuthorIdMatched) {
        comment.reactions.disLike -= 1;
        const index =
          comment.reactions.authorIdOfDisLike.indexOf(currentUserId);
        comment.reactions.authorIdOfDisLike.splice(index, 1);
      }
      comment.reactions.like += 1;
      comment.reactions.authorIdOfLike.push(currentUserId);
    }
  }
  if (data === "disLike") {
    const schemaAuthorIds = comment.reactions.authorIdOfDisLike;

    const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
      return schemaAuthorId.equals(currentUserId);
    });
    if (isAuthorIdMatched) {
      comment.reactions.disLike -= 1;
      const index = comment.reactions.authorIdOfDisLike.indexOf(currentUserId);
      comment.reactions.authorIdOfDisLike.splice(index, 1);
    }
    if (!isAuthorIdMatched) {
      const schemaAuthorIds = comment.reactions.authorIdOfLike;

      const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
        return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
      });
      if (isAuthorIdMatched) {
        comment.reactions.like -= 1;
        const index = comment.reactions.authorIdOfLike.indexOf(currentUserId);
        comment.reactions.authorIdOfLike.splice(index, 1);
      }
      comment.reactions.disLike += 1;
      comment.reactions.authorIdOfDisLike.push(currentUserId);
    }
  }

  comment.save();

  // Response

  sendResponse(
    res,
    200,
    true,
    comment,
    null,
    "Update Reaction Of comment Successfully"
  );
});

module.exports = commentController;
