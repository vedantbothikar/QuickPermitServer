const express = require("express");
const router = express.Router();
// Load User model
const User = require("../../../models/User");
const Form = require("../../../models/form");
const clubHeadForm = require("../../../models/clubHeadForm");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");
const { findById } = require("../../../models/form");
const path = require("path");
const { sendEmail } = require("../../../common_functionalities/MailSender");
const { db } = require("../../../models/form");
const bcrypt = require("bcryptjs");
const passport = require("passport");

router.post("/submituserReason", async (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  await User.findByIdAndUpdate(req.body.id, {
    rejectedreason: req.body.message,
  });
  res.status(200);
});

router.get(
  "/admindashboard/user/:filter",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.email !== "admin@gmail.com") {
        res.render("404.ejs");
      }

      const filter = req.params.filter;
      const approvedstatus = req.user.approved;
      const adminStatus = req.user.adminStatus;

      const allforms = await User.find({});

      if (filter == "approved") {
        const onlyapprovedforms = allforms.filter((form) => {
          if (form.approved == "approved") {
            return true;
          }
          return false;
        });

        res.render("admin/adminUserRequest", {
          user: req.user,
          allforms: onlyapprovedforms,
        });
      }

      if (filter == "pending") {
        const pendingforms = allforms.filter((form) => {
          if (form.approved == "pending") {
            return true;
          }
          return false;
        });

        res.render("admin/adminUserRequest", {
          user: req.user,
          allforms: pendingforms,
        });
      }

      if (filter == "rejected") {
        const onlyrejectedforms = allforms.filter((form) => {
          if (form.approved == "rejected") {
            return true;
          }
          return false;
        });

        res.render("admin/adminUserRequest", {
          user: req.user,
          allforms: onlyrejectedforms,
        });
      }

      if (filter == "all") {
        res.render("admin/adminUserRequest", {
          user: req.user,
          allforms: allforms,
        });
      }
    } catch (e) {
      res.status(404);
      console.log("Error:", e);
    }
  }
);

// to view particular request(user)
router.get("/approveuserreq/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    const _id = req.params.id;
    const user = await User.findById(_id);

    var edate = user.date;
    var dd = String(edate.getDate()).padStart(2, "0");
    var mm = String(edate.getMonth() + 1).padStart(2, "0");
    var yyyy = edate.getFullYear();

    var disabled = "no";
    if (user.approved == "approved" || user.approved == "rejected") {
      disabled = "yes";
    }

    res.render("admin/userapprovalpage.hbs", {
      user,
      dd,
      mm,
      yyyy,
      disabled,
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// after clicking on approve for user after registration
router.get(
  "/approveuserreq/:id/approved",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    try {
      const _id = req.params.id;
      // _id is of user selected

      const user = await User.findByIdAndUpdate(
        _id,
        {
          approved: "approved",
        },
        {
          new: true,
          runValidators: true,
        }
      );
      const email = user.email;
      sendEmail(
        email,
        "Account approved",
        "Great !! Your account has now been approved by the admin. You can now login to QUICK PERMIT.",
        user.name
      );
      res.render("admin/afteruserapproved.hbs");
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

router.get("/approveallusers", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    var count = 0;

    const userstoapprove = await User.find({ approved: "pending" });

    if (userstoapprove.length === 0) {
      res.render("admin/nouserstoapprove.ejs", { user: req.user });
    }

    for (var i = 0; i < userstoapprove.length; i++) {
      const _id = userstoapprove[i]._id;

      const user = await User.findByIdAndUpdate(
        _id,
        {
          approved: "approved",
        },
        {
          new: true,
          runValidators: true,
        },
        () => {
          count = count + 1;
        }
      );
      const email = user.email;
      sendEmail(
        email,
        "Authorised",
        "You have been given access to the general user portal"
      );

      if (count === userstoapprove.length) {
        res.render("admin/afteruserapproved.hbs");
      }
    }
  } catch (error) {}
});

// after clicking on reject for user
router.get(
  "/approveuserreq/:id/rejected",
  ensureAuthenticated,
  async (req, res) => {
    if (req.user.email !== "admin@gmail.com") {
      res.render("404.ejs");
    }

    try {
      const _id = req.params.id;
      const user = await User.findByIdAndUpdate(
        _id,
        {
          approved: "rejected",
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(_id.toString());
      res.render("admin/afteruserrejected.hbs", {
        userID: _id.toString(),
      });
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

module.exports = router;
