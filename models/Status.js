const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statusSchema = new Schema(
  {
    new_users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    login: {
      type: Number,
      default: 0,
    },
    view: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
