const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const genresSchema = new Schema({
  genresList: [
    {
      type: String,
      required: true,
      unique: true,
    },
  ],
});

const Genres = mongoose.model("Genres", genresSchema);

module.exports = Genres;
