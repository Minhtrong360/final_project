const Friend = require("../models/Friend");
const User = require("../models/User");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");

const friendController = {};

const calculateFriendCount = async (userId) => {
  const friendCount = await Friend.countDocuments({
    $or: [
      {
        from: userId,
      },
      { to: userId },
    ],
    status: "accepted",
  });
  await User.findByIdAndUpdate(userId, { friendCount: friendCount });
};

friendController.sendFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId;
  const toUserId = req.body.to;

  const user = await User.findById(toUserId);
  if (!user)
    throw new AppError(400, "User not found", "Send Request Friend Error");

  let friend = await Friend.findOne({
    $or: [
      { from: toUserId, to: currentUserId },
      { from: currentUserId, to: toUserId },
    ],
  });
  if (!friend) {
    // Create Friend request
    const friend = await Friend.create({
      from: currentUserId,
      to: toUserId,
      status: "pending",
    });

    return sendResponse(
      res,
      200,
      true,
      friend,
      null,
      "Request Sends Successfully"
    );
  } else {
    switch (friend.status) {
      // status === pending => error: already sent
      case "pendind":
        if (friend.from.equals(currentUserId)) {
          throw new AppError(
            400,
            "You have sent a request to this user",
            "Add Friend Error"
          );
        } else {
          throw new AppError(
            400,
            "You have received a request from this user",
            "Add Friend Error"
          );
        }
      // status === accepted => error: already friend
      case "accepted":
        throw new AppError(400, "Users are already friend", "Add Friend Error");
      // status === declined => update friend request
      case "declined":
        friend.from = currentUserId;
        friend.to = toUserId;
        friend.status = "pending";
        await friend.save();
        return sendResponse(
          res,
          200,
          true,
          friend,
          null,
          "Request Sends Successfully"
        );
      default:
        throw new AppError(400, "Friend status undefined", "Add Friend Error");
    }
  }
});

friendController.getReceivedFriendRequestList = catchAsync(
  async (req, res, next) => {
    let { page, limit, ...filter } = { ...req.query };
    const currentUserId = req.userId;

    let requestList = await Friend.find({
      to: currentUserId,
      status: "pending",
    });
    const requestIds = requestList.map((friend) => {
      if (friend.from._id.equals(currentUserId)) return friend.to;
      else return friend.from;
    });

    const filterConditions = [{ _id: { $in: requestIds } }];
    if (filter.name) {
      filterConditions.push({
        ["name"]: { $regex: filter.name, option: "i" },
      });
    }
    const filterCriteria = filterConditions.length
      ? { $and: filterConditions }
      : {};

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 1;

    const count = await User.countDocuments(filterCriteria);
    const totalPages = Math.ceil(count / limit);
    const offset = limit * (page - 1);

    let users = await User.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const userWithFriendship = users.map((user) => {
      let tem = user.toJSON();
      tem.friendship = friendList.find((friendship) => {
        if (
          friendship.from.equals(user._id) ||
          friendship.to.equals(user._id)
        ) {
          return { status: friendship.status };
        }
        return false;
      });
      return tem;
    });

    return sendResponse(
      res,
      200,
      true,
      { users: userWithFriendship, totalPages, count },
      null,
      "Get Friendlist Successfully"
    );
  }
);

