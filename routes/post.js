//import express from "express";
const express = require("express");
const router = express.Router();
const { verifUser, canEditDeletePost,isAdmin } = require("../middlewares");
const {
  createPost,
  uploadImage,
  postsByUser,
  userPost,
  updatePost,
  deletePost,
  newsFeed,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  totalPosts,
  posts,
  getPost,
} = require("../controllers/post");
//a middleware for formData
const formidable = require("express-formidable");

// Define the POST route
//We need to have a user(apply a middleware)
router.post("/create-post", verifUser, createPost);
//router.post("/create-post",createPost);

//Photo posting
router.post(
  "/uploaded-image",
  verifUser,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);

//PostRendering
router.get("/user-posts", verifUser, postsByUser);
router.get("/user-post/:_id", verifUser, userPost);
//verifUser is not enough, we need to check if the user is the
//same who created the post
//we need another middleware that will check if
//the user can edit this post:update and delete
router.put("/update-post/:_id", verifUser, canEditDeletePost, updatePost);
router.delete("/delete-post/:_id", verifUser, canEditDeletePost, deletePost);

//NEWS FEED endpoint
router.get("/news-feed/:page", verifUser, newsFeed);

//Like and unlike endpoints
router.put("/like-post", verifUser, likePost);
router.put("/unlike-post", verifUser, unlikePost);

//Add  and delete a comment
router.put("/add-comment", verifUser, addComment);
router.put("/remove-comment", verifUser, removeComment);

//FOR THE PAGINATION:
router.get("/total-posts", totalPosts);
//For HOME PAGE display
router.get("/posts", posts);
//for one post display from a HOME PAGE
router.get("/post/:_id",getPost);

//admin is able to delete anyone's post:
router.delete("/admin/delete-post/:_id", verifUser, isAdmin, deletePost);



//exports module for the router object
module.exports = router;
