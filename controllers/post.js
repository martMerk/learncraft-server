const Post = require("../models/post");
const cloudinary = require("cloudinary");
const User = require("../models/user");

//Cloudinary: for the image upload
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const createPost = async (req, res) => {
  //console.log("post=>", req.body);
  //console.log("user:",req.user);
  const {
    name,
    date,
    topic,
    level,
    subject,
    content,
    cues,
    notes,
    summary,
    image,
  } = req.body;
  // Check if all properties of the post object are falsy
  if (
    !name ||
    !date ||
    !topic ||
    !level ||
    !subject ||
    !content ||
    !cues ||
    !notes ||
    !summary ||
    !image
  ) {
    return res.json({
      error: "All fields are required",
    });
  }
  try {
    //console.log("postedby",req.user._id);
    const post = new Post({
      name,
      date,
      topic,
      level,
      subject,
      content,
      cues,
      notes,
      summary,
      image,
      postedBy: req.user._id,
    });
    // console.log(post);
    await post.save();
    //send json response to the frontend
    //res.json(post);

    //for real time (received in the socket connection and broadcasted to all clients)
    //first the post is found in the db
    const postWithUser = await Post.findById(post._id).populate(
      "postedBy",
      "-password -secret"
    );
    res.json(postWithUser);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

const uploadImage = async (req, res) => {
  //console.log("req files =>",req.files);
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    //the result will have a couple of properties
    //we dont want to send them all
    //console.log('uploaded image url=>',result);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.log(err);
  }
};

//Post Rendering Controller
const postsByUser = async (req, res) => {
  try {
    //console.log("user id", req);
    //const posts = await Post.find({postedBy:req.user._id})
    //Display all posts of any user:
    const posts = await Post.find()
      .populate("postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(10);
    //console.log("posts", posts);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

const userPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params._id)
      .populate("postedBy", "_id name image")
      .populate("comment.postedBy", "_id name image");
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const updatePost = async (req, res) => {
  //console.log("post update controller =>",req.body);
  try {
    const post = await Post.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
    });
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params._id);
    //remove the image cloudinary
    if (post.image && post.image.public_id) {
      const image = await cloudinary.uploader.destroy(post.image.public_id);
    }
    res.json({ ok: true });
    console.log("the post was removed");
  } catch (err) {
    console.log(err);
  }
};

const newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let following = user.following;
    following.push(req.user._id);
    //PAGINATION
    //each time we get requests with a different page number
    //we will skip the previous ones
    const currentPage = req.params.page || 1; //by default 1
    const perPage = 2;
    //if we send 2 for posts the first time,next time if the number is two
    //we are going to multiply nb of posts with the value of the piece
    //to skip the previous and send the new ones: .skip((currentPage-1)*perPage)

    //find the post based on id's
    const posts = await Post.find({ postedBy: { $in: following } })
      .skip((currentPage - 1) * perPage) // page 2-1 *2= 2, we'll skip 2
      .populate("postedBy", "_id name image")
      .populate("comment.postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(perPage);

    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

//Like and unlike functions

const likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        //add to likes array
        $addToSet: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const unlikePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        //add to likes array
        $addToSet: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

//COMMENTS CONTROLLER: ADD and DELETE
const addComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comment: { text: comment, postedBy: req.user._id } } },
      { new: true }
      //populate the information who created the post et
    )
      .populate("postedBy", "_id name image")
      .populate("comment.postedBy", "_id name image");
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { comment: { _id: comment._id } } },
      { new: true }
      //populate the information who created the post et
    );

    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const totalPosts = async (req, res) => {
  try {
    const total = await Post.find().estimatedDocumentCount();
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

const posts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name image")
      .populate("comment.postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(12);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params._id)
      .populate("postedBy", "_id name image")
      .populate("comment.postedBy", "_id name image");
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
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
};
