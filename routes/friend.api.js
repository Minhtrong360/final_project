const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const friendController = require("../controllers/friend.controller");
const authentication = require("../middlewares/authentication");
const validators = require("../middlewares/validators");

/**
 * @route POST /friends/requests
 * @description Send a friend request
 * @body {to: user ID}
 * @access Login required
 */
router.post(
  "/requests",
  authentication.loginRequired,
  validators.validate([
    body("to").exists().isString().custom(validators.checkObjectId),
  ]),
  friendController.sendFriendRequest
);

/**
 * @route GET /friends/requests/incomming
 * @description Get the list of received pending requests
 * @access Login required
 */
router.get(
  "/requests/incomming",
  authentication.loginRequired,
  friendController.getReceivedFriendRequestList
);

/**
 * @route GET /friends/requests/outgoing
 * @description Get the list of sent pending requests
 * @access Login required
 */
router.get(
  "/requests/outcomming",
  authentication.loginRequired,
  friendController.getSentFriendRequestList
);

/**
 * @route GET /friends
 * @description Get the list of friends
 * @access Login required
 */
router.get("/", authentication.loginRequired, friendController.getFriendList);

/**
 * @route PUT /friends/requests/:userId
 * @description Acceipt/Reject a received pending request
 * @access Login required
 */
router.put(
  "/requests/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
    body("status").exists().isString().isIn(["accepted", "declined"]),
  ]),
  friendController.reactFriendRequest
);

/**
 * @route DELETE /friends/requests/:userId
 * @description Cancel a friend request
 * @access Login required
 */
router.delete(
  "/requests/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  friendController.cancelFriendRequest
);

/**
 * @route DELETE /friends/:userId
 * @description Remove a friend
 * @access Login required
 */
router.delete(
  "/:userId",
  authentication.loginRequired,
  validators.validate([
    param("userId").exists().isString().custom(validators.checkObjectId),
  ]),
  friendController.removeFriend
);

module.exports = router;
