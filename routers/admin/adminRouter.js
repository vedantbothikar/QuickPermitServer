// packages
const express = require("express");
const router = express.Router();

const path = require("path");
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Load models
const User = require("../../models/User");
const Form = require("../../models/form");
const { db } = require("../../models/form");
const { findById } = require("../../models/form");
const { findOne } = require("../../models/User");
const { findOneAndUpdate } = require("../../models/User");
const club = require("../../models/club");
const CreateUser = require("../../models/jsoncreateusers");

// functionalities
const clubHeadForm = require("../../models/clubHeadForm");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../config/auth");

// route for viewing all teachers
router.get("/viewallteachers", ensureAuthenticated, async (req, res) => {
  const teachers = await User.find({ position: "Teacher" });

  // clubs
  var teacherclubs = [];
  var singleteacherclubs = [];

  // logic to get appropriate teachers
  for (var i = 0; i < teachers.length; i++) {
    var singleteacherclubs = [];

    for (var j = 0; j < teachers[i].clubs.length; j++) {
      singleteacherclubs.push(teachers[i].clubs[j].club);
    }
    teacherclubs.push(singleteacherclubs);
  }
  const user = req.user;

  // auth clubs
  var teacherauthclubs = [];
  var singleteacherauthclubs = [];

  // logic to get appropriate teachers

  for (var i = 0; i < teachers.length; i++) {
    var singleteacherauthclubs = [];
    for (var j = 0; j < teachers[i].authClubs.length; j++) {
      singleteacherauthclubs.push(teachers[i].authClubs[j].authClub);
    }
    teacherauthclubs.push(singleteacherauthclubs);
  }

  // rendering view all teachers page with teachers information
  res.render("admin/viewallteachers", {
    teachers: teachers,
    teacherclubs: teacherclubs,
    teacherauthclubs: teacherauthclubs,
    user: user,
  });
});

// view all students route
router.get("/viewallstudents", ensureAuthenticated, async (req, res) => {
  const students = await User.find({ position: "Student" });

  // clubs
  var studentclubs = [];
  var singlestudentclubs = [];

  // logic to get appropriate students

  for (var i = 0; i < students.length; i++) {
    var singlestudentclubs = [];

    for (var j = 0; j < students[i].clubs.length; j++) {
      singlestudentclubs.push(students[i].clubs[j].club);
    }
    studentclubs.push(singlestudentclubs);
  }
  const user = req.user;

  // auth clubs
  var studentauthclubs = [];
  var singlestudentauthclubs = [];

  // logic to get appropriate students

  for (var i = 0; i < students.length; i++) {
    var singlestudentauthclubs = [];
    for (var j = 0; j < students[i].authClubs.length; j++) {
      singlestudentauthclubs.push(students[i].authClubs[j].authClub);
    }
    studentauthclubs.push(singlestudentauthclubs);
  }

  // rendering view all students page with all students information
  res.render("admin/viewallstudents", {
    students: students,
    studentclubs: studentclubs,
    studentauthclubs: studentauthclubs,
    user: user,
  });
});

// manage users page route
router.get("/addDeleteUser", ensureAuthenticated, (req, res) => {
  // only admin should be able to delete users
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  // just render the page if user is admin
  if (req.user.email == "admin@gmail.com") {
    res.render("admin/addDeleteUser", {
      user: req.user,
    });
  } else {
    res.status(404);
  }
});

// after user is removed by admin rendering this page with this route
router.get("/afteruserremoved/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // data
    const regid = req.params.id;

    // find a user with that entered registration id
    const usertodel = await User.findOne({
      regid: regid,
    });

    // if there doens't exist any user with the given registration id then render no user exist page
    if (!usertodel) {
      res.render("admin/nouserexists");
    }

    // return json response
    res.json({
      status: "success",
      username: usertodel.name.toString(),
      id: usertodel.regid.toString(),
      email: usertodel.email.toString(),
      position: usertodel.position.toString(),
    });
  } catch (e) {
    res.status(500);
    console.log("Error:", e);
  }
});

// after confirmation to delete the user from database
router.get("/afterconfirmation/:id", ensureAuthenticated, async (req, res) => {
  try {
    // data
    const regid = req.params.id;

    // finding that user with that id and then deleting it from the database
    await User.findOneAndDelete({
      regid: regid,
    });

    // rendering page
    res.render("admin/afteruserremoved");
    res.status(200);
  } catch (e) {
    res.status(500);
    console.log("Error: ", e);
  }
});

