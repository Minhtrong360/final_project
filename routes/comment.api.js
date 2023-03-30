const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const commentController = require("../controllers/comment.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route POST /comments
 * @description Create a new comment
 * @body {targetType: 'Story' or 'Chapter', targetId, content}
 * @access Login required
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([
    body("targetType", "Invalid targetType")
      .exists()
      .isIn(["Story", "Chapter"]),
    body("targetId", "Invalid targetId")
      .exists()
      .custom(validators.checkObjectId),
    body("content", "Invalid content").exists().notEmpty(),
  ]),
  commentController.saveComment
);

router.put(
  "/reaction/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  commentController.updateReactionComment
);

/**
 * @route PUT /comments/:id
 * @description Update a comment
 * @body {content, image}
 * @access Login required
 */
router.put(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
    body("content", "Missing content").exists().notEmpty(),
  ]),
  commentController.updateSingleComment
);

/**
 * @route DELETE /comments/:id
 * @description Delete a comment
 * @access Login required
 */
router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  commentController.deleteSingleComment
);

module.exports = router;
