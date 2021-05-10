// packages
const express = require("express");
const router = new express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Load models
const Form = require("../../models/form");
const path = require("path");
const { db } = require("../../models/form");
const User = require("../../models/User");

// functionalities
const {
  forwardAuthenticated,
  ensureAuthenticated,
} = require("../../config/auth");
const club = require("../../models/club");
const clubHeadForm = require("../../models/clubHeadForm");
const leaveApplicationForm = require("../../models/leaveApplicationForm");

// history of event requests page
router.get("/history/eventRequests", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // fetching all forms which belong to him
    const allforms = await Form.find({ owner: req.user._id });

    // rendering the page with the forms fetched from databse
    res.render("student/history.ejs", { type: "e", user: req.user, allforms });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// history page for leave applciations
router.get(
  "/history/leaveApplications",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Student") {
        res.render("404.ejs");
      }

      // fetching leave applications which belong to him
      const allforms = await leaveApplicationForm.find({ owner: req.user._id });

      // render the page with those details
      res.render("student/history.ejs", {
        type: "l",
        user: req.user,
        allforms,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// history page for club head request sent by student
router.get(
  "/history/clubHeadRequests",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Student") {
        res.render("404.ejs");
      }
      // fetching all club head forms from databse
      const allforms = await clubHeadForm.find({ owner: req.user._id });

      // rendering the page with those details
      res.render("student/history.ejs", {
        type: "a",
        user: req.user,
        allforms,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// Dashboard for student
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // data
    const clubs = req.user.clubs;
    const authClubs = req.user.authClubs;

    // displaying only certain clubs
    var viewOnlyClubs = [];
    clubs.forEach((club) => {
      var flag = 0;
      for (var i = 0; i < authClubs.length; i++) {
        if (authClubs[i].authClub == club.club) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        viewOnlyClubs.push(club.club);
      }
    });

    // rendering page with details of which club student is auth user/club member of
    res.render("student/dashboard.ejs", {
      user: req.user,
      approved: req.user.approved,
      clubs,
      viewOnlyClubs,
      authClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

//for joining clubs on student side
router.get("/joinClubs", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // data
    const clubs = req.user.clubs;
    const authClubs = req.user.authClubs;

    // storing in the view only clubs array
    var viewOnlyClubs = [];
    clubs.forEach((club) => {
      var flag = 0;
      for (var i = 0; i < authClubs.length; i++) {
        if (authClubs[i].authClub == club.club) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        viewOnlyClubs.push(club.club);
      }
    });

    // fetch all clubs
    const allclubs = await club.find();

    // new clubs which the student is not a part of
    var newClubs = [];
    allclubs.forEach((allclub) => {
      var flag = 0;
      for (var i = 0; i < clubs.length; i++) {
        if (allclub.clubName == clubs[i].club) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        newClubs.push(allclub.clubName);
      }
    });

    // rendering the page with fetched details
    res.render("student/viewClubs", {
      user: req.user,
      newClubs,
      viewOnlyClubs,
      authClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// route for clubactivity
router.get(
  "/joinClubs/:club/clubActivity",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Student") {
        res.render("404.ejs");
      }

      // data
      const clubName = req.params.club;

      // finding the club with the given club name
      const form = await club.findOne({ clubName: clubName });

      // status of the members
      var status;
      if (form.members.includes(req.user.name)) {
        status = 1;
      }
      if (form.clubHeads.includes(req.user.name)) {
        status = 2;
      } else {
        status = 0;
      }

      // rendering page
      res.render("student/clubActivityPage.ejs", {
        user: req.user,
        form: form,
        clubName: clubName,
        status: status,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// member ship form page route
router.get(
  "/joinClubs/:club/membershipForm",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }

    // data
    const clubName = req.params.club;
    var teacherRejected;
    var rejectedMsg = "";
    var form1;
    var form2;
    var status;

    try {
      // finding the club with the given club name
      form1 = await club.findOne({ clubName: clubName });

      // findin the club head form with the user details and the club selected
      form2 = await clubHeadForm.find({
        owner: req.user.id,
        clubselected: clubName,
      });

      // setting proper statuses for proper conditions
      if (form2.length == 0) {
        status = 0;
      }

      if (form1.members.includes(req.user.name)) {
        status = 1;
      }

      if (form1.clubHeads.includes(req.user.name)) {
        status = 2;
      }

      if (form2.length != 0) {
        var last = form2.length - 1;

        if (form2[last].memberStatus == 200) {
          status = form2[last].memberStatus;
        }

        if (form2[last].memberStatus == 100) {
          status = form2[0].memberStatus;
        }

        status = form2[last].memberStatus;
        teacherRejected = form2[last].teacherrejected;
        rejectedMsg = form2[last].rejectedmessage;
      }

      // rendering page
      res.render("student/membershipForm.ejs", {
        user: req.user,
        form1: form1,
        status: status,
        teacherRejected: teacherRejected,
        rejectedMsg: rejectedMsg,
        form2: form2,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// post request for club membership form
router.post(
  "/:club/saveMembershipForm",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    try {
      const clubName = req.params.club;

      // creating new club head form
      const clubHeadFormData = new clubHeadForm({
        ...req.body,
        clubselected: clubName,
        owner: req.user._id,
      });

      // saving the form into database
      await clubHeadFormData.save();

      // update according to the position selected
      if (req.body.clubposition == "Authority User") {
        await clubHeadFormData.updateOne({ $set: { memberStatus: 200 } });
      } else {
        await clubHeadFormData.updateOne({ $set: { memberStatus: 100 } });
      }

      res.status(201);

      // rendering the page for animation
      res.render("student/afterAnimation.hbs");
    } catch (e) {
      res.status(400);
      console.log("Error: ", e);
    }
  }
);

module.exports = router;
