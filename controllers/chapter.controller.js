const Chapter = require("../models/Chapter");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const mongoose = require("mongoose");
const User = require("../models/User");
const Story = require("../models/Story");
const Comment = require("../models/Comment");

const chapterController = {};

const calculatChapterCount = async (storyId) => {
  const chapterCount = await Chapter.countDocuments({
    ofStory: storyId,
    isDelete: false,
  });
  await Story.findByIdAndUpdate(storyId, { chapterCount });
};

chapterController.getChaptersOfStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let storyId = req.params.storyId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  // Validation
  const filterConditions = [{ isDelete: false }, { ofStory: storyId }];

  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  // Process

  const count = await Chapter.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let chapters = await Chapter.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  // Response

  sendResponse(
    res,
    200,
    true,
    { chapters, totalPages, count },
    null,
    "Get Chapters Successfully"
  );
});

chapterController.getSingleChapterOfStory = catchAsync(
  async (req, res, next) => {
    // Get data from request

    const chapterId = req.params.chapterId;
    // Validation
    let chapter = await Chapter.findById(chapterId);
    chapter = await chapter.populate("ofStory");
    if (!chapter)
      throw new AppError(
        400,
        "Chapter's not found",
        "Get Single Chapter Error"
      );
    // Process

    // Response

    sendResponse(
      res,
      200,
      true,
      { chapter },
      null,
      "Get Single Chapter Successfully"
    );
  }
);

chapterController.getCommentOfChapterOfStory = catchAsync(
  async (req, res, next) => {
    // Get data from request
    const chapterId = req.params.chapterId;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    // Validation chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter)
      throw new AppError(400, "Chapter does not exist", "Get chapter error");
    //Get comments
    const count = await Comment.countDocuments(
      { targetType: "Chapter" },
      { targetId: chapterId }
    ); // Find all Comment of a chapter with chapterId
    const totalPages = Math.ceil(count / limit);
    const offset = limit * (page - 1);

    const comments = await Comment.find({ targetId: chapterId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("targetId");
    // Response

    sendResponse(
      res,
      200,
      true,
      { comments, totalPages, count },
      null,
      "Get Comments of a Chapter Successfully"
    );
  }
);

chapterController.createNewChpaterOfStory = catchAsync(
  async (req, res, next) => {
    // Get data from request

    let currentUserId = req.userId;
    let storyId = req.params.storyId;
    let { number, name, content } = req.body;
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
    // Process

    let chapter = await Chapter.findOne({ number });

    if (chapter)
      throw new AppError(
        400,
        "Chapter already existed",
        "Create Chapter Error"
      );

    chapter = await Chapter.create({
      number,
      name,
      content,
      ofStory: storyId,
    });

    await calculatChapterCount(storyId);

    // chapter = await Chapter.populate("ofStory"); hỏi

    // Response

    sendResponse(res, 200, true, chapter, null, "Create Chapter Successfully");
  }
);

chapterController.updateChpaterOfStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const chapterId = req.params.chapterId;
  // Validation

  // const user = await User.findById({ currentUserId });
  // const expired = user.subscription.expired;
  // const today = new Date();
  // if (!user.subscription.expired || expired < today)
  //   throw new AppError(
  //     400,
  //     "Permission Required or Subscription is expired",
  //     "Update Chapter Error"
  //   );

  let chapter = await Chapter.findById(chapterId).populate("ofStory");
  if (!chapter)
    throw new AppError(400, "Chapter's not found", "Update Chapter Error");

  if (!chapter.ofStory.author.equals(currentUserId))
    throw new AppError(
      400,
      "Only author can edit chapter",
      "Update Chapter Error"
    );

  // Process
  const allows = ["number", "name", "content"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      chapter[field] = req.body[field];
    }
  });

  await chapter.save();
  // Response

  sendResponse(res, 200, true, chapter, null, "Update Chapter Successfully");
});

chapterController.deleteChapterOfStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const chapterId = req.params.chapterId;
  // Validation

  // Process
  const chapter = await Chapter.findById(chapterId).populate("ofStory");
  if (!chapter || !chapter.ofStory.author.equals(currentUserId))
    throw new AppError(
      400,
      "Chapter is not found or User not authorized",
      "Delete Single Chapter Error"
    );
  chapter.isDelete = true;
  await chapter.save();
  let storyId = chapter.ofStory;
  await calculatChapterCount(storyId);
  // Response

  sendResponse(res, 200, true, chapter, null, "Delete Chapter Successfully");
});

module.exports = chapterController;
