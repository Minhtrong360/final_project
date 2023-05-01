const Story = require("../models/Story");

const User = require("../models/User");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");
const Chapter = require("../models/Chapter");
const Status = require("../models/Status");
const moment = require("moment/moment");

let allowGenres = [
  "Action",
  "Adventure",
  "Chuyển sinh",
  "Comedy",
  "Cổ đại",
  "Drama",
  "Fantasy",
  "Manhwa",
  "Magic",
  "Mystery",
  "Ngôn tình",
  "Thể thao",
  "Trọng sinh",
  "Truyện màu",
  "Xuyên không",
];

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
  limit = parseInt(limit) || 8;

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
  limit = parseInt(limit) || 8;

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
  limit = parseInt(limit) || 8;

  // Validation
  const user = await User.findById(userId);
  let lovedStoriesId = user?.lovedStory || [];

  // Process
  const count = await Story.countDocuments({ _id: { $in: lovedStoriesId } });
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);
  const stories = await Story.find({ _id: { $in: lovedStoriesId } })
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

  // Update the login count in the Status model
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

  status.view += 1;
  await status.save();

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
  const currentUserId = req.userId;
  const storyId = req.params.id;

  // Validation
  const user = await User.findById(currentUserId);

  // Process
  let query = { _id: storyId, author: currentUserId };
  if (user.admin) {
    query = { _id: storyId };
  }

  const story = await Story.findOneAndUpdate(
    query,
    { isDelete: true },
    { new: true }
  );

  if (!story) {
    throw new AppError(
      400,
      "Story is not found or User not authorized",
      "Delete Single Story Error"
    );
  }

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
  const chapter = await Chapter.deleteMany({});

  // Response

  sendResponse(res, 200, true, story, null, "Delete Story Successfully");
});

// storyController.fixGenres = catchAsync(async (req, res, next) => {
//   // Get data from request

//   // Process

//   let stories = await Story.find({});
//   stories.forEach((story) => {
//     // Loop through each story
//     let genres = story.genres; // Get the genres of the current story
//     let genreArray = genres.split(", "); // Convert the genres from a string into an array
//     story.genres = genreArray; // Set the genres of the current story to the new array
//     story.save((err) => {
//       // Save the updated story to the database
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(`Genres updated for story with ID ${story._id}`);
//       }
//     });
//   });
//   console.log("fixGenres", stories);
//   // Response

//   sendResponse(res, 200, true, { stories }, null, "Get Stories Successfully");
// });

// Genres
storyController.getGenres = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (isAdmin.admin === true) {
    sendResponse(res, 200, true, allowGenres, null, "Get Genres Successfully");
  } else {
    throw new AppError(401, "Admin requird", "Get Genres Error");
  }
});

storyController.postGenre = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (isAdmin.admin === true) {
    let newGenres = req.body.genresName;
    allowGenres.push(newGenres);
    console.log("allowGenres", allowGenres);
    sendResponse(res, 200, true, allowGenres, null, "Post Genres Successfully");
  } else {
    throw new AppError(401, "Admin requird", "Post Genres Error");
  }
});

storyController.deleteGenre = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (isAdmin.admin === true) {
    let newGenres = req.body.genresName;
    allowGenres = allowGenres.filter((genre) => genre !== newGenres); // remove newGenres from allowGenres
    console.log("allowGenres", allowGenres);
    sendResponse(
      res,
      200,
      true,
      allowGenres,
      null,
      "Delete Genres Successfully"
    );
  } else {
    throw new AppError(401, "Admin required", "Delete Genres Error");
  }
});

module.exports = storyController;
