const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");

const indexRouter = require("./routes/index");

const { sendResponse } = require("./helpers/utils");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", indexRouter);

// //Upload image to sever side
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });

// app.post("/api/uploadImages", upload.array("files"), (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded" });
//     }

//     const imageUrls = req.files.map((file) => `images/${file.filename}`);

//     res.json({ imageUrls });
//   } catch (error) {
//     sendResponse(res, 400, null, null, "Upload File Error", error.message);
//   }
// });

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connect to database successfully", mongoURI))
  .catch((err) => console.log(err.message));

//Error handler
// catch 404
app.use((req, res, next) => {
  const err = new Error("Not found");
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.log("ERROR", err);
  if (err.isOperational) {
    return sendResponse(
      res,
      err.statusCode ? err.statusCode : 500,
      false,
      null,
      { message: err.message },
      err.errorType
    );
  } else {
    return sendResponse(
      res,
      err.statusCode ? err.statusCode : 500,
      false,
      null,
      { message: err.message },
      "Internal Sever Error"
    );
  }
});

module.exports = app;
