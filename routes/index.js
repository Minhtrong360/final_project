var express = require("express");
var router = express.Router();

//authApi
const authApi = require("./auth.api");
router.use("/auth", authApi);

//userApi
const userApi = require("./user.api");
router.use("/users", userApi);

//postApi
const subscriptionApi = require("./subscription.api");
router.use("/subscriptions", subscriptionApi);

//commentApi
const commentApi = require("./comment.api");
router.use("/comments", commentApi);

//storyApi
const storyApi = require("./story.api");
router.use("/stories", storyApi);

//chapterApi
const chapterApi = require("./chapter.api");
router.use("/chapters", chapterApi);

module.exports = router;
