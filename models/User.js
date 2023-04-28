const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema(
  {
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true, select: false },
    admin: { type: Boolean, require: true },
    cover: { type: Object, require: false, default: {} },
    gender: {
      type: String,
      require: false,
      enum: ["Male", "Female", "Undefined"],
    },
    address: { type: String, require: false, default: "" },
    city: { type: String, require: false, default: "" },
    country: { type: String, require: false, default: "" },
    aboutMe: { type: String, require: false, default: "" },
    birthday: { type: Date, require: false, default: "" },
    phoneNumber: { type: Number, require: false, default: "" },
    facebookLink: { type: String, require: false, default: "" },
    instagramLink: { type: String, require: false, default: "" },
    linkedinLink: { type: String, require: false, default: "" },
    twitterLink: { type: String, require: false, default: "" },
    isDelete: { type: Boolean, default: false, select: false },
    subscription: { type: Object, ref: "Subscription" },
    lovedStory: { type: Array, require: true, ref: "Story" },
    // isSubscription: { type: Boolean, default: false },
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
    expiresIn: "7d",
  });
  return accessToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
