const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema(
  {
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true, select: false },
    avatar: { type: String, require: false, default: "" },
    cover: { type: String, require: false, default: "" },
    gender: {
      type: String,
      require: false,
      enum: ["Male", "Female", "Undefined"],
    },
    address: { type: String, require: false },
    birthday: { type: Date, require: false },
    phoneNumber: { type: Number, require: false },
    ID: { type: Number, require: false },

    isDelete: { type: Boolean, default: false, select: false },

    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },

    storyCount: { type: Number, default: 0 },
    stories: { type: Schema.Types.ObjectId, require: true, ref: "Story" },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const user = this._doc;
  delete user.password;
  delete user.isDelete;
  return user;
};

userSchema.methods.generateToken = async function () {
  const accessToken = await jwt.sign({ _id: this._id }, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
  return accessToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
