const mongoose = require("mongoose");
const { sendResponse, AppError, catchAsync } = require("../helpers/utils");
const User = require("../models/User");
const Genres = require("../models/Genres");

const genresController = {};

genresController.getGenres = catchAsync(async (req, res, next) => {
  // Get data from request
  let currentUserId = req.userId;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (!isAdmin.admin) {
    throw new AppError(401, "Admin requird", "Get Genres Error");
  }
  const genres = await Genres.findOne();

  return sendResponse(res, 200, true, genres, null, "Get Genres Successfully");
});

genresController.postGenre = catchAsync(async (req, res, next) => {
  // Get data from request
  const currentUserId = req.userId;
  const genresName = req.body.genresName;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (!isAdmin.admin)
    throw new AppError(401, "Admin required", "Post Genres Error");

  let genres = await Genres.findOne();
  if (!genres) {
    genres = await Genres.create({ genresList: [genresName] });
  } else {
    if (genres.genresList.includes(genresName)) {
      throw new AppError(400, "Genres already exists", "Post Genres Error");
    } else {
      genres.genresList.push(genresName);
      genres.genresList.sort((a, b) => {
        const genreA = a.trim().toLowerCase();
        const genreB = b.trim().toLowerCase();
        if (genreA < genreB) {
          return -1;
        } else if (genreA > genreB) {
          return 1;
        } else {
          return 0;
        }
      });
      await genres.save();
    }
  }

  return sendResponse(res, 200, true, genres, null, "Post Genres Successfully");
});

genresController.deleteGenre = catchAsync(async (req, res, next) => {
  // Get data from request
  const currentUserId = req.userId;

  // Validation
  const isAdmin = await User.findById(currentUserId);
  if (!isAdmin.admin)
    throw new AppError(401, "Admin required", "Delete Genres Error");

  const newGenres = req.body.genresName;
  let genres = await Genres.findOne();

  genres.genresList = genres.genresList.filter((genre) => genre !== newGenres);
  await genres.save();

  return sendResponse(
    res,
    200,
    true,
    genres,
    null,
    "Delete Genres Successfully"
  );
});

module.exports = genresController;
