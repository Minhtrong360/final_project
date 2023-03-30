const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chapterSchema = Schema(
  {
    number: { type: Number, require: false },
    title: { type: String, require: true },
    avatar: { type: Object, require: false, default: {} }, //todo: tạm thời false
    content: { type: Object, require: false, default: {} }, //todo: tạm thời false
    ofStory: { type: Schema.Types.ObjectId, require: true, ref: "Story" },
    isDelete: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
