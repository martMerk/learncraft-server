//PASSWORD CRYPTING

const bcrypt=require("bcrypt");

//Promise will guarantee success or failure
//12:medium strenght
//it will return a hashed password unless there's an error
const hashPassword=(password)=>{
    return new Promise((resolve,reject)=>{
   bcrypt.genSalt(12,(err,salt)=>{
    if(err){
        reject(err);
    }
    bcrypt.hash(password,salt,(err,hash)=>{
        if(err){
            reject(err);
        }
        resolve(hash);
    });
   });
    });
};

const comparePassword = (password,hashed)=>{
    return bcrypt.compare(password,hashed);
};

module.exports = { hashPassword, comparePassword };


