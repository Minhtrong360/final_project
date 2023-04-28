const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const bcrypt = require("bcryptjs");
const moment = require("moment/moment");
const Status = require("../models/Status");
const authController = {};

authController.loginWithEmail = async (req, res, next) => {
  try {
    // Get data from request
    let { email, password } = req.body;
    // Validation
    let user = await User.findOne({ email }, "+password");
    if (!user) throw new AppError(400, "Invalid Credentials", "Login Error");
    // Process

    // Thêm 1 biến subscription is valid vào sau khi login, lưu vào response lưu 1 lần

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError(400, "Wrong password", "Login Error");
    const accessToken = await user.generateToken();

    const subscription = await Subscription.findOne({ author: user._id });

    if (
      subscription &&
      moment(new Date()).isSameOrBefore(subscription?.expired)
    ) {
      user.subscription = {
        isSubscription: true,
        subscription: subscription,
      };
    } else {
      user.subscription = {
        isSubscription: false,
        subscription: subscription,
      };
    }
    user.save();

    // Update the login count in the Status model
    const status = await Status.findOne({
      start_at: { $lte: new Date() },
      end_at: { $gte: new Date() },
    });
    if (status) {
      status.login += 1;
      await status.save();
    }
    console.log("status", status);

    // Response

    sendResponse(
      res,
      200,
      true,
      { user, accessToken },
      null,
      "Login Successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = authController;
