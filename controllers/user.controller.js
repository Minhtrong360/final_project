const User = require("../models/User");
// const Friend = require("../models/Friend");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const bcrypt = require("bcryptjs");
const Subscription = require("../models/Subscription");
const moment = require("moment/moment");
const mongoose = require("mongoose");
const Status = require("../models/Status");

const userController = {};

userController.register = catchAsync(async (req, res, next) => {
  // Get data from request
  let { name, email, password } = req.body;
  // Validation
  let user = await User.findOne({ email });
  if (user)
    throw new AppError(400, "Email already exists", "Registration Error");
  // Process
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  user = await User.create({ name, email, password });
  const accessToken = await user.generateToken();
  if (email.startsWith("admin")) {
    user.admin = true;
  } else {
    user.admin = false;
  }
  user.save();

  // Update the new_user field in the Status model
  const currentDate = moment.utc().startOf("day").format("YYYY-MM-DD");
  let status = await Status.findOne({ date: currentDate });
  if (!status) {
    status = new Status({
      new_users: [],
      login: 0,
      view: 0,
      date: currentDate,
    });
  }

  status.new_users.push(user._id);
  await status.save();

  // Response

  sendResponse(
    res,
    200,
    true,
    { user, accessToken },
    null,
    "Create User Successfully"
  );
});

userController.getUsers = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 4;

  // Validation
  const filterConditions = [{ isDelete: false }];
  if (filter.name) {
    filterConditions.push({
      name: { $regex: filter.name, $options: "i" },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  // Process

  const count = await User.countDocuments(filterCriteria);

  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  // Response

  sendResponse(
    res,
    200,
    true,
    { users, totalPages, count },
    null,
    "Get Users Successfully"
  );
});

userController.getUsersSubscribed = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const isAdmin = await User.findById(currentUserId);
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  // Validation
  const filterConditions = [{ isDelete: false }];
  if (filter.name) {
    filterConditions.push({
      name: { $regex: filter.name, $options: "i" },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};
  filterConditions.push({ "subscription.isSubscription": true }); // add this line to filter only subscribed users
  // Process

  const count = await User.countDocuments(filterCriteria);

  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  // Response

  sendResponse(
    res,
    200,
    true,
    { users, totalPages, count },
    null,
    "Get Users Subscribed Successfully"
  );
});

userController.getCurrentUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  // Validation
  let user = await User.findById(currentUserId);

  if (!user)
    throw new AppError(400, "User's not found", "Get Current User Error");

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
    };
  }
  user.save();
  // Process

  // Response
  sendResponse(res, 200, true, user, null, "Get Current User Successfully");
});

userController.getSingleUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;
  // Validation
  let user = await User.findById(userId);
  if (!user)
    throw new AppError(400, "User's not found", "Get Single User Error");
  // Process

  // Response

  sendResponse(res, 200, true, { user }, null, "Get Single User Successfully");
});

userController.updateProfile = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;
  // Validation
  const isAdmin = await User.findById(currentUserId);

  if (
    currentUserId !== userId &&
    (isAdmin.admin === false || isAdmin.admin === undefined)
  )
    throw new AppError(400, "Permission Requird", "Update User Error");

  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User's not found", "Update User Error");

  // Process
  const allows = [
    "name",
    "cover",
    "gender",
    "address",
    "city",
    "country",
    "birthday",
    "phoneNumber",
    "aboutMe",
    "facebookLink",
    "instagramLink",
    "linkedinLink",
    "twitterLink",
  ];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();
  // Response

  sendResponse(res, 200, true, user, null, "Update User Successfully");
});

userController.updateLovedStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;

  // Validation

  if (currentUserId !== userId)
    throw new AppError(400, "Permission Requird", "Update User Error");

  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User's not found", "Update User Error");

  // Process

  const schemaStoryIds = user.lovedStory;

  const isStoryIdMatched = schemaStoryIds.some((schemaStoryId) => {
    return mongoose.Types.ObjectId(schemaStoryId).equals(req.body.lovedStory);
  });
  if (isStoryIdMatched) {
    const index = user.lovedStory.indexOf(req.body.lovedStory);

    user.lovedStory.splice(index, 1);
  }
  if (!isStoryIdMatched) {
    user.lovedStory.push(req.body.lovedStory);
  }

  await user.save();
  // Response

  sendResponse(res, 200, true, user, null, "Update LovedStory Successfully");
});

userController.deleteUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;
  // Validation
  const isAdmin = await User.findById(currentUserId);

  if (
    currentUserId !== userId &&
    (isAdmin.admin === false || isAdmin.admin === undefined)
  )
    throw new AppError(400, "Permission Requird", "Delete User Error");

  let user = await User.findById(userId);
  if (!user) throw new AppError(400, "User's not found", "Delete User Error");

  // Process
  user.isDelete = true;

  await user.save();
  // Response

  sendResponse(res, 200, true, user, null, "Delete User Successfully");
});

module.exports = userController;
