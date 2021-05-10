const express = require("express");
const router = express.Router();
// Load User model
const User = require("../../models/User");
const Form = require("../../models/form");
const clubHeadForm = require("../../models/clubHeadForm");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../config/auth");
const { findById } = require("../../models/form");
const { findOne } = require("../../models/User");
const { findOneAndUpdate } = require("../../models/User");
const path = require("path");
const { db } = require("../../models/form");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const club = require("../../models/club");
const CreateUser = require("../../models/jsoncreateusers");

// router.get("/showclubs",(req,res)=>)
// add delete user

router.get("/viewallteachers", ensureAuthenticated, async (req, res) => {
  const teachers = await User.find({ position: "Teacher" });

  // clubs
  var teacherclubs = [];
  var singleteacherclubs = [];

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

  for (var i = 0; i < teachers.length; i++) {
    var singleteacherauthclubs = [];
    for (var j = 0; j < teachers[i].authClubs.length; j++) {
      singleteacherauthclubs.push(teachers[i].authClubs[j].authClub);
    }
    teacherauthclubs.push(singleteacherauthclubs);
  }

  res.render("admin/viewallteachers", {
    teachers: teachers,
    teacherclubs: teacherclubs,
    teacherauthclubs: teacherauthclubs,
    user: user,
  });
  // res.render("admin/addDeleteUser", {
  //   user: req.user,
  // });
});

router.get("/viewallstudents", ensureAuthenticated, async (req, res) => {
  const students = await User.find({ position: "Student" });

  // clubs
  var studentclubs = [];
  var singlestudentclubs = [];

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

  for (var i = 0; i < students.length; i++) {
    var singlestudentauthclubs = [];
    for (var j = 0; j < students[i].authClubs.length; j++) {
      singlestudentauthclubs.push(students[i].authClubs[j].authClub);
    }
    studentauthclubs.push(singlestudentauthclubs);
  }

  res.render("admin/viewallstudents", {
    students: students,
    studentclubs: studentclubs,
    studentauthclubs: studentauthclubs,
    user: user,
  });
});

router.get("/addDeleteUser", ensureAuthenticated, (req, res) => {
  // only admin should be able to delete users
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  if (req.user.email == "admin@gmail.com") {
    res.render("admin/addDeleteUser", {
      user: req.user,
    });
  } else {
    res.status(404);
  }
});

router.get("/afteruserremoved/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const regid = req.params.id;

    const usertodel = await User.findOne({
      regid: regid,
    });

    if (!usertodel) {
      res.render("admin/nouserexists");
    }

    // sendCancelationEmail(req.user.email, req.user.name);
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

router.get("/afterconfirmation/:id", ensureAuthenticated, async (req, res) => {
  try {
    const regid = req.params.id;
    await User.findOneAndDelete({
      regid: regid,
    });
    // sendCancelationEmail(req.user.email, req.user.name);
    res.render("admin/afteruserremoved");
    res.status(200);
  } catch (e) {
    res.status(500);
    console.log("Error: ", e);
  }
});
// add delete user ends

router.get("/admindashboard", ensureAuthenticated, (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  res.render("admin/admindashboard.ejs", {
    user: req.user,
  });
});

router.get("/createNewClub", ensureAuthenticated, async (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }
  const teachers = await User.find({ position: "Teacher" });
  const teachernames = [];

  for (var i = 0; i < teachers.length; i++) {
    teachernames.push(teachers[i].name);
  }

  res.render("admin/clubCreationForm.ejs", {
    user: req.user,
    teachernames: teachernames,
  });
});

router.post("/savenewclub", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const newClub = new club({
      ...req.body,
    });
    await newClub.save();
    if (req.body.teacherHeads) {
      const { teacherHeads, clubName } = newClub;
      console.log(teacherHeads);
      for (var i = 0; i < teacherHeads.length; i++) {
        const user = await User.findOneAndUpdate(
          { name: teacherHeads[i] },
          {
            $push: { authClubs: { authClub: clubName } },
          },
          { new: true, runValidators: true }
        );
        // console.log(user.name)
      }
    }
    res.render("admin/afterAnimation.hbs");
  } catch (e) {
    console.log(e);
    res.status(404);
  }
});

router.get(
  "/aftersavingClub/:clubName",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const club = req.params.clubName;

    const form1 = new clubForm({
      clubName: club,
    }); //////??????????clubform kasa kay asel...club..@AKAS
    await form1.save();

    res.render("saveForm.hbs");
  }
);

//to view all clubs overview
router.get("/adminclubsoverview", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const clubs = await club.find();
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

    const clubName = req.params.clubName;

    var allforms = await Form.find();
    var clubDetails = await club.findOne({
      clubName,
    });

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

//to view various details
router.get(
  "/viewclub/:clubName/details/:type",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.email !== "admin@gmail.com") {
        res.render("404.ejs");
      }

      var clubName = req.params.clubName;
      var allforms = await Form.find();
      const clubDetails = await club.findOne({
        clubName,
      });
      var type = req.params.type;
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

router.get(
  "/viewclub/:clubName/createNewEvent",
  ensureAuthenticated,
  (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const clubName = req.params.clubName;
    res.render("admin/createEvent.ejs", {
      clubName,
      user: req.user,
    });
  }
);

router.post("/saveAdminEventForm", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const newEvent = new Form({
      ...req.body,
      owner: req.user._id,
    });
    await newEvent.save();
    res.render("admin/afterAnimation.hbs");
  } catch (e) {
    res.status(404);
  }
});

router.get("/createUser", ensureAuthenticated, (req, res) => {
  res.render("admin/createUser");
});

router.get("/reportsheet", (req, res) => {
  res.render("admin/report/uploadexcel.ejs");
});

router.post("/createUser", ensureAuthenticated, (req, res) => {
  const { name, email, password, password2, regid, position, year } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({
      msg: "Please enter all fields",
    });
  }

  if (password != password2) {
    errors.push({
      msg: "Passwords do not match",
    });
    res.render("home/register", {
      errors,
      name,
      email,
      password,
      password2,
      regid,
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: "Password must be at least 6 characters",
    });
  }

  if (errors.length > 0) {
    res.render("admin/createUser", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    User.findOne({
      $or: [{ email: email }, { regid: regid.toLowerCase() }],
    }).then((user) => {
      if (user) {
        errors.push({
          msg: "Email or Registration ID already exists",
        });
        res.render("admin/createUser", {
          errors,
          name,
          email,
          password,
          password2,
          regid,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          regid,
          position,
          year,
          approved: "approved",
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                req.flash("success_msg", "Account Created");
                res.redirect("/admindashboard");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

module.exports = router;
