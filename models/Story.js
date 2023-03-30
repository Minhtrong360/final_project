const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const storySchema = Schema(
  {
    title: { type: String, require: true },
    cover: { type: Object, require: false, default: {} },
    authorId: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    authorName: { type: String, require: true },

    genres: { type: Object, require: true },
    artist: { type: String, require: true },
    summarize: { type: String, require: true },
    minimumAge: { type: Number, require: true },
    view: { type: Number, require: false, default: 0 },
    isDelete: { type: Boolean, default: false, select: false },
    chapterCount: { type: Number, default: 0 },
    reactions: {
      like: { type: Number, default: 0 },
      disLike: { type: Number, default: 0 },
      authorIdOfLike: [{ type: Object }],
      authorIdOfDisLike: [{ type: Object }],
    },
  },
  { timestamps: true }
);

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