// admin dashboard page route
router.get("/admindashboard", ensureAuthenticated, (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  res.render("admin/admindashboard.ejs", {
    user: req.user,
  });
});

// creating new club by admin route
router.get("/createNewClub", ensureAuthenticated, async (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  // find all the teachers in database
  const teachers = await User.find({ position: "Teacher" });
  const teachernames = [];

  // getting just the teacher names in teachernames array
  for (var i = 0; i < teachers.length; i++) {
    teachernames.push(teachers[i].name);
  }

  // render the page with teacher names
  res.render("admin/clubCreationForm.ejs", {
    user: req.user,
    teachernames: teachernames,
  });
});

// save the new club created using this route
router.post("/savenewclub", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // create new club model
    const newClub = new club({
      ...req.body,
    });

    // save club to database
    await newClub.save();
    if (req.body.teacherHeads) {
      // data
      const { teacherHeads, clubName } = newClub;

      // updating
      for (var i = 0; i < teacherHeads.length; i++) {
        const user = await User.findOneAndUpdate(
          { name: teacherHeads[i] },
          {
            $push: { authClubs: { authClub: clubName } },
          },
          { new: true, runValidators: true }
        );
      }
    }

    // rendering
    res.render("admin/afterAnimation.hbs");
  } catch (e) {
    console.log(e);
    res.status(404);
  }
});

// route after saving the new club
router.get(
  "/aftersavingClub/:clubName",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // take the club name from parameters
    const club = req.params.clubName;

    // creating new form for club creation
    const form1 = new clubForm({
      clubName: club,
    });
    await form1.save();

    // rendering animation
    res.render("saveForm.hbs");
  }
);

// to view all clubs overview
router.get("/adminclubsoverview", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // find all clubs
    const clubs = await club.find();

    // render with data of all clubs
    res.render("admin/viewClubsOverview", {
      user: req.user,
      clubs: clubs,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

//to view individual club
router.get("/viewclub/:clubName", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // get that name of specific club
    const clubName = req.params.clubName;

    // get all permission forms sent in the name of this club
    var allforms = await Form.find();

    // find a club by the name of club name received in params
    var clubDetails = await club.findOne({
      clubName,
    });

    // render
    res.render("admin/clubDetails", {
      user: req.user,
      club: clubDetails,
      status: 2,
      allforms,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

//status 2 = no details selected(default)
//status 0 = club details
//status 1 = event details

// route to view various details
router.get(
  "/viewclub/:clubName/details/:type",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.email !== "admin@gmail.com") {
        res.render("404.ejs");
      }

      // data
      var clubName = req.params.clubName;
      var allforms = await Form.find();

      // find one club with the club name received
      const clubDetails = await club.findOne({
        clubName,
      });
      var type = req.params.type;

      // render page as required
      if (type == "clubdetails") {
        res.render("admin/clubDetails", {
          user: req.user,
          club: clubDetails,
          status: 0,
          allforms,
        });
      } else if (type == "clubeventdetails") {
        allforms = allforms.filter((form) => {
          if (
            form.teacherrejected.length == 0 &&
            form.clubselected == clubName
          ) {
            return true;
          }
          return false;
        });
        res.render("admin/clubDetails", {
          user: req.user,
          club: clubDetails,
          status: 1,
          allforms,
        });
      }
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// view club create new event
router.get(
  "/viewclub/:clubName/createNewEvent",
  ensureAuthenticated,
  (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // take the club name from parameters
    const clubName = req.params.clubName;
    res.render("admin/createEvent.ejs", {
      clubName,
      user: req.user,
    });
  }
);

// save form wwhen admin creates an event
router.post("/saveAdminEventForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    // create a new form
    const newEvent = new Form({
      ...req.body,
      owner: req.user._id,
    });

    // save form
    await newEvent.save();
    res.render("admin/afterAnimation.hbs");
  } catch (e) {
    res.status(404);
  }
});

// creating user page
router.get("/createUser", ensureAuthenticated, (req, res) => {
  res.render("admin/createUser");
});

module.exports = router;
