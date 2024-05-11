//import express from "express";
const express = require("express");
const router = express.Router();
//middleware
//import with {} as functions not objects, without {}
const { requireSignin, verifUser,isAdmin } = require("../middlewares");
// const verifUser = require("../middlewares");
// const requireSignin = require("../middlewares");
//const verifyToken = require("../middlewares");
//import requireSignin from "../middlewares";
//controllers: // Import the register function
const {
  register,
  login,
  currentUser,
  forgotPassword,
  profileUpdate,
  findPeople,
  addFollower,
  userFollow,
  userFollowing,
  removeFollower,
  userUnfollow,
  searchUser,
  getUser,
} = require("../controllers/auth");
// Define the POST route for registration
router.post("/register", register);
router.post("/login", login);
// This route is protected and will only be accessible to authenticated users
//router.get("/current-user",currentUser);
//router.get("/current-user",requireSignin,currentUser);
router.get("/current-user", currentUser);
//forgotPassword route with a control function
router.post("/forgot-password", forgotPassword);
//router.get("/current-user",currentUser);
//moved to the controllers folder
// router.post("/register", (req,res)=>{
//      console.log("REGISTER ENDPOINT=>",req.body);
// });

//only for the logged user: verifUser
router.put("/profile-update", verifUser, profileUpdate);

//Follow/Unfollow people. Only for logged people
router.get("/find-people", verifUser, findPeople);
//follow
router.put("/user-follow", verifUser, addFollower, userFollow);
//unfollow
router.put("/user-unfollow", verifUser, removeFollower, userUnfollow);
//following
router.get("/user-following", verifUser, userFollowing);
//searching bar
router.get("/search-user/:query", searchUser);
//public user profile
router.get("/user/:username",getUser);

//access to Admin protected route
//fetch all the posts and allow to delete
router.get("/current-admin",verifUser,isAdmin,currentUser);

//exports module for the router object
module.exports = router;
