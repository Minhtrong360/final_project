const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reactionSchema = Schema(
  {
    author: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    targetType: { type: String, required: true, enum: ["Post", "Comment"] },
    targetId: {
      type: String,
      required: true,
      refPath: "targetType", //reference to Post or Comment depend on value of targetType
    },
    emoji: { type: String, required: true, enum: ["like", "dislike"] },
  },
  { timestamps: true }
);

const Reaction = mongoose.model("Reaction", reactionSchema);

module.exports = Reaction;
