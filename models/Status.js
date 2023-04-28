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
    growth_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    start_at: {
      type: Date,
      required: true,
    },
    end_at: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
