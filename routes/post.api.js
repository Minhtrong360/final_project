const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const postController = require("../controllers/post.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route GET /posts/user/:userId?page=1&limit=10
 * @description Get all posts an user can see with pagination
 * @access Login required
 */
router.get(
  "/user/:userId",
  authentication.loginRequired,
  validators.validate(
    param("userId").exists().isString().custom(validators.checkObjectId)
  ),
  postController.getPosts
);

/**
 * @route POST /posts
 * @description Create a new post
 * @body {content, image}
 * @access Login required
 */
router.post(
  "/",
  authentication.loginRequired,
  validators.validate([body("content", "Missing content").exists().notEmpty()]),
  postController.createNewPost
);

/**
 * @route PUT /posts
 * @description Update a post
 * @body {content, image}
 * @access Login required
 */
router.put(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.updateSinglePost
);
/**
 * @route GET /posts/:id
 * @description Get a single post
 * @access Login required
 */
router.get(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.getSinglePost
);

/**
 * @route DELETE /posts/:id
 * @description Delete a post
 * @access Login required
 */
router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.deleteSinglePost
);

/**
 * @route GET /posts/:id/comments
 * @description Get all comments of a post
 * @access Login required
 */
router.get(
  "/:id/comment",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  postController.getCommentsOfPost
);

module.exports = router;
