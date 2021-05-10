// packages
const express = require("express");
const router = new express.Router();

// models
const Form = require("../../models/form");
const User = require("../../models/User");
const clubHeadForm = require("../../models/clubHeadForm");
const club = require("../../models/club");
const leaveApplicationForm = require("../../models/leaveApplicationForm");

// functionalities
const { ensureAuthenticated } = require("../../config/auth");

// route for getting permission form
router.get("/permissionform", ensureAuthenticated, (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // rendering form page with clubs and user information
    res.render("student/permissionform.ejs", {
      user: req.user,
      authClubs: req.user.authClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// route for club permission form
router.get("/:club/permissionform", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // take the clubname from parameters
    const clubName = req.params.club;

    // find a club document in database with that club name
    const form = await club.findOne({ clubName: clubName });

    // rendering
    res.render("student/permissionform.ejs", {
      user: req.user,
      form,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// route for getting leave applications
router.get("/leaveApplicationForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // get all users who have status as Teacher in database
    const allteachers = await User.find({ position: "Teacher" });

    // render the form with all the teachers
    res.render("student/leaveApplicationForm.ejs", {
      user: req.user,
      clubs: req.user.clubs,
      allteachers: allteachers,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// save the permission form in database
router.post("/saveForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // create a new form model with the owner information as user
    const formdata = new Form({
      ...req.body,
      owner: req.user._id,
    });

    // save this form in database
    await formdata.save();
    res.status(201);

    // render the animation page
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});

// post request to save club head form
router.post("/saveClubHeadForm", ensureAuthenticated, async (req, res) => {
  try {
    // creating a new club head form with the owner information
    const clubHeadFormData = new clubHeadForm({
      ...req.body,
      owner: req.user._id,
    });

    // saving the form in database
    await clubHeadFormData.save();
    res.status(201);

    // rendering animation success page
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});

// getting club head form route
router.get("/clubHeadForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // data
    const clubs = req.user.clubs;
    const authClubs = req.user.authClubs;

    // getting proper information to render in the frontend
    var showClubs = [];
    clubs.forEach((club) => {
      var flag = 0;
      for (var i = 0; i < authClubs.length; i++) {
        if (authClubs[i].authClub == club.club) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        showClubs.push(club.club);
      }
    });

    // rendering the clubheadform page with the clubs fetched in previous steps
    res.render("student/clubHeadForm.ejs", {
      user: req.user,
      showClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// post request for saving leave form
router.post("/saveLeaveForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // new leave form model
    const leaveFormData = new leaveApplicationForm({
      ...req.body,
      owner: req.user._id,
    });

    // saving leave form in database
    await leaveFormData.save();

    // setting proper status
    res.status(201);

    // rendering page with animation
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
