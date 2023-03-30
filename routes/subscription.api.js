const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const subscriptionController = require("../controllers/subscription.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route POST subscriptions/user/:id
 * @description Register new subscription
 * @body {duration : [30days, 90days, 180days, 365days]}
 * @access Login required
 */
router.post(
  "/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
    body("duration", "Invalid duration")
      .exists()
      .isIn(["30", "90", "180", "365"]),
  ]),
  subscriptionController.registerNewSubscription
);

/**
 * @route GET subscriptions/user/:id
 * @description Get subscription of a user
 * @body
 * @access Login required
 */
router.get(
  "/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  subscriptionController.getSubscription
);

/**
 * @route PUT /subscriptions
 * @description Update a post
 * @body {content, image}
 * @access Login required
 */
router.put(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
    body("duration", "Invalid duration")
      .exists()
      .isIn(["30", "90", "180", "365"]),
  ]),
  subscriptionController.updateSubscription
);

/**
 * @route DELETE subscriptions/:userId
 * @description Delete subscription of a user
 * @body
 * @access Login required
 */
router.delete(
  "/:id",
  authentication.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  subscriptionController.deleteSubscription
);

module.exports = router;
