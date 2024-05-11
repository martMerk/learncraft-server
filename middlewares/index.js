const Post = require( "../models/post");
const express = require("express");
//const expressJwt=require("express-jwt");
//expressjwt is not a function:

const {expressjwt:jwt2} = require("express-jwt");
const jwt =require("jsonwebtoken");
const User = require("../models/user");
const JWT_VALIDATION_SECRET = process.env.JWT_SECRET 
//const jwt2 = require("express-jwt");
// The name of a middleware:requireSignin
// use the same secret which served to generate the token
//and save the algorithm


//DOES NOT WORK::
//apply the middleware in the routes
//it will verify if the token exist and will return user _id
const requireSignin = jwt2({
      secret:process.env.JWT_SECRET,
      algorithms: ['HS256'],
    });
//module.exports=requireSignin;

// const jwt = require("jsonwebtoken");
// function verifyToken(req, res, next) {
// const token = req.header("Authorization");
// //console.log(req.headers);
// console.log(token);
// if (!token) return res.status(401).json({ error: 'Access denied' });
// try {     
//  const decoded = jwt.verify(token,process.env.JWT_SECRET);
//  req.userId = decoded.userId;
//  console.log( req.userId);
//  next();
//  } catch (error) {
//  res.status(401).json({ error: 'Invalid token' });
//  }
//  };

// module.exports = verifyToken;


const verifUser = async(req,res,next) => {
 
  try{
  //the user will be added to the request by default by the middleware
  //console.log(req.user);
  const authHeader = req.headers["authorization"];

  //Extracting token from authorization header
 const token = authHeader && authHeader.split(" ")[1];
 
 // Checking if the token is null
  if (!token) {
    return res.status(401).send("Authorization failed. No access token.");
  }

  //Verifying if the token is valid.
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
   
    if (err) {
      console.log(err);
      return res.status(403).send("Could not verify token");
    }
    req.user = user;
    next(); // Call next() to proceed to the next middleware/route handler
  });
  
  }
  catch(err){
    console.log(err);
    res.sendStatus(400);
  }
};

const canEditDeletePost = async (req,res,next) =>{
  try{
const post= await Post.findById(req.params._id);
//console.log("POST in EDIT DELETE MIDDLEWARE =>",post);
  if(req.user._id !=post.postedBy){
  return res.status(400).send("Unauthorized");
  }else{
    //execute next call back
    next();
  }
}catch(err){
   console.log(err);
  }};

  const isAdmin = async(req,res,next)=>{
    try{
      const user = await User.findById(req.user._id);
      //console.log("is Admin ===>",user);
      if(user.role !=="Admin"){
        return res.status(400).send("Unauthorized");
      }else{
        //continue call back
        next();
      }
    }catch(err){
      console.log(err);
    }
  }

module.exports = {verifUser,canEditDeletePost,requireSignin,isAdmin};