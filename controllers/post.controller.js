const Post = require("../models/Post");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Friend = require("../models/Friend");

const postController = {};

const calculatePostCount = async (userId) => {
  const postCount = await Post.countDocuments({
    author: userId,
    isDelete: false,
  });
  await User.findByIdAndUpdate(userId, { postCount });
};

postController.createNewPost = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { content, image } = req.body;
  // Validation

  // Process

  let post = await Post.create({
    content,
    image,
    author: currentUserId,
  });

  await calculatePostCount(currentUserId);

  post = await post.populate("author");

  // Response

  sendResponse(res, 200, true, post, null, "Create Post Successfully");
});

postController.updateSinglePost = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const postId = req.params.id;
  // Validation

  let post = await Post.findById({ postId });
  if (!post) throw new AppError(400, "Post's not found", "Update Post Error");
  if (!post.author.equal(currentUserId))
    throw new AppError(400, "Only author can edit post", "Update Post Error");

  // Process
  const allows = ["content", "image"];

  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });

  await post.save();
  // Response

  sendResponse(res, 200, true, post, null, "Update Post Successfully");
});

postController.getSinglePost = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentpostId = req.postId;
  const postId = req.params.id;
  // Validation
  let post = await post.findById({ postId });
  if (!post)
    throw new AppError(400, "Post's not found", "Get Single Post Error");
  // Process
  post = post.toJSON();
  post.comment = await Comment.find({ post: post._id }).populate("author");
  // Response

  sendResponse(res, 200, true, { post }, null, "Get Single Post Successfully");
});

postController.getPosts = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const userId = req.params.userId;
  let { page, limit, ...filter } = { ...req.query };

  // Validation
  let user = await User.findById({ currentUserId });
  if (!user) throw new AppError(400, "User's not found", "Get Post Error");

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 1;

  let userFriendIDs = await Friend.find({
    $or: [{ from: userId }, { to: userId }],
    status: "accepted",
  });
  if (userFriendIDs && userFriendIDs.length) {
    userFriendIDs = userFriendIDs.map((friend) => {
      if (friend.from._id.equal(userId)) return friend.to;
      return friend.from;
    });
  } else userFriendIDs = [];
  userFriendIDs = [...userFriendIDs, userId];

  /** currentUserId: 123
   *   userFriendIDs = [
   * {from: 123, to: 456, status: accepted}
   * {from: 123, to: 789, status: accepted}
   * {from: 111, to: 123, status: accepted}
   * ]
   * after if (userFriendIDs && userFriendIDs.length) => userFriendIDs = [456,789,111]
   */

  const filterConditions = [
    { isdelete: false },
    { author: { $in: userFriendIDs } },
  ];
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  // Process

  const count = Post.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let posts = await Post.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");

  // Response

  sendResponse(
    res,
    200,
    true,
    { posts, totalPages, count },
    null,
    "Get Current post Successfully"
  );
});

postController.deleteSinglePost = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const postId = req.params.id;
  // Validation

  // Process
  const post = await Post.findByIdAndUpdate(
    { _id: postId, author: currentUserId },
    { isDelete: true },
    { new: true }
  );
  if (!post)
    throw new AppError(
      400,
      "Post is not found or User not authorized",
      "Delete Single Post Error"
    );
  await calculatePostCount(currentUserId);
  // Response

  sendResponse(res, 200, true, post, null, "Delete Post Successfully");
});

postController.getCommentsOfPost = catchAsync(async (req, res, next) => {
  // Get data from request
  const postId = req.params.id;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  // Validation post exists
  const post = await Post.findById(postId);
  if (!post)
    throw new AppError(400, "Post does not exist", "Get comment error");
  //Get comments
  const count = await Comment.countDocuments({ post: postId }); // Find all Comment of a post with postId
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  const comments = await Comment.find({ post: postId })
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
    "Get Comments of a Post Successfully"
  );
});

module.exports = postController;
