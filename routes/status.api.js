const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const statusController = require("../controllers/status.controller");

router.post("/trigger", authentication.loginRequired, statusController.task);

router.get("/admin", authentication.loginRequired, statusController.getStatus);

module.exports = router;
