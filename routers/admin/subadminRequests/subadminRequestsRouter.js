const express = require("express");
const router = express.Router();
// Load User model
const User = require("../../../models/User");
const Form = require("../../../models/form");
const clubHeadForm = require("../../../models/clubHeadForm");
const club = require("../../../models/club");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");
const { findById } = require("../../../models/form");
const path = require("path");
const { db } = require("../../../models/form");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const teacherHeadForm = require("../../../models/teacherHeadForm");
const { sendEmail } = require("../../../common_functionalities/MailSender");
const { createCipher } = require("crypto");

//convert to subaadmin reason
router.post("/submitTeacherReason", async (req, res) => {
  // console.log(req.body);
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const form = await teacherHeadForm.findByIdAndUpdate(req.body.id, {
      rejectedMessage: req.body.message,
    });

    // await User.findByIdAndUpdate(req.body.id, {rejectedreason: req.body.message});
    // res.status(200);
    const user = req.user;
    res.render("admin/admindashboard.ejs", { user });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

router.get("/admindashboard/admin/:filter", async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const filter = req.params.filter;
    // console.log(filter)

    const allForms = await teacherHeadForm.find({});

    // console.log(allForms)

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

      // console.log(pendingForms1)
      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: pendingForms1,
      });
    }

    //approved
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

      // console.log(approvedForms1)

      res.render("admin/adminSubadminRequest.ejs", {
        user: req.user,
        allForms: approvedForms1,
      });
    }

    //rejected
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

    //all
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

    //==================akash=====================//
    // _id is of the teacherheadFormRequest
    const form = await teacherHeadForm.findById(_id);

    const owner = await User.findById(form.owner);

    // console.log(owner)
    //==================akash=====================//

    // const ownerid = form.owner;
    // console.log(ownerid);

    // const ownercred = await User.findById(ownerid);
    // console.log(ownercred);

    const edate = form.dateforrequest;
    const dd = String(edate.getDate()).padStart(2, "0");
    const mm = String(edate.getMonth() + 1).padStart(2, "0");
    const yyyy = edate.getFullYear();

    // var disabled = "no";
    //   if (user.adminStatus == 1 || user.adminStatus==-1)
    //   {
    //     disabled = "yes";
    //   }

    res.render("admin/adminapprovalpage.hbs", {
      // user,
      dd,
      mm,
      yyyy,
      // disabled,
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

      // console.log(form)

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
      // console.log(form1)
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

      //_id is of teacherHeadForm

      const _id = req.params.id;
      // _id is of user selected

      // const user = await User.findByIdAndUpdate(
      //   _id,
      //   { adminStatus:-1},
      //   { new: true, runValidators: true }
      // );
      // console.log(_id.toString())

      const form = await teacherHeadForm.findByIdAndUpdate(
        { _id },
        { $set: { teacherStatus: -1 } },
        { new: true, runValidators: true }
      );

      // console.log(form2)
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
