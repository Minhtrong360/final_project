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

    if (!chapter)
      throw new AppError(
        400,
        "Chapter's not found",
        "Get Single Chapter Error"
      );
    // Process
    chapter = await chapter.populate("ofStory");
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
    const count = (await Comment.find({ targetId: chapterId })).length; // Find all Comment of a chapter with chapterId
    const totalPages = Math.ceil(count / limit);
    const offset = limit * (page - 1);

    const comments = await Comment.find({ targetId: chapterId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("targetId")
      .populate("author");
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

chapterController.createNewChapterOfStory = catchAsync(
  async (req, res, next) => {
    // Get data from request

    let currentUserId = req.userId;
    let storyId = req.params.storyId;
    let { title, avatar, content } = req.body;
    // Validation

    const user = await User.findById(currentUserId);

    if (!user?.subscription?.isSubscription)
      throw new AppError(
        400,
        "Permission Required or Subscription is expired",
        "Create Chapter Error"
      );
    // Process

    let story = await Story.findById(storyId);
    if (!story)
      throw new AppError(400, "Story does not exist", "Create Chapter Error");

    if (!story.authorId.equals(currentUserId))
      throw new AppError(
        400,
        "Only author of Story can create Chapter of this Story",
        "Create Chapter Error"
      );
    let chapter = await Chapter.findOne({ title, ofStory: storyId });

    if (chapter)
      throw new AppError(
        400,
        "Chapter already existed",
        "Create Chapter Error"
      );

    chapter = await Chapter.create({
      title,
      avatar,
      content,
      ofStory: storyId,
      number: story.chapterCount++,
    });

    await calculatChapterCount(storyId);

    chapter = await chapter.populate("ofStory");

    // Response

    sendResponse(res, 200, true, chapter, null, "Create Chapter Successfully");
  }
);

chapterController.updateChapterOfStory = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const chapterId = req.params.chapterId;
  let { updateData } = req.body;
  // Validation

  const user = await User.findById(currentUserId);

  if (!user.subscription.isSubscription)
    throw new AppError(
      400,
      "Permission Required or Subscription is expired",
      "Update Chapter Error"
    );

  let chapter = await Chapter.findById(chapterId).populate("ofStory");
  if (!chapter)
    throw new AppError(400, "Chapter's not found", "Update Chapter Error");

  if (!chapter.ofStory.authorId.equals(currentUserId))
    throw new AppError(
      400,
      "Only author can edit chapter",
      "Update Chapter Error"
    );

  // let compare = await Chapter.findOne({
  //   title: updateData?.title,
  // });
  // console.log("compare", compare?.ofStory.equals(chapter?.ofStory?._id));
  // if (compare && compare?.ofStory.equals(chapter?.ofStory?._id))
  //   throw new AppError(
  //     400,
  //     "Chapter's title already existed",
  //     "Update Chapter Error"
  //   );

  // Process
  const allows = ["title", "avatar", "content"];

  allows.forEach(async (field) => {
    if (updateData[field] !== undefined) {
      chapter[field] = updateData[field];
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
  if (!chapter || !chapter.ofStory.authorId.equals(currentUserId))
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
