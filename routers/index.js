// packages
const express = require("express");
const router = express.Router();

// functionalities
const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

// Landing Page route
router.get("/", forwardAuthenticated, (req, res) => res.render("home/index"));

// About us page route
router.get("/aboutus", (req, res) => {
  res.render("home/aboutus.ejs");
});

// Calendar page route
router.get("/calendarkshit", ensureAuthenticated, async (req, res) => {
  // const { createEvent } = require("../calendarback");

  res.render("calendar.ejs", {
    url,
  });
});

// Profile page route
router.get("/profile", ensureAuthenticated, async (req, res) => {
  // proper back routing
  if (req.user.email == "admin@gmail.com") {
    var url = "/admindashboard";
  } else if (req.user.position === "Teacher") {
    var url = "/teacherdashboard";
  } else {
    var url = "/dashboard";
  }

  // rendering profile page
  res.render("Profile.ejs", {
    url,
    user: req.user,
  });
});

module.exports = router;
