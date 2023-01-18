const User = require("../models/User");
const Friend = require("../models/Friend");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const bcrypt = require("bcryptjs");

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
  const accessToken = user.generateToken();
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
  limit = parseInt(limit) || 1;
  // Validation
  const filterConditions = [{ isdelete: false }];
  if (filter.name) {
    filterConditions.push({
      name: { $regex: filter.name, $options: "i" },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  // Process

  const count = User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const promises = users.map(async (user) => {
    let temp = user.toJSON();
    temp.friendship = await Friend.findOne({
      $or: [
        { from: currentUserId, to: user._id },
        { from: user._id, to: currentUserId },
      ],
    });
    return temp;
  });

  const userWithFriendship = await Promise.all(promises);
  // Response

  sendResponse(
    res,
    200,
    true,
    { users: userWithFriendship, totalPages, count },
    null,
    "Get Current User Successfully"
  );
});

userController.getCurrentUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let getCurrentUserId = req.userId;
  // Validation
  let user = await User.findById({ getCurrentUserId });
  if (!user)
    throw new AppError(400, "User's not found", "Get Current User Error");
  // Process

  // Response

  sendResponse(res, 200, true, { user }, null, "Get Current User Successfully");
});

userController.getSingleUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;
  // Validation
  let user = await User.findById({ userId });
  if (!user)
    throw new AppError(400, "User's not found", "Get Current User Error");
  // Process
  user = user.toJSON();
  user.friendship = await Friend.findOne({
    $or: [
      { from: currentUserId, to: user._id },
      { from: user._id, to: currentUserId },
    ],
  });
  // Response

  sendResponse(res, 200, true, { user }, null, "Get Single User Successfully");
});

userController.updateProfile = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.id;
  // Validation

  if (currentUserId !== userId)
    throw new AppError(400, "Permission Requird", "Update User Error");

  let user = await User.findById({ userId });
  if (!user) throw new AppError(400, "User's not found", "Update User Error");

  // Process
  const allows = [
    "name",
    "avatarUrl",
    "coverUrl",
    "aboutMe",
    "city",
    "country",
    "company",
    "jobTitle",
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

module.exports = userController;
