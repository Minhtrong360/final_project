const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = Schema(
  {
    content: { type: String, require: true },
    image: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    post: { type: Schema.Types.ObjectId, require: true, ref: "Post" },
    reaction: {
      like: { type: Number, default: 0 },
      dislike: { type: Number, default: 0 },
    },

    isDelete: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
