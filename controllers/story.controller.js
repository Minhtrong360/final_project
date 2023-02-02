const Story = require("../models/Story");
const User = require("../models/User");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const Comment = require("../models/Comment");

const storyController = {};

const calculateStoryCount = async (userId) => {
  const storyCount = await Story.countDocuments({
    author: userId,
    isDelete: false,
  });
  await User.findByIdAndUpdate(userId, { storyCount });
};

storyController.getStories = catchAsync(async (req, res, next) => {
  // Get data from request

  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 1;
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

  const count = await Story.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let stories = await Story.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  // Response

  sendResponse(
    res,
    200,
    true,
    { stories, totalPages, count },
    null,
    "Get Stories Successfully"
  );
});

storyController.getSingleStory = catchAsync(async (req, res, next) => {
  // Get data from request

  const storyId = req.params.id;
  // Validation
  let story = await Story.findById(storyId);
  if (!story)
    throw new AppError(400, "Story's not found", "Get Single Story Error");
  // Process

  // Response

  sendResponse(res, 200, true, story, null, "Get Single Story Successfully");
});

storyController.getCommentOfStory = catchAsync(async (req, res, next) => {
  // Get data from request
  const storyId = req.params.id;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  // Validation story exists
  const story = await Story.findById(storyId);
  if (!story)
    throw new AppError(
      400,
      "Story does not exist",
      "Get Story's comment error"
    );
  //Get comments
  const count = await Comment.countDocuments({ story: storyId });
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  const comments = await Comment.find({ targetId: storyId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");
  // Response

  sendResponse(
    res,
    200,
    true,
    { comments, totalPages, count },
    null,
    "Get Comments of a Story Successfully"
  );
});

storyController.createNewStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { title, cover, genre, summarize } = req.body;
  // Validation

  // const user = await User.findById(currentUserId);
  // const expired = user?.subscription?.expired;
  // const today = new Date();

  // if (!user.subscription.expired || expired < today)
  //   throw new AppError(
  //     400,
  //     "Permission Required or Subscription is expired",
  //     "Create Story Error"
  //   );
  // Process

  let story = await Story.create({
    title,
    cover,
    genre,
    summarize,
    author: currentUserId,
  });

  await calculateStoryCount(currentUserId);

  story = await story.populate("author");

  // Response

  sendResponse(res, 200, true, story, null, "Create Story Successfully");
});

storyController.updateSingleStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const storyId = req.params.id;
  // Validation

  // const user = await User.findById(currentUserId);
  // const expired = user.subscription.expired;
  // const today = new Date();
  // if (!user.subscription.expired || expired < today)
  //   throw new AppError(
  //     400,
  //     "Permission Required or Subscription is expired",
  //     "Create Story Error"
  //   );

  let story = await Story.findById(storyId);
  if (!story)
    throw new AppError(400, "Story's not found", "Update Story Error");
  if (!story.author.equals(currentUserId))
    throw new AppError(400, "Only author can edit story", "Update Story Error");

  // Process
  const allows = ["title", "cover", "genre", "summarize"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      story[field] = req.body[field];
    }
  });

  await story.save();
  // Response

  sendResponse(res, 200, true, story, null, "Update Story Successfully");
});

storyController.deleteSingleStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const storyId = req.params.id;
  // Validation

  // Process
  const story = await Story.findByIdAndUpdate(
    { _id: storyId, author: currentUserId },
    { isDelete: true },
    { new: true }
  );
  if (!story)
    throw new AppError(
      400,
      "Story is not found or User not authorized",
      "Delete Single Story Error"
    );
  await calculateStoryCount(currentUserId);
  // Response

  sendResponse(res, 200, true, story, null, "Delete Story Successfully");
});

module.exports = storyController;
