const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionSchema = Schema(
  {
    author: { type: Schema.Types.ObjectId, require: true, ref: "User" },
    timeRegister: { type: Date, require: false },
    expired: { type: Date, required: false },
    paymentMethods: { type: String, require: false },
    isDelete: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
