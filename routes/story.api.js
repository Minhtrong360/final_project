const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const storyController = require("../controllers/story.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route GET /stories/:genre?page=1&limit=10
 * @description Get all stories by genre with pagination
 * @body
 * @access Public access
 */
router.get("/", storyController.getStories);
// router.get("/fixGenres", storyController.fixGenres);

router.get(
  "/user/:userId",
  authentication.loginRequired,
  storyController.getStoriesOfUser
);

router.get(
  "/user/:userId/loved",
  authentication.loginRequired,
  storyController.getLovedStoriesOfUser
);

/**
 * @route GET /stories/:id
 * @description Get a single story
 * @body
 * @access Public access
 */
router.get(
  "/:id",
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  storyController.getSingleStory
);

/**
 * @route GET /stories/:id/comments
 * @description Get comments of a story
 * @body
 * @access Public access
 */
router.get(
  "/:id/comments",
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  storyController.getCommentOfStory
);

/**
 * @route POST /stories
 * @description Create a new story
 * @body {title, cover, genre, summarize}
 * @access Login reuqired
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([
    body("title", "Missing title").exists().notEmpty(),
    body("cover", "Missing cover").exists().notEmpty(),
    body("genres", "Missing genres").exists().notEmpty(),
    body("summarize", "Missing summaries' content").exists().notEmpty(),
  ]),
  storyController.createNewStory
);

/**
 * @route PUT /stories/:id
 * @description Update a post
 * @body {title, cover, genre, summarize}
 * @access Login required
 */
router.put(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  storyController.updateSingleStory
);

router.put(
  "/reaction/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  storyController.updateReactionStory
);

/**
 * @route DELETE /stories/:id
 * @description Delete a story
 * @body
 * @access Login required
 */

router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  storyController.deleteSingleStory
);

module.exports = router;
