const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  fileName: { type: String, required: true },
});

imageSchema.virtual("url").get(function () {
  return `/images/${this._id}`;
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
