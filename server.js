
const express = require("express");
const cors = require("cors");
const mongoose=require("mongoose");
//import route files automatically
//const fs=require("fs");
//destructer from a file system
const {readdirSync}= require("fs");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
//for real time 
const http =require("http").createServer(app);
const io = require("socket.io")(http,{
    //path for cloud purposes//the change made in the frontend
    path: "/socket.io",
    cors:{
        origin:process.env.CLIENT_URL,
        methods: ["GET","POST"],
        allowedHeaders:["Content-type"],
    },
});

//connection to db
mongoose.connect(process.env.DATABASE)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// mongoose.connect(process.env.DATABASE,{
//      useNewUrlParser: true,
//      useFindAndModify:false,
//      useUnifiedTopology:true,
//      useCreateIndex:true,})
//     .then(()=>console.log("DB connected"))
//     .catch((err)=>console.log("DB Connection Error =>",err));
    
    // Some middlewares
    //any time we want to use a middleware, we need to use the function use()
    //from client to server the data will be transfered using .json format
    app.use(express.json({limit:"5mb"}));
    //function that parses incoming requests with URL-encoded 
    //payloads and is based on the body-parser library. 
    app.use(express.urlencoded({extended:true}));
    //set a particular origin
    //with CORS enabled, your Express server will include the necessary HTTP headers to allow cross-origin
    // requests from the specified origins
    app.use(cors({origin: [process.env.CLIENT_URL],}));
    
    //POST endpoint
    //if the frontend http://localhost:3000 will see the data
    //in req.body
    // app.post("/api/register", (req,res)=>{ console.log("REGISTER ENDPOINT=>",req.body);
    // });
    
    //autoloaded routes
    //r:each file
    readdirSync("./routes").map((r)=>app.use("/api",require(`./routes/${r}`)));
    
    

    //socket.io
    // io.on("connect",(socket)=>{
    //     // console.log("SOCKET>IO",socket.id);
    //     socket.on("send-message",(message)=>{
    //         //console.log("new message received =>", message)
    //         //server is broadcasting to the connected clients
    //         //once it is broadcasted it is received in the client side 
    //         //socket.emit("receive-message", message); // appears only on emiters side
    //         socket.broadcast.emit("receive-message", message); //appears on every other than emiters side
    //     })
    // });

     io.on("connect",(socket)=>{
        //the event called "new-post" is grabbed from the client side 
        socket.on("new-post",(newPost)=>{
            //console.log("socketio new post =>", newPost)
            //server is broadcasting to the connected clients
            //once it is broadcasted it is received in the client side 
            //socket.emit("receive-message", message); // appears only on emiters side
           socket.broadcast.emit("new-post", newPost); //appears on every other than emiters side
        });
    });
    const port= process.env.PORT|| 8000;
    //listening on the port
    // app.listen(port,()=>console.log("Server running on port", port));
    
    //real time listening
    http.listen(port,()=>console.log("Server running on port", port));
    
    