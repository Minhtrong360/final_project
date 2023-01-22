const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chapterSchema = Schema(
  {
    number: { type: Number, require: true },
    name: { type: String, require: true },
    content: { type: String, require: true },
    ofStory: { type: Schema.Types.ObjectId, require: true, ref: "Story" },
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
