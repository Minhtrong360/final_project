const Reaction = require("../models/reaction");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const mongoose = require("mongoose");
const e = require("express");

const reactionController = {};

const calculateReaction = async (targetId, targetType) => {
  const start = await Reaction.aggregate([
    {
      $match: { targetId: mongoose.Types.ObjectId(targetId) },
    },
    {
      $group: {
        _id: "$targetId",
        like: {
          $sum: {
            $cond: [{ $eq: ["emoji", "like"] }, 1, 0],
          },
        },
        dislike: {
          $sum: {
            $cond: [{ $eq: ["emoji", "dislike"] }, 1, 0],
          },
        },
      },
    },
  ]);
  const reactions = {
    like: (start[0] && start[0].like) || 0,
    dislike: (start[0] && start[0].dislike) || 0,
  };
  await mongoose.model(targetType).findByIdAndUpdate(targetId, { reactions });
  return reactions;
};

reactionController.saveReaction = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const { targetType, targetId, emoji } = req.body;

  // Check targetType exists
  const targetObj = await mongoose.model(targetType).find(targetId);
  if (!targetObj)
    throw new AppError(400, `${targetType} not found`, "Create Reaction Error");
  // Find the reaction if exists
  let reaction = await Reaction.findOne({
    targetType,
    targetId,
    author: currentUserId,
  });
  // If there is no reaction in the DB => Create a new one
  if (!reaction) {
    reaction = await Reaction.create({
      targetType,
      targetId,
      author: currentUserId,
      emoji,
    });
  } else {
    // If there is a reaction in the DB => Compare the emoji
    if (reaction.emoji === emoji) {
      // If they are the same => delete reactions
      await reaction.delete();
    } else {
      // If they are difference => update reactions
      reaction.emoji = emoji;
      await reaction.save();
    }
  }

  const reactions = await calculateReaction(targetId, targetType);

  return sendResponse(res, 200, true, reactions, null, "Save Reaction Success");
});
module.exports = reactionController;
