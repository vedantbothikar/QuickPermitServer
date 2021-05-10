// packages
const express = require("express");
const router = express.Router();

// Load models
const User = require("../../../models/User");
const Form = require("../../../models/form");
const club = require("../../../models/club");

// functionalities
const { createEvent } = require("../../../calendarback");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");
const { sendEmail } = require("../../../common_functionalities/MailSender");

// updating rejected reason for permission request
router.post("/submitReasonPermission", async (req, res) => {
  if (req.user.position !== "Teacher") {
    res.render("404.ejs");
  }

  // finding the form in database and then updating thr rejectedmessage value
  await Form.findByIdAndUpdate(req.body.id, {
    rejectedmessage: req.body.message,
  });
  res.status(200).send();
});

// requests page => filtering option for navbar
router.get(
  "/teacherdashboard/requests/:filter",
  ensureAuthenticated,
  async (req, res) => {
    try {
      // data
      const filter = req.params.filter;
      const teachername = req.user.name;

      // fetching all forms from datat base which are assigned to this particular user
      const allforms = await Form.find({
        teacherselected: teachername,
      });

      // filtering for approved forms
      if (filter == "approved") {
        const onlyapprovedforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherapproved.length - 1; i++) {
            if (form.teacherapproved[i] == teachername) {
              return true;
            }
          }
          return false;
        });

        // rendering approved forms
        res.render("subadmin/eventRequestsAll", {
          user: req.user,
          allforms: onlyapprovedforms,
        });
      }

      // filtering for pending forms
      if (filter == "pending") {
        const approvedallforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherapproved.length - 1; i++) {
            if (form.teacherapproved[i] == teachername) {
              return false;
            }
          }
          return true;
        });

        const finalforms = approvedallforms.filter((form) => {
          for (var i = 0; i <= form.teacherrejected.length - 1; i++) {
            if (form.teacherrejected[i] == teachername) {
              return false;
            }
          }
          return true;
        });

        // rendering
        res.render("subadmin/eventRequestsAll", {
          user: req.user,
          allforms: finalforms,
        });
      }

      // filtering for rejected forms
      if (filter == "rejected") {
        const onlyrejectedforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherrejected.length - 1; i++) {
            if (form.teacherrejected[i] == teachername) {
              return true;
            }
          }
          return false;
        });

        // rendering rejected forms
        res.render("subadmin/eventRequestsAll", {
          user: req.user,
          allforms: onlyrejectedforms,
        });
      }

      // filtering for all ttypes of forms
      if (filter == "all") {
        // rendering page with proper details of all forms
        res.render("subadmin/eventRequestsAll", {
          user: req.user,
          allforms: allforms,
        });
      }
    } catch (e) {
      res.status(404).send("error");
    }
  }
);

