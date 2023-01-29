const Post = require("../models/Post");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Friend = require("../models/Friend");
const Subscription = require("../models/Subscription");

const subscriptionController = {};

subscriptionController.registerNewSubscription = catchAsync(
  async (req, res, next) => {
    // Get data from request
    let userId = req.params.id;
    let { duration, paymentMethods } = req.body;
    // Validation

    // Process
    let timeRegister = new Date();
    let nextMonth = today.setDate(today.getDate() + Number(duration));
    let expired = new Date(nextMonth);

    let subscription = await Subscription.create({
      author: userId,
      timeRegister: timeRegister,
      expired: expired,
      paymentMethods,
    });

    // Response

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
  const subscriptionId = req.params.id;
  // Validation
  let subscription = await Subscription.findById({ subscriptionId }).populate(
    "author"
  );
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
    { subscription },
    null,
    "Get Subscription Successfully"
  );
});

subscriptionController.updateSubscription = catchAsync(
  async (req, res, next) => {
    // Get data from request
    let currentUserId = req.userId;
    const subscriptionId = req.params.id;
    const duration = req.body;
    // Validation

    let subscription = await Subscription.findById({ subscriptionId });
    if (!subscription)
      throw new AppError(
        400,
        "Subscription's not found",
        "Update Subscription Error"
      );
    if (!subscription.author.equal(currentUserId))
      throw new AppError(
        400,
        "Only author can update subscription",
        "Update Subscription Error"
      );

    // Process

    subscription.expired = new Date(
      subscription.expired.setDate(
        subscription.expired.getDate() + Number(duration)
      )
    );

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
