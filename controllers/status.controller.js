const cron = require("node-cron");
const moment = require("moment");
const Status = require("../models/Status");
const { catchAsync, sendResponse } = require("../helpers/utils");
const { AppError } = require("../helpers/utils");
const User = require("../models/User");

const createStatus = async () => {
  try {
    // Calculate the start and end dates of the week
    const startOfWeek = moment.utc().startOf("isoWeek"); // Monday
    const endOfWeek = moment.utc().endOf("isoWeek"); // Sunday

    // Create a new Status document for the current week
    const status = new Status({
      new_users: [],
      login: 0,
      growth_rate: 0,
      start_at: startOfWeek.format("YYYY-MM-DD"),
      end_at: endOfWeek.format("YYYY-MM-DD"),
    });

    // Get the previous week's Status document
    const prevStatus = await Status.findOne()
      .sort({ start_at: -1 })
      .skip(1)
      .limit(1);

    // Update the growth rate of the current week's Status document
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
      `New Status document created for week of ${startOfWeek.format(
        "YYYY-MM-DD"
      )} to ${endOfWeek.format("YYYY-MM-DD")}`
    );
  } catch (error) {
    console.error("Error creating new Status document:", error);
  }
};

// This cron job runs every Monday at 00:00
cron.schedule("0 0 * * 1", createStatus);

const statusController = {
  task: (req, res) => {
    createStatus();
  },
};

statusController.getStatus = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;
  const isAdmin = await User.findById(currentUserId);

  // Validation

  // Process
  if (isAdmin.admin === true) {
    const status = await Status.find({});
    sendResponse(res, 200, true, status, null, "Get Status Successfully");
  } else {
    throw new AppError(401, "Admin requird", "Get Status Error");
  }
});

module.exports = statusController;
