const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");
const Comment = require("../models/Comment");

const Subscription = require("../models/Subscription");

const subscriptionController = {};

subscriptionController.registerNewSubscription = catchAsync(
  async (req, res, next) => {
    // Get data from request
    let userId = req.params.userId;
    let { duration, paymentMethods, time } = req.body;
    // Validation

    // Process

    let timeRegister = time;

    let today = new Date(time);
    today.setDate(today.getDate() + Number(duration));

    let expired = today.valueOf();

    let subscription = await Subscription.find({ author: userId });

    if (subscription.length > 0) {
      let date = subscription[0].expired;

      date.setDate(date.getDate() + Number(duration));

      expired =
        date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

      subscription[0].expired = expired;
      subscription[0].save();
    } else {
      subscription = await Subscription.create({
        author: userId,
        timeRegister,
        expired: expired,
        paymentMethods,
      });
    }

    // Response
    let user = await User.findById(userId);
    user.subscription = {
      isSubscription: true,
      subscription: subscription,
    };

    user.save();
    sendResponse(
      res,
      200,
      true,
      subscription,
      null,
      "Register New Subscription Successfully"
    );
  }
);

subscriptionController.getSubscription = catchAsync(async (req, res, next) => {
  // Get data from request
  const subscriptionUserId = req.params.userId;
  // Validation
  let subscription = await Subscription.find({
    author: subscriptionUserId,
  }).populate("author");
  if (!subscription)
    throw new AppError(
      400,
      "Subscription's not found",
      "Get Subscription Error"
    );
  // Process

  // Response

  sendResponse(
    res,
    200,
    true,
    subscription,
    null,
    "Get Subscription Successfully"
  );
});

subscriptionController.updateSubscription = catchAsync(
  async (req, res, next) => {
    // Get data from request
    let currentUserId = req.userId;
    const subscriptionId = req.params.id;
    const { duration } = req.body;
    // Validation

    let subscription = await Subscription.findById(subscriptionId);
    if (!subscription)
      throw new AppError(
        400,
        "Subscription's not found",
        "Update Subscription Error"
      );
    if (!subscription.author.equals(currentUserId))
      throw new AppError(
        400,
        "Only author can update subscription",
        "Update Subscription Error"
      );

    // Process

    let date = subscription.expired;
    date.setDate(date.getDate() + Number(duration));

    expired =
      date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

    subscription.expired = expired;

    await subscription.save();
    // Response

    sendResponse(
      res,
      200,
      true,
      subscription,
      null,
      "Update Subscription Successfully"
    );
  }
);

subscriptionController.deleteSubscription = catchAsync(
  async (req, res, next) => {
    // Get data from request
    let currentUserId = req.userId;
    const subscriptionId = req.params.id;
    // Validation

    // Process
    const subscription = await Subscription.findByIdAndUpdate(
      { _id: subscriptionId, author: currentUserId },
      { isDelete: true },
      { new: true }
    );
    if (!subscription)
      throw new AppError(
        400,
        "Subscription is not found or User not authorized",
        "Delete Subscription Error"
      );

    // Response

    sendResponse(
      res,
      200,
      true,
      subscription,
      null,
      "Delete Subscription Successfully"
    );
  }
);

module.exports = subscriptionController;
