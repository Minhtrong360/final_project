const User = require("../models/User");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const bcrypt = require("bcryptjs");
const authController = {};

authController.loginWithEmail = async (req, res, next) => {
  try {
    // Get data from request
    let { email, password } = req.body;
    // Validation
    let user = await User.findOne({ email }, "+password");
    if (!user) throw new AppError(400, "Invalid Credentials", "Login Error");
    // Process

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError(400, "Wrong password", "Login Error");
    const accessToken = await user.generateToken();
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
