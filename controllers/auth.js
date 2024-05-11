const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { postsByUser } = require("./post");
//const shortid = require('shortid');

//verify the token of a current user,defined in middleware
//const expressJwt = require ("express-jwt");
//callback function
//async: for email validation
const register = async (req, res) => {
  //test with a console
  // console.log("REGISTER ENDPOINT=>",req.body);
  // destructure of a user data
  const { name, email, password, secret } = req.body;

  //some validations:
  if (!name) {
    return res.json({
      error: "Name is required",
    });
  }
  if (!email) {
    return res.json({
      error: "Email is required",
    });
  }
  if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and should be at least 6 characters long",
    });
  }

  if (!secret) {
    return res.json({
      error: "Answer is required",
    });
  }
  //check if email already exsists
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "Email is taken",
    });
  }
  // hash the password
  const hashedPassword = await hashPassword(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: nanoid(6),
  });
  try {
    await user.save();
    //have a look at registered user
    //console.log("Registered user => ",user);
    return res.json({ ok: true });
  } catch (err) {
    console.log("REGISTER FAILED=>", err);
    return res.status(400).send("Error.Try again.");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  //console.log(req.body);
  //find the user in the db
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({
      error: "No user found",
    });
  }
  //check password by comparing it
  const match = await comparePassword(password, user.password);
  if (!match) {
    return res.json({
      error: "Wrong password",
    });
  }
  //if everything goes we'll create a signed token
  //20*60:20sec------expiresIn:"1200"
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  //make sure that we are not sending the user's password and the secret in the frontend
  //console.log(token);
  user.password = undefined;
  user.secret = undefined;
  //send the user object we found in the DB
  //all the info will be sent, except password and secret
  res.json({
    token,
    user,
  });
  try {
    //const {email,password}=req.body;
    //check if our db has a user with that email
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error.Try again");
  }
};

//export as a whole object
//module.exports = {register,login};
const currentUser = async (req, res) => {
  //the user will be added to the request by default by the middleware
  //console.log(req.user);
  try {
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
      //ok:true is a must to have the dashboard active
      res.json({ ok: true, user: user });
    });
    //next();

    //const user = await User.findById(req.user._id);
    //with the valid token we can access the user

    //res.json(user);
    //console.log(res);
    //send the response that the user was found
    //based on this the frontpage of a dashboard will be protected/
    //only authentisized use will have the access
    //res.json({ok:true});
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};
//console.log(req.headers);
//send token in headers using POSTMAN(later from client)
//verify token using expressJwt(create a middleware)
//if verified you will get user id from that token
//(used during login to create signed token)
//based on that user id, find that user from db
//if found, send successful response

const forgotPassword = async (req, res) => {
  //check if we receive data from client side:
  // console.log(req.body);
  const { email, newPassword, secret } = req.body;
  //validation
  if (!newPassword || newPassword < 6) {
    return res.json({
      error:
        "New password is required and it should be at least 6 characters long ",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret is required",
    });
  }
  //check the user in the db
  const user = await User.findOne({ email, secret });
  //if there's no user
  if (!user) {
    return res.json({
      error: "The user does not exist",
    });
  }
  //remove the old one, replace by the new one
  //make sure it is hashed
  try {
    const hashed = await hashPassword(newPassword);
    //find the user based on his Id
    //update the password with hashed version
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "Congrats! Now you can login with a new password",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong. Try again.",
    });
  }
};

const profileUpdate = async (req, res) => {
  try {
    // Get the user ID from the request (you may want to verify it beforehand)
    //const userId = req.user && req.user._id;
    //console.log(userId)
    //console.log("Profile update req.body", req.body);

    //the object will have all the information
    //we want to update in the database
    const data = {};
    //we might not get the username from a user
    if (req.body.username) {
      data.username = req.body.username;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.name) {
      data.name = req.body.name;
    }
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error: " Password is required and should be min 6 characters long",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }
    if (req.body.secret) {
      data.secret = req.body.secret;
    }
    if (req.body.image) {
      data.image = req.body.image;
    }

    let user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    //console.log('Update user',user);

    //make sure not sending the password and secret :
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
    // Check if the update was successful
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    // Handle specific MongoDB error codes
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "The same username already exists" });
    }

    // Log the error and return a generic server error response
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while updating the profile" });
  }
};

//Follow/Unfollow people
const findPeople = async (req, res) => {
  //get all the users except the connected user
  try {
    //find the currect user first
    const user = await User.findById(req.user._id);
    //find this users following list
    let following = user.following;
    following.push(user._id);
    //suggest to follow people that are not in the following list
    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    res.json(people);
  } catch (err) {
    console.log(err);
  }
};

//middleware
const addFollower = async (req, res, next) => {
  try {
    //$push accepts duplicates, to avoid this we use $addToSet
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { following: req.body._id } },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

const userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = await User.find({ _id: user.following }).limit(10);
    res.json(following);
  } catch (err) {
    console.log(err);
  }
};

// remove Follower, Unfollow the user
//middleware
const removeFollower = async (req, res, next) => {
  try {
    //pullout from the followers list
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

const userUnfollow = async (req, res) => {
  try {
    //pull out from the following list
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

const searchUser = async(req,res)=>{
  //query could be a name or a username
  //the regular expression($regex)with a case insensitive option 
  //to lowercase all the characters
  const {query} = req.params;
  //if there's no query
  if(!query) return;
  try{
    const user = await User.find({
      //using ^ ,to match the beginning of the string to avoid duplicates
      $or:[
        {name:{$regex:`^${query}`,$options:'i'}},
        {username:{$regex:`^${query}`,$options:'i'}}  
      ],
    }).select("-password -secret");  //deselect password and and secret not sending them in the response
  res.json(user);
  }catch(err){
   console.log(err);
  }};

  const getUser = async (req,res) =>{
    try{
     const user = await User.findOne({username:req.params.username})
     .select("-password -secret");
     res.json(user);
    }catch(err){
      console.log(err);
    }
  }

module.exports = {
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
};
