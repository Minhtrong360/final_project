const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authentication = require("../middlewares/authentication");
const genresController = require("../controllers/genres.controller");
const validators = require("../middlewares/validators");

// Genres
router.get("/", authentication.loginRequired, genresController.getGenres);

router.post(
  "/",
  authentication.loginRequired,
  validators.validate([body("genresName", "Missing info").exists().notEmpty()]),
  genresController.postGenre
);

router.delete(
  "/",
  authentication.loginRequired,
  // validators.validate([body("genresName", "Missing info").exists().notEmpty()]),
  genresController.deleteGenre
);

module.exports = router;
