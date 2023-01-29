const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const storySchema = Schema(
  {
    title: { type: String, require: true },
    cover: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    genres: { type: String, require: true },
    summaries: { type: String, require: true },

    isDelete: { type: Boolean, default: false, select: false },
    chapterCount: { type: Number, default: 0 },
    reactions: {
      like: { type: Number, default: 0 },
      dislike: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