// club requests => with filtering for navbar
router.get(
  "/teacherdashboard/:club/requests/:filter",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const filter = req.params.filter;
      const teachername = req.user.name;
      const clubName = req.params.club;

      // fetching all forms
      const allforms = await Form.find({
        $and: [
          {
            teacherselected: teachername,
          },
          {
            clubselected: clubName,
          },
        ],
      });

      // filtering for approved forms
      if (filter == "approved") {
        const onlyapprovedforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherapproved.length - 1; i++) {
            if (form.teacherapproved[i] == teachername) {
              return true;
            }
          }
          return false;
        });

        // rendering
        res.render("subadmin/teacherPermissions", {
          user: req.user,
          allforms: onlyapprovedforms,
          clubName: clubName,
        });
      }

      // filtering for pending forms
      if (filter == "pending") {
        const approvedallforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherapproved.length - 1; i++) {
            if (form.teacherapproved[i] == teachername) {
              return false;
            }
          }
          return true;
        });

        const finalforms = approvedallforms.filter((form) => {
          for (var i = 0; i <= form.teacherrejected.length - 1; i++) {
            if (form.teacherrejected[i] == teachername) {
              return false;
            }
          }
          return true;
        });

        // rendering
        res.render("subadmin/teacherPermissions", {
          user: req.user,
          allforms: finalforms,
          clubName: clubName,
        });
      }

      // filtering for rejected forms
      if (filter == "rejected") {
        const onlyrejectedforms = allforms.filter((form) => {
          for (var i = 0; i <= form.teacherrejected.length - 1; i++) {
            if (form.teacherrejected[i] == teachername) {
              return true;
            }
          }
          return false;
        });

        // rendering
        res.render("subadmin/teacherPermissions", {
          user: req.user,
          allforms: onlyrejectedforms,
          clubName: clubName,
        });
      }

      // filtering for all forms
      if (filter == "all") {
        res.render("subadmin/teacherPermissions", {
          user: req.user,
          allforms: allforms,
          clubName: clubName,
        });
      }
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// club member details route
router.get(
  "/teacherdashboard/:clubName/clubmemberdetails",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.position !== "Teacher") {
      res.render("404.ejs");
    }

    // data
    const clubName = req.params.clubName;

    // finding on club by that given name
    const clubDetails = await club.findOne({
      clubName,
    });

    // rendering the page with details
    res.render("subadmin/club/clubmemberdetails", {
      user: req.user,
      club: clubDetails,
    });
  }
);

// club event details route
router.get(
  "/teacherdashboard/:clubName/clubeventdetails",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.position !== "Teacher") {
      res.render("404.ejs");
    }

    // data
    var clubName = req.params.clubName;
    var allforms = await Form.find();

    // finding that club with the given name
    const clubDetails = await club.findOne({
      clubName,
    });

    // getting all forms
    allforms = allforms.filter((form) => {
      if (form.teacherrejected.length == 0 && form.clubselected == clubName) {
        return true;
      }
      return false;
    });

    // rendering page with forms and club details
    res.render("subadmin/club/clubeventdetails", {
      user: req.user,
      club: clubDetails,
      allforms,
    });
  }
);

// saving report route
router.post("/saveReport", ensureAuthenticated, async (req, res) => {
  try {
    // generating new report
    const formdata = new Report({
      ...req.body,
      owner: req.user._id,
    });

    // saving to database
    await formdata.save();
    res.status(201);
    res.render("saveForm.hbs");
  } catch (e) {
    res.status(400);
    console.log("Error: ", e);
  }
});

// after clicking on approve
router.get(
  "/approvereq/:id/approved/:teacherName",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const teachername = req.params.teacherName;
      // _id is of form selected
      const _id = req.params.id;

      // fetching the form with that id and then updating the teacher approved array
      const form = await Form.findByIdAndUpdate(
        _id,
        {
          $push: {
            teacherapproved: teachername,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      //to send mail
      const owner = await User.findById(form.owner);
      var email = owner.email;
      var emailbody =
        "You have now been authorised to conduct the event " +
        form.eventName.toString();
      sendEmail(email, "Authorised", emailbody);

      res.render("subadmin/afterapproved.hbs", {
        redirectURL: `/teacherdashboard/`,
      });

      // condition -> when all teachers have approved the request then create an event in the calendar
      if (form.teacherselected.length === form.teacherapproved.length) {
        createEvent(
          form.dateforrequest,
          form.starthr,
          form.starthr,
          form.starthr,
          form.starthr,
          form.eventName,
          "pict",
          form.description
        );
      }
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// after teacher clicks on reject for event requests
router.get(
  "/approvereq/:id/rejected/:teacherName",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const teachername = req.params.teacherName;
      // _id is of form selected
      const _id = req.params.id;

      // fetching that form and then updating the teacher rejected array
      const form = await Form.findByIdAndUpdate(
        _id,
        {
          $push: {
            teacherrejected: teachername,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      // rendering next page
      res.render("subadmin/afterrejected.hbs", {
        formID: _id.toString(),
        redirectURL: "/teacherdashboard",
        submitReasonAt: "submitReasonPermission",
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

module.exports = router;
