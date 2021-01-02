const express = require('express'),
app = express(),
mongoose = require('mongoose'),
bcrypt = require('bcrypt'),
bodyParser = require('body-parser'),
jwt = require('jsonwebtoken'),
cors = require('cors'),
User = require('./models/user.js'),
Bearer = require('./models/issuedToken.js'),
config= require('./config.js'),
cookieParser = require('cookie-parser');
//make a database with name credentials
mongoose.connect('mongodb://localhost:27017/credentials',{
   useNewUrlParser: true,
   useFindAndModify: false,
   useCreateIndex: true,
   useUnifiedTopology: true 
});
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.use(cors())
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});
app.use(require('express-session')({
    secret:'PeShVmYq3t6w9z$C&F)J@NcQfTjWnZr4u7x!A%D*G-KaPdSgUkXp2s5v8y/B?E(H', //cookie secret
    name: 'e_session',
    resave:false,
    path: 'session/',
    cookie: {sameSite: true,maxAge: 60000,httpOnly: true}, //max-age is in miliseconds
    saveUninitialized:false,
  }));
app.disable('x-powered-by');

//protected route
app.get('/',validate_token,(req, res)=>{
    // console.log(req.cookies);
    console.log("Session "+ req.session);
    console.log(req.user_id);
    console.log(`REQ-HEADERS`)
    // console.log(req.headers)
    //get the user from the id
    User.findById(req.user_id,(err, user)=>{
        if(err){
            console.log(err);
        }else{
            //console.log(user.username);
            res.render("index",{user : user.username});
        }
    })
  

});
//Routes for login
app.get('/login',(req, res)=>{
    console.log("Session Active Status "+req.session.status);
    // console.log(req.headers)
    if(req.session.status){
       
        res.redirect('/');
    }
    else{
        
        res.render("login");
    }
});
app.post('/login',(req, res)=>{
    console.log("login post request");
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({username: username},(err, user)=>{
        if(err){
            console.log(err);
            res.redirect('/login');
        }else{
          try{
            if(user.length !=0){
                bcrypt.compare(password, user.password).then(passwordsMatch=>{
                    if(passwordsMatch){
                    //   const date = new Date();
                    //    const expiresIn = new Date();
                    //    expiresIn.setMinutes(date.getMinutes()+1);
                    //    console.log(date.getTime());
                    //    console.log(expiresIn.getTime());
                        // const JWT = create_token(username,"60000"); //1min = 60000ms
                        //store active tokens in the database
                        //if client is trying to log in again then delete all the previous token issued to him//
                        //it is just for extra security//

                        Bearer.deleteMany({bearer : username},(err)=>{console.log(err)});

                        Bearer.create({bearer: username,user_id: user._id},(err, issued)=>{
                            if(err){
                                console.log(err);
                            }else{
                                const JWT = create_token(username,"60000", issued._id); //1min = 60000ms
                                //cookie will be deleted after 1min
                                res.cookie("jwt", JWT, {expire: 60000 + Date.now(),httpOnly: true,sameSite:true});
                                //managing session using express session, just using to check login status
                                req.session.user_id = user._id;
                                req.session.status = true;
                                res.redirect('/');
                            }
                        })

                    }else{
                       res.sendStatus(401).send("Authentication error");
                    }
                }).catch(err=>{
                    console.log(err);
                });
            }else{
                console.log("No such user found");
                res.redirect('/register');
            }
          }catch(err){
            console.log("No such user found");
            res.redirect('/register');
          }
            
        }
    })
});
app.get('/logout',validate_token,(req, res)=>{
    //clear all cookies
    res.clearCookie("jwt");

    //delete all active tokens from the database
    Bearer.deleteMany({user_id: req.user_id},(err)=> console.log(err));

    req.session.destroy(function(err){
        if(err){
            console.log(err);
        } else {
            //destroy the session and redirect back to login page
            res.redirect('/login');
        }
    });
    
})
//Routes for new user
app.get('/register',(req, res)=>{
    if(req.session.status) res.redirect('/');
    else
    res.render("register");
});
app.post('/register',(req, res)=>{
    console.log("post register route");
    const username = req.body.username;
    const password = req.body.password;
    User.find({username: username},(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser.length == 0){
                const hash = bcrypt.hash(password,config.saltingRounds,(err, hashed)=>{
                    if(err){
                        console.log("error hashing the password");
                    }
                    else{
                        const user = new User();
                        user.username = username;
                        user.password = hashed;
                        User.create(user,(err, newUser)=>{
                            if(err){
                                console.log(err);
                                }else{
                                //redirect to login route
                                
                                res.redirect('/login');
                            }
                        })
                    }
                })
            }else{

                console.log("user already exists");
                res.redirect('/login');
            }
        }
    })
});

app.listen(3000,(req, res)=>{
    console.log("server started at port 3000 --> http://localhost:3000");
});

function create_token(username, expiresIn, _id){

    const payload = { user: username, _id};
    console.log(payload)
    const options = { expiresIn:expiresIn, issuer: 'AxDu' };
    const secret = config.jwt_secret;
    const token = jwt.sign(payload, secret, options);
    return token;

    }
function validate_token(req, res, next){
    const client_token = req.cookies.jwt;
    // console.log(client_token);
    jwt.verify(client_token, config.jwt_secret, (err, decoded)=>{
        if(err){
            console.log(err);
            console.log("Token Expired!!");
            res.clearCookie("jwt");
            res.redirect("/login");
        }else{
            console.log(decoded);
            //{ user : ,iat: , exp: , iss}
            Bearer.find({_id: decoded._id},(err, foundToken)=>{
                if(err){
                    console.log(err);
                }
                    else{
                        if(foundToken.length == 1){
                                req.user_id = foundToken[0].user_id;
                                //append a user object to request header//
                                //console.log(req.user_id);
                                next();

                        }else{
                            console.log("Token couldn't be found!");

                            res.clearCookie("jwt"); //user not found on the issued token list
                            req.session.status = false;
                            res.redirect('/login');
                        }
                    }
            })
        }
    });
 }