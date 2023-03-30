const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const chapterController = require("../controllers/chapter.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**

* @route GET /story?page=1&limit=10
* @description Get all chapters of a story with pagination
* @body
* @access Public access
  */
router.get(
  "/story/:storyId",
  validators.validate([
    param("storyId").exists().isString().custom(validators.checkObjectId),
  ]),
  chapterController.getChaptersOfStory
);

/**

* @route GET /:storyId?chapter=1
* @description Get a single chapter
* @body
* @access Public access
  */
router.get(
  "/:chapterId",
  validators.validate([
    param("chapterId").exists().isString().custom(validators.checkObjectId),
  ]),
  chapterController.getSingleChapterOfStory
);

/** Comments inside a chapter

* @route GET /story/:id/comments
* @description Get comments of a chapter
* @body
* @access Public access
  */
router.get(
  "/:chapterId/comments",
  validators.validate([
    param("chapterId").exists().isString().custom(validators.checkObjectId),
  ]),
  chapterController.getCommentOfChapterOfStory
);

/** Create chapters (For writter)

* @route POST /story
* @Description Create a new chapter of a story
* @body {NO. of Chapter, chapter's name, content}
* @access Login reuqired
  */

router.post(
  "/:storyId",
  authentication.loginRequired,
  validators.validate([
    param("storyId").exists().isString().custom(validators.checkObjectId),
    body("title", "Missing chapter's title").exists().notEmpty(),
    body("avatar", "Missing chapter's avatar").exists().notEmpty(),
    body("content", "Missing chapter's content").exists().notEmpty(),
  ]),
  chapterController.createNewChapterOfStory
);

/** (For writter)

* @route PUT /chapters/:id
* @description Update a chapter of a story
* @body {NO. of Chapter, chapter's name, content}
* @access Login required
  */
router.put(
  "/:chapterId",
  authentication.loginRequired,
  validators.validate([
    param("chapterId").exists().isString().custom(validators.checkObjectId),
  ]),
  chapterController.updateChapterOfStory
);
// FE tao path dan toi path="/:id/chapters" voi query: "?chapter=1"

/** (For writter)

* @route DELETE /storyter=1
* @description Delete a chapter of a story
* @body
* @access Login required
  \*/
router.delete(
  "/:chapterId",
  authentication.loginRequired,
  validators.validate([
    param("chapterId").exists().isString().custom(validators.checkObjectId),
  ]),
  chapterController.deleteChapterOfStory
);

module.exports = router;
