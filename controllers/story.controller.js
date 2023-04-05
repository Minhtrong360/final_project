const Story = require("../models/Story");

const User = require("../models/User");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");
const Chapter = require("../models/Chapter");

const storyController = {};

const calculateStoryCount = async (userId) => {
  const storyCount = await Story.countDocuments({
    authorId: userId,
    isDelete: false,
  });
  await User.findByIdAndUpdate(userId, { storyCount });
};

storyController.getStories = catchAsync(async (req, res, next) => {
  // Get data from request

  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // Validation
  const filterConditions = [{ isDelete: false }];
  if (filter.query) {
    filterConditions.push({
      title: { $regex: filter.query, $options: "i" },
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

storyController.getStoriesOfUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let userId = req.params.userId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // Validation
  const filterConditions = [{ isDelete: false, authorId: userId }];
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

storyController.getLovedStoriesOfUser = catchAsync(async (req, res, next) => {
  // Get data from request
  let userId = req.params.userId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // Validation
  const user = await User.findById(userId);
  let lovedStoriesId = user?.lovedStory || [];

  // Process

  const stories = await Story.find({ _id: { $in: lovedStoriesId } })
    .sort({ createdAt: -1 })
    .limit(limit);

  // Response

  sendResponse(
    res,
    200,
    true,
    { stories },
    null,
    "Get LovedStories Successfully"
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
  story.view += 1;
  story.save();
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
  const count = (await Comment.find({ targetId: storyId })).length;
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

  let { title, authorName, artist, cover, genres, summarize, minimumAge } =
    req.body;
  // Validation

  const user = await User.findById(currentUserId);

  if (!user.subscription.isSubscription)
    throw new AppError(
      400,
      "Permission Required or Subscription is expired",
      "Create Story Error"
    );
  // Process

  let story = await Story.findOne({ title: { $regex: title, $options: "i" } });
  if (story)
    throw new AppError(400, "Story already existed", "Create Story Error");
  story = await Story.create({
    title,
    authorName,
    artist,
    cover,
    genres,
    summarize,
    minimumAge,
    authorId: currentUserId,
  });

  await calculateStoryCount(currentUserId);

  story = await story.populate("authorId");

  // Response

  sendResponse(res, 200, true, story, null, "Create Story Successfully");
});

storyController.updateSingleStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const storyId = req.params.id;
  const { data } = req.body;
  // Validation

  const user = await User.findById(currentUserId);

  if (!user.subscription.isSubscription)
    throw new AppError(
      400,
      "Permission Required or Subscription is expired",
      "Update Story Error"
    );

  let story = await Story.findById(storyId);
  if (!story)
    throw new AppError(400, "Story's not found", "Update Story Error");
  if (!story.authorId.equals(currentUserId))
    throw new AppError(400, "Only author can edit story", "Update Story Error");

  let compare = await Story.find({
    title: { $regex: data.title, $options: "i" },
  });

  if (compare.length > 1)
    throw new AppError(400, "Story already existed", "Update Story Error");
  // Process
  const allows = [
    "title",
    "authorName",
    "artist",
    "genres",
    "mimimumAge",
    "summarize",
    "cover",
  ];

  allows.forEach(async (field) => {
    if (data[field] !== undefined) {
      story[field] = data[field];
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

storyController.updateReactionStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const storyId = req.params.id;
  const { data } = req.body;
  // Validation

  // Process
  const story = await Story.findById(storyId);

  if (!story)
    throw new AppError(
      400,
      "Story is not found",
      "Update Reaction Of Story Error"
    );

  if (data === "like") {
    const schemaAuthorIds = story.reactions.authorIdOfLike;

    const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
      return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
    });

    if (isAuthorIdMatched) {
      story.reactions.like -= 1;
      const index = story.reactions.authorIdOfLike.indexOf(currentUserId);
      story.reactions.authorIdOfLike.splice(index, 1);
    }
    if (!isAuthorIdMatched) {
      const schemaAuthorIds = story.reactions.authorIdOfDisLike;

      const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
        return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
      });
      if (isAuthorIdMatched) {
        story.reactions.disLike -= 1;
        const index = story.reactions.authorIdOfDisLike.indexOf(currentUserId);
        story.reactions.authorIdOfDisLike.splice(index, 1);
      }
      story.reactions.like += 1;
      story.reactions.authorIdOfLike.push(currentUserId);
    }
  }
  if (data === "disLike") {
    const schemaAuthorIds = story.reactions.authorIdOfDisLike;

    const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
      return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
    });
    if (isAuthorIdMatched) {
      story.reactions.disLike -= 1;
      const index = story.reactions.authorIdOfDisLike.indexOf(currentUserId);
      story.reactions.authorIdOfDisLike.splice(index, 1);
    }
    if (!isAuthorIdMatched) {
      const schemaAuthorIds = story.reactions.authorIdOfLike;

      const isAuthorIdMatched = schemaAuthorIds.some((schemaAuthorId) => {
        return mongoose.Types.ObjectId(schemaAuthorId).equals(currentUserId);
      });
      if (isAuthorIdMatched) {
        story.reactions.like -= 1;
        const index = story.reactions.authorIdOfLike.indexOf(currentUserId);
        story.reactions.authorIdOfLike.splice(index, 1);
      }
      story.reactions.disLike += 1;
      story.reactions.authorIdOfDisLike.push(currentUserId);
    }
  }

  story.save();

  // Response

  sendResponse(
    res,
    200,
    true,
    story,
    null,
    "Update Reaction Of Story Successfully"
  );
});

storyController.deleteAllStories = catchAsync(async (req, res, next) => {
  // Get data from request

  // Process
  const chapter = await Chapter.find({});

  // Response

  sendResponse(res, 200, true, story, null, "Delete Story Successfully");
});

module.exports = storyController;
