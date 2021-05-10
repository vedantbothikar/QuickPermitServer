const express = require("express");
const router = new express.Router();
const Form = require("../../models/form");
const User = require("../../models/User");

// Load User model
const { ensureAuthenticated } = require("../../config/auth");
const clubHeadForm = require("../../models/clubHeadForm");
const club = require("../../models/club");
const leaveApplicationForm = require("../../models/leaveApplicationForm");

router.get("/permissionform", ensureAuthenticated, (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    res.render("student/permissionform.ejs", {
      user: req.user,
      authClubs: req.user.authClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

router.get("/:club/permissionform", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    const clubName = req.params.club;

    // console.log(clubName);
    const form = await club.findOne({ clubName: clubName });

    res.render("student/permissionform.ejs", {
      user: req.user,
      form,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

router.get("/leaveApplicationForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    const allteachers = await User.find({ position: "Teacher" });

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

router.post("/saveForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    const formdata = new Form({
      ...req.body,
      owner: req.user._id,
    });
    await formdata.save();
    res.status(201);
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});



router.post("/saveClubHeadForm", ensureAuthenticated, async (req, res) => {
  try {
    const clubHeadFormData = new clubHeadForm({
      ...req.body,
      owner: req.user._id,
    });
    await clubHeadFormData.save();
    res.status(201);
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});

router.get("/clubHeadForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    const clubs = req.user.clubs;
    const authClubs = req.user.authClubs;
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
    console.log(showClubs);
    res.render("student/clubHeadForm.ejs", {
      user: req.user,
      showClubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// router.post("/saveClubHeadForm", ensureAuthenticated, async (req, res)=>{
//   console.log(req.body)
//   const clubHeadFormData = new clubHeadForm({
//     ...req.body,
//     owner: req.user._id
//   });
//   console.log(clubHeadFormData)
//   try {
//     await clubHeadFormData.save();
//     console.log("yes")
//     res.status(201);
//   } catch (e) {
//     res.status(400).send("unable to save", e);
//   }

//   res.render("saveForm.hbs");
// })

router.post("/saveLeaveForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Student") {
      res.render("404.ejs");
    }
    const leaveFormData = new leaveApplicationForm({
      ...req.body,
      owner: req.user._id,
    });

    await leaveFormData.save();
    console.log("Hello")
    res.status(201);
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
