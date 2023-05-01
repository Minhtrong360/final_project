const cron = require("node-cron");
const moment = require("moment");
const Status = require("../models/Status");
const { catchAsync, sendResponse } = require("../helpers/utils");
const { AppError } = require("../helpers/utils");
const User = require("../models/User");

const createStatus = async () => {
  try {
    // Calculate the start and end dates of the current day
    const startOfDay = moment.utc().startOf("day");
    const endOfDay = moment.utc().endOf("day");

    // Loop through each day between the start and end dates
    for (
      let date = moment.utc(startOfDay);
      date <= endOfDay;
      date.add(1, "day")
    ) {
      // Create a new Status document for the current day
      const status = new Status({
        new_users: [],
        login: 0,
        growth_rate: 0,
        date: date.format("YYYY-MM-DD"),
      });

      // Get the previous day's Status document
      const prevStatus = await Status.findOne({
        date: moment.utc(date).subtract(1, "day").format("YYYY-MM-DD"),
      });

      // Update the growth rate of the current day's Status document
      if (prevStatus) {
        const growthRate =
          ((status.login - prevStatus.login) / prevStatus.login) * 100 +
          ((status.new_users.length - prevStatus.new_users.length) /
            prevStatus.new_users.length) *
            100;
        status.growth_rate = growthRate.toFixed(2);
      }

      await status.save();
      console.log(
        `New Status document created for ${date.format("YYYY-MM-DD")}`
      );
    }
  } catch (error) {
    console.error("Error creating new Status document:", error);
  }
};

// This cron job runs every day at 00:00
cron.schedule("0 0 * * *", createStatus);

const statusController = {
  task: (req, res) => {
    createStatus();
  },
};

statusController.getStatus = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  let { page, limit, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 7;
  const offset = limit * (page - 1);
  const isAdmin = await User.findById(currentUserId);

  // Validation

  // Process
  if (isAdmin.admin === true) {
    const status = await Status.find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    sendResponse(res, 200, true, status, null, "Get Status Successfully");
  } else {
    throw new AppError(401, "Admin requird", "Get Status Error");
  }
});

module.exports = statusController;
