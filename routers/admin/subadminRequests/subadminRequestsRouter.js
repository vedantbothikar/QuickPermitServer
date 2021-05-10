const express = require("express");
const router = express.Router();

// Load models
const User = require("../../../models/User");
const club = require("../../../models/club");
const teacherHeadForm = require("../../../models/teacherHeadForm");

//check Authentication
const { ensureAuthenticated } = require("../../../config/auth");

//mail sending
const { sendEmail } = require("../../../common_functionalities/MailSender");

//convert to subaadmin reason
router.post("/submitTeacherReason", async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }
    const form = await teacherHeadForm.findByIdAndUpdate(req.body.id, {
      rejectedMessage: req.body.message,
    });

    const user = req.user;
    res.render("admin/admindashboard.ejs", { user });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// route to get filter
router.get("/admindashboard/admin/:filter", async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const filter = req.params.filter;
    const allForms = await teacherHeadForm.find({});

    if (filter === "pending") {
      const Forms = allForms.filter((form) => {
        if (form.teacherStatus == 100) {
          return true;
        } else return false;
      });

      var pendingForms1 = [];
      for (var i = 0; i < Forms.length; i++) {
        var owner = await User.findById({ _id: Forms[i].owner });
        pendingForms1.push({ Forms, owner });
      }

      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: pendingForms1,
      });
    }

    //approved forms
    if (filter === "approved") {
      const Forms = allForms.filter((form) => {
        if (form.teacherStatus == 1) {
          return true;
        } else return false;
      });

      var approvedForms1 = [];
      for (var i = 0; i < Forms.length; i++) {
        var owner = await User.findById({ _id: Forms[i].owner });
        approvedForms1.push({ Forms, owner });
      }

      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: approvedForms1,
      });
    }

    //rejected forms
    if (filter === "rejected") {
      const Forms = allForms.filter((form) => {
        if (form.teacherStatus === -1) {
          return true;
        } else return false;
      });

      var rejectedForms1 = [];
      for (var i = 0; i < Forms.length; i++) {
        var owner = await User.findById({ _id: Forms[i].owner });
        rejectedForms1.push({ Forms, owner });
      }

      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: rejectedForms1,
      });
    }

    //all forms
    if (filter === "all") {
      var Forms = allForms;
      var allForms1 = [];
      for (var i = 0; i < Forms.length; i++) {
        var owner = await User.findById({ _id: Forms[i].owner });
        allForms1.push({ Forms, owner });
      }
      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: allForms1,
      });
    }
  } catch (e) {
    res.status(404);
    console.log("Error:", e);
  }
});

// to view particular request(sub-admin)
router.get("/approveadminreq/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const _id = req.params.id;

    // _id is of the teacherheadFormRequest
    const form = await teacherHeadForm.findById(_id);

    const owner = await User.findById(form.owner);
    const edate = form.dateforrequest;
    const dd = String(edate.getDate()).padStart(2, "0");
    const mm = String(edate.getMonth() + 1).padStart(2, "0");
    const yyyy = edate.getFullYear();

    res.render("admin/adminapprovalpage.hbs", {
      dd,
      mm,
      yyyy,
      form: form,
      owner: owner,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// after clicking on approve for admin
router.get(
  "/approveadminreq/:id/approved",
  ensureAuthenticated,
  async (req, res) => {
    const _id = req.params.id;

    try {
      if (req.user.email !== "admin@gmail.com") {
        res.render("404.ejs");
      }

      //update in teacherHeads collection
      const form = await teacherHeadForm.findOneAndUpdate(
        { _id },
        { $set: { teacherStatus: 1 } },
        { new: true, runValidators: true }
      );

      const owner = await User.findById(form.owner);
      const email = owner.email;

      //send mail
      var emailbody =
        "You have now been authorised as club guardian for " +
        form.clubSelected.toString();
      sendEmail(email, "Authorised", emailbody);

      // update in clubs Collection
      const form1 = await club.findOneAndUpdate(
        { clubName: form.clubSelected },
        { $push: { teacherHeads: owner.name } },
        { new: true, runValidators: true }
      );

      owner.authClubs = owner.authClubs.concat({ authClub: form.clubSelected });
      await owner.save();
      res.render("admin/afteradminapproved.hbs");
    } catch (e) {
      res.status(500);
      console.log("Error : " + e);
    }
  }
);

// after clicking on reject for admin
router.get(
  "/approveadminreq/:id/rejected",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.email !== "admin@gmail.com") {
        res.render("404.ejs");
      }

      const _id = req.params.id;
      const form = await teacherHeadForm.findByIdAndUpdate(
        { _id },
        { $set: { teacherStatus: -1 } },
        { new: true, runValidators: true }
      );

      res.render("admin/afteradminrejected.hbs", {
        userID: _id.toString(),
      });
    } catch (e) {
      res.status(404);
      console.log("Error : " + e);
    }
  }
);

module.exports = router;
