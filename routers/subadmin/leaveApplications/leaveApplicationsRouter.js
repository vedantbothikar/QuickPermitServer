// packages
const express = require("express");
const router = express.Router();

// Models
const leaveApplicationForm = require("../../../models/leaveApplicationForm");
const User = require("../../../models/User");

// functionalities
const { sendEmail } = require("../../../common_functionalities/MailSender");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");

// Leave Application Reason post route
router.post("/submitLeaveReason", async (req, res) => {
  if (req.user.position !== "Teacher") {
    res.render("404.ejs");
  }

  // finding the application form in database - if found, update it
  await leaveApplicationForm.findByIdAndUpdate(req.body.id, {
    rejectedmessage: req.body.message,
  });
  res.status(200).send();
});

// Displaying leave applications on teacher side
router.get(
  "/teacherdashboard/leaveApplications/:filter",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const filter = req.params.filter;
      const teachername = req.user.name;

      // finding leave Application form which are assigned to that particular teacher
      const allforms = await leaveApplicationForm.find({
        teacherselected: teachername,
      });

      // filtering for the nav bar
      if (filter == "approved") {
        const approvedforms = allforms.filter((form) => {
          if (form.status === "approved") {
            return true;
          } else return false;
        });

        // storing all approved forms in an array
        var approvedForms = [];
        for (var i = 0; i < approvedforms.length; i++) {
          var ownerName = await User.findById({ _id: approvedforms[i].owner });
          approvedForms.push({
            ...approvedforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering the page by passing all approved forms
        res.render("subadmin/teacherLeaveForms", {
          user: req.user,
          allforms: approvedForms,
        });
      }

      // when status is pending => when user wants all pending forms

      if (filter == "pending") {
        const pendingforms = allforms.filter((form) => {
          if (form.status === "pending") {
            return true;
          } else return false;
        });

        // storing pending forms in the array
        var pendingForms = [];
        for (var i = 0; i < pendingforms.length; i++) {
          var ownerName = await User.findById({ _id: pendingforms[i].owner });
          pendingForms.push({
            ...pendingforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering the page by passing all pending forms
        res.render("subadmin/teacherLeaveForms", {
          user: req.user,
          allforms: pendingForms,
        });
      }

      if (filter == "rejected") {
        const rejectedforms = allforms.filter((form) => {
          if (form.status === "rejected") {
            return true;
          } else return false;
        });

        // storing rejected forms in the array
        var rejectedForms = [];
        for (var i = 0; i < rejectedforms.length; i++) {
          var ownerName = await User.findById({ _id: rejectedforms[i].owner });
          rejectedForms.push({
            ...rejectedforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering the page by passing all pending forms
        res.render("subadmin/teacherLeaveForms", {
          user: req.user,
          allforms: rejectedForms,
        });
      }

      // if user wants to see all types of forms
      if (filter == "all") {
        var allForms = [];
        for (var i = 0; i < allforms.length; i++) {
          var ownerName = await User.findById({ _id: allforms[i].owner });
          allForms.push({
            ...allforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering the page
        res.render("subadmin/teacherLeaveForms", {
          user: req.user,
          allforms: allForms,
        });
      }
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// to view particular request(form)
router.get("/approveLeaveReq/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.position !== "Teacher") {
      res.render("404.ejs");
    }

    // data
    const teachername = req.user.name;
    const _id = req.params.id;

    // finding that form
    const form = await leaveApplicationForm.findById(_id);
    const ownerid = form.owner;

    // finding the user credentials
    const ownercred = await User.findById(ownerid);

    // data
    var sdate = form.datefrom;
    var sday = String(sdate.getDate()).padStart(2, "0");
    var smonth = String(sdate.getMonth() + 1).padStart(2, "0");
    var syear = sdate.getFullYear();

    var edate = form.dateto;
    var eday = String(edate.getDate()).padStart(2, "0");
    var emonth = String(edate.getMonth() + 1).padStart(2, "0");
    var eyear = edate.getFullYear();

    // diabling the buttons
    var disabled = "no";
    for (var i = 0; i < form.teacherapproved.length; i = i + 1) {
      if (form.teacherapproved[i] == teachername) {
        disabled = "yes";
      }
    }

    // diabling the buttons
    for (var i = 0; i < form.teacherrejected.length; i = i + 1) {
      if (form.teacherrejected[i] == teachername) {
        disabled = "yes";
      }
    }

    // rendering the page with proper data
    res.render("subadmin/openLeaveForm.ejs", {
      user: req.user,
      form,
      teachername,
      ownercred,
      sday,
      smonth,
      syear,
      eday,
      emonth,
      eyear,
      disabled,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// after clicking on approve
router.get(
  "/approveLeaveReq/:id/approved/:teacherName",
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

      // finding leave application form from database and then updating
      const form = await leaveApplicationForm.findByIdAndUpdate(
        _id,
        { $push: { teacherapproved: teachername } },
        { new: true, runValidators: true }
      );

      if (form.teacherrejected.length == 0) {
        await leaveApplicationForm.findByIdAndUpdate(
          _id,
          { $set: { status: "approved" } },
          { runValidators: true }
        );
      }

      //sending mail
      const owner = await User.findById(form.owner);
      var email = owner.email;
      var emailbody =
        "You have now been authorised for your leave from " +
        form.datefrom.toString() +
        " to " +
        form.dateto.toString();
      sendEmail(email, "Authorised", emailbody);
      res.render("subadmin/afterapproved.hbs", {
        redirectURL: "/teacherdashboard/leaveApplications/pending",
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

// after teacher clicks on reject for event requests
router.get(
  "/approveLeaveReq/:id/rejected/:teacherName",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      //data
      const teachername = req.params.teacherName;
      // _id is of form selected
      const _id = req.params.id;

      // finding the leave application form and then updating status to rejected
      const form = await leaveApplicationForm.findByIdAndUpdate(
        _id,
        {
          $push: { teacherrejected: teachername },
          $set: { status: "rejected" },
        },
        { new: true, runValidators: true }
      );

      // rendering the page with proper details
      res.render("subadmin/afterrejected.hbs", {
        formID: _id.toString(),
        redirectURL: "/teacherdashboard/leaveApplications/pending",
        submitReasonAt: "submitLeaveReason",
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

module.exports = router;
