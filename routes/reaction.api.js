const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const reactionController = require("../controllers/reaction.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route POST /reactions
 * @description Save a reaction to post or comment
 * @body {targetType: 'Post' or 'Comment', targetId, emoji: 'like' or 'dislike'}
 * @access Login required
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([
    body("targetType", "Invalid targetType").exists().isIn(["Post", "Comment"]),
    body("targetId", "Invalid targetId")
      .exists()
      .custom(validators.checkObjectId),
    body("reaction", "Invalid reaction").exists().isIn(["Like", "Dislike"]),
  ]),
  reactionController.saveReaction
);

module.exports = router;
