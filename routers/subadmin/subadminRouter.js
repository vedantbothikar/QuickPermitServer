// packages
const express = require("express");
const router = express.Router();

// Load models
const User = require("../../models/User");
const club = require("../../models/club");
const teacherHeadForm = require("../../models/teacherHeadForm");
const Report = require("../../models/report");

// functionalities
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../config/auth");

// Route to send request to be teacher coordinator => sending this to admin
router.get("/requestforadmin", async (req, res) => {
  if (req.user.position !== "Teacher") {
    res.render("404.ejs");
  }

  await User.findByIdAndUpdate(req.user._id, { adminStatus: 0 });
  res.redirect("/teacherdashboard");
});

// teacher dashboard route
router.get("/teacherdashboard", ensureAuthenticated, async (req, res) => {
  if (req.user.position !== "Teacher") {
    res.render("404.ejs");
  }

  // rendering subadmin dashboard page
  res.render("subadmin/teacherdashboard.ejs", {
    user: req.user,
    approved: req.user.approved,
    authClubs: req.user.authClubs,
  });
});

//for becoming guardian of a club =>  teacher side
router.get("/clubGuardian", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Teacher") {
      res.render("404.ejs");
    }

    // data
    const allclubs = await club.find();
    const authClubs = req.user.authClubs;

    // non auth clubs
    var newClubs = [];
    allclubs.forEach((allclub) => {
      var flag = 0;
      for (var i = 0; i < authClubs.length; i++) {
        if (allclub.clubName == authClubs[i].authClub) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        newClubs.push(allclub.clubName);
      }
    });

    // rendering subadmin page
    res.render("subadmin/viewClubGuardian", {
      user: req.user,
      authClubs: req.user.authClubs,
      newClubs,
    });
  } catch (e) {
    console.log("Error", e);
    res.status(404).send();
  }
});

//club Activity page
router.get(
  "/joinClubs/:club/clubActivityG",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const clubName = req.params.club;

      // finding the form from database that has this particular clubname
      const form = await club.findOne({ clubName: clubName });

      // if that teacher is a teacherHead of that club
      var status = 0;
      if (form.teacherHeads.includes(req.user.name)) {
        status = 1;
      } else {
        status = 0;
      }

      // rendering club activity page
      res.render("subadmin/clubActivityPage", {
        user: req.user,
        clubName: clubName,
        status: status,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// join club page for subadmin => form for being club guardian
router.get(
  "/joinClubs/:club/clubGuardianForm",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }
      // data
      const clubName = req.params.club;

      // database queries
      const form = await club.findOne({ clubName: clubName });
      const form2 = await teacherHeadForm.findOne({
        owner: req.user.id,
        clubSelected: clubName,
      });

      // setting proper status
      var status;

      if (form2 == null) {
        status = 0;
      }
      if (form2 != null) {
        status = form2.teacherStatus;
        var rejectedMsg = form2.rejectedMessage;
      }
      if (form.teacherHeads.includes(req.user.name)) {
        status = 1;
      }

      // redering page
      res.render("subadmin/clubGuardianForm.ejs", {
        user: req.user,
        clubName: clubName,
        status: status,
        rejectedMsg: rejectedMsg,
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// post request for saving club uardian form in database
router.post(
  "/:club/saveClubGuardianForm",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const clubName = req.params.club;

      // creating new form model
      const form2 = new teacherHeadForm({
        clubSelected: clubName,
        owner: req.user._id,
      });

      // saving form in database
      await form2.save();

      // upadate teacher status
      await form2.updateOne({ $set: { teacherStatus: 100 } });

      res.status(201);
      // redering page
      res.render("subadmin/afterAnimation.hbs");
    } catch (e) {
      res.status(400, e);
    }
  }
);

// generating report route
router.get(
  "/teacherdashboard/:clubName/clubeventdetails/:eventName/report",
  ensureAuthenticated,
  async (req, res) => {
    // data
    var clubName = req.params.clubName;
    const eventName = req.params.eventName;

    // finding that particular club
    const clubReq = await club.findOne({
      clubName,
    });

    // rendering page with the details
    res.render("subadmin/club/clubEventReport", {
      user: req.user,
      club: clubReq,
      event: eventName,
    });
  }
);

// saving report route
router.post("/saveReport", async (req, res) => {
  try {
    console.log(req.body);

    // data
    const elements = req.body.name.length;

    const {
      eventName,
      eventCoordinator,
      organizedBy,
      techRegistrations,
      nontechRegistrations,
      description,
      eventStartDate,
      eventEndDate,
      eventParticipants,
      name,
      winners,
      participants,
      startDate,
      endDate,
    } = req.body;

    const subevent = [];
    for (var i = 0; i < elements; i++) {
      var obj = {
        name: name[i],
        winners: winners[i],
        participants: participants[i],
        startDate: startDate[i],
        endDate: endDate[i],
      };
      subevent.push(obj);
    }

    const formdata = new Report({
      eventName,
      eventCoordinator,
      organizedBy,
      techRegistrations,
      nontechRegistrations,
      description,
      eventStartDate,
      eventEndDate,
      eventParticipants,
      subevents: subevent,
      owner: req.user._id,
    });

    console.log(formdata);

    await formdata.save();
    res.status(201);
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});

module.exports = router;