friendController.getSentFriendRequestList = catchAsync(
  async (req, res, next) => {
    let { page, limit, ...filter } = { ...req.query };
    const currentUserId = req.userId;

    let requestList = await Friend.find({
      from: currentUserId,
      status: "pending",
    });
    const recipientIds = requestList.map((friend) => {
      if (friend.from._id.equals(currentUserId)) return friend.to;
      else return friend.from;
    });

    const filterConditions = [{ _id: { $in: recipientIds } }];
    if (filter.name) {
      filterConditions.push({
        ["name"]: { $regex: filter.name, option: "i" },
      });
    }
    const filterCriteria = filterConditions.length
      ? { $and: filterConditions }
      : {};

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 1;

    const count = await User.countDocuments(filterCriteria);
    const totalPages = Math.ceil(count / limit);
    const offset = limit * (page - 1);

    let users = await User.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const userWithFriendship = users.map((user) => {
      let tem = user.toJSON();
      tem.friendship = friendList.find((friendship) => {
        if (
          friendship.from.equals(user._id) ||
          friendship.to.equals(user._id)
        ) {
          return { status: friendship.status };
        }
        return false;
      });
      return tem;
    });

    return sendResponse(
      res,
      200,
      true,
      { users: userWithFriendship, totalPages, count },
      null,
      "Get Friendlist Successfully"
    );
  }
);

friendController.getFriendList = catchAsync(async (req, res, next) => {
  let { page, limit, ...filter } = { ...req.query };
  const currentUserId = req.userId;

  const friendList = await Friend.findOne({
    $or: [{ from: currentUserId }, { to: currentUserId }],
    status: "accepted",
  });

  const friendIds = friendList.map((friend) => {
    if (friend.from._id.equals(currentUserId)) return friend.to;
    else return friend.from;
  });

  const filterConditions = [{ _id: { $in: friendIds } }];
  if (filter.name) {
    filterConditions.push({
      ["name"]: { $regex: filter.name, option: "i" },
    });
  }
  const filterCriteria = filterConditions.length
    ? { $and: filterConditions }
    : {};

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 1;

  const count = await User.countDocuments(filterCriteria);
  const totalPages = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  let users = await User.find(filterCriteria)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const userWithFriendship = users.map((user) => {
    let tem = user.toJSON();
    tem.friendship = friendList.find((friendship) => {
      if (friendship.from.equals(user._id) || friendship.to.equals(user._id)) {
        return { status: friendship.status };
      }
      return false;
    });
    return tem;
  });

  return sendResponse(
    res,
    200,
    true,
    { users: userWithFriendship, totalPages, count },
    null,
    "Get Friendlist Successfully"
  );
});

friendController.reactFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId; //To
  const fromUserId = req.params.id; //From
  const status = req.body; // accepted or declined

  const friend = await Friend.findOne({
    from: fromUserId,
    to: currentUserId,
    status: "pending",
  });
  if (!friend)
    throw new AppError(400, "Request not found", "React Friend Requets Error");
  await friend.delete();

  friend.status = status;
  await friend.save();

  if (friend.status === "accepted") {
    await calculateFriendCount(currentUserId);
    await calculateFriendCount(fromUserId);
  }

  return sendResponse(
    res,
    200,
    true,
    friend,
    null,
    "Cancel Friend Request Successfully"
  );
});

friendController.cancelFriendRequest = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId; //from
  const toUserId = req.params.id; //to

  const friend = await Friend.findOne({
    from: currentUserId,
    to: toUserId,
    status: "pending",
  });

  if (!friend)
    throw new AppError(400, "Request not found", "Cancel Friend Requets Error");
  await friend.delete();

  return sendResponse(
    res,
    200,
    true,
    friend,
    null,
    "Cancel Friend Request Successfully"
  );
});

friendController.removeFriend = catchAsync(async (req, res, next) => {
  const currentUserId = req.userId; //from

  const friendId = req.params.id; //to

  const friend = await Friend.findOne({
    $or: [
      {
        from: currentUserId,

        to: friendId,
      },
      {
        from: friendId,
        to: currentUserId,
      },
    ],
    status: "accepted",
  });

  if (!friend)
    throw new AppError(400, "Friend not found", "Remove Friend Error");
  await friend.delete();
  await calculateFriendCount(currentUserId);
  await calculateFriendCount(friendId);

  return sendResponse(
    res,
    200,
    true,
    friend,
    null,
    "Remove Friend Successfully"
  );
});

module.exports = friendController;
