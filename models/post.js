const mongoose=require("mongoose");
const {ObjectId} =mongoose.Schema;

//left type empty object to send all kind of data:rich text editor
const postSchema = new mongoose.Schema({
   
    name: {
        type: String,
        trim:true,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    content:{
        type:String,
        required:true,
    },
    cues: {
        type: {},
        required: true,
    },
    notes: {
        type: {},
        required: true,
    },
    summary: {
        type: {},
        required: true,
    },
    postedBy:{
        type:ObjectId,
        ref:"User",
    },
    image:{
        url: String,
        public_id:String,
    },
    likes:[{type: ObjectId,ref:"User"}],
    comment:[
        {
            text:String,
            created:{type:Date,default:Date.now},
            postedBy:{type:ObjectId,
                ref:"User",
            },
        },
    ],
    
},{timestamps:true});


const Post = mongoose.model("Post",postSchema);
module.exports = Post;