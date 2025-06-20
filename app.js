const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const app=express();
const Listing=require('./models/listing');
const Review=require('./models/reviews');
const methodOverride=require('method-override');
const ejsmate=require('ejs-mate');
const wrapAsync=require('./utils/wrapAsync');
const ExpressError = require('./utils/ExpressError');
const { listingschema, reviewschema } = require('./schema');
const flash = require('connect-flash');
const session = require('express-session');
const e = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local'); 
const User = require('./models/user');
const saveoptions={
    secret:"mysupersceretstring",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24*7,
        maxAge:1000 * 60 * 60 * 24*7

    }
}

app.use(session(saveoptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const validatelisting=(req,res,next)=>{
    let {error}=listingschema.validate(req.body);
    if(error){
      console.log(error);
        throw new ExpressError(400,error);
    }
    else{
        next();
    }
}

const validatereviews = (req, res, next) => {
  const { error } = reviewschema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.details.map(el => el.message).join(', '));
  } else {
    next();
  }
};
app.use((req, res, next) => {
res.locals.success = req.flash('success');
next();
});
app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    next();
});

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});
app.get('/',(req,res)=>{
    res.send("root route is working fine go on");
});
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
const Mongo_URL='mongodb://127.0.0.1:27017/Wanderlust';
async function main(){
await mongoose.connect(Mongo_URL);}
main().then(()=>console.log("MongoDB is connected")).catch((err)=>console.log(err));
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.engine('ejs',ejsmate);
app.use(express.static(path.join(__dirname,'public')));

//index route to show all listings
app.get('/listings',async(req,res)=>{
  const alllistings= await Listing.find({});
  res.render('./listings/index.ejs',{alllistings});
});
//show route
app.get('/listings/show/:id',wrapAsync(async(req,res)=>{
  const {id}=req.params;
  const specificlisting= await Listing.findById(id).populate('reviews');
 
  res.render('./listings/show.ejs',{specificlisting});
}));
//create new listings route
app.get('/listings/new',wrapAsync(async(req,res)=>{
    res.render('./listings/new.ejs');
}));
//create new listing post
app.post('/listings',validatelisting,wrapAsync(async(req,res ,next)=>{
  
    const {title,description,image,price,location,country}=req.body;
    const newlisting= new Listing({title,description,image,price,location,country});
    await newlisting.save();    
    req.flash('success', 'Successfully created a new listing!');

    res.redirect('/listings');
    
}));

// signup user route
app.get('/register',(req,res)=>{
    res.render('./users/register.ejs');
});

// signup user post
app.post('/register',async(req,res)=>{
    try{
        const {username,email,password}=req.body;
        const newuser= new User({username,email});
        const registereduser= await User.register(newuser,password);
        console.log(registereduser);
        req.flash('success', 'Welcome to PosTnRenT!');
        res.redirect('/listings');
    }
    catch(e){
        req.flash('error', e.message);
        res.redirect('/register');
    }// req.login(registereduser,(err)=>{
        //     if(err) return next(err);
        //     req.flash('success', 'Welcome to PosTnRenT!');
        //     res.redirect('/listings');
        // });
  
    
});
// login user route
app.get('/login',(req,res)=>{
    res.render('./users/login.ejs');
});
// login user post
app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{  
    req.flash('success', 'Welcome back!');
   
    res.redirect('/listings');
});
//edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    const {id}=req.params;
    const editlisting= await Listing.findById(id);
    res.render('./listings/edit.ejs',{editlisting});
}));
// db update route
app.put("/listings/:id",validatelisting,wrapAsync(async(req,res)=>{
    const {id}=req.params;
    const {title,description,image,price,location,country}=req.body;
    const updatedlisting= await Listing.findByIdAndUpdate(id,{title,description,image,price,location,country},{new:true});
      req.flash('success', 'Successfully updated a  listing!');
    res.redirect(`/listings/show/${id}`);  }));     
//delete route
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    const {id}=req.params;
    await Listing.findByIdAndDelete(id);
      req.flash('success', 'Successfully deleted a  listing!');
    res.redirect("/listings");
}));
//create new review route
app.post("/listings/:id/reviews",validatereviews,wrapAsync(async(req,res)=>{
    const {id}=req.params;
   
    const specificlisting= await Listing.findById(id);
   let newreview= new Review(req.body);
    specificlisting.reviews.push(newreview);

    await newreview.save();
    await specificlisting.save();
    req.flash('success', 'Successfully created a new review!');
    res.redirect(`/listings/show/${id}`);
}));

// app.all('*',(req,res,next)=>{
//     next(new ExpressError(404,'Page Not Found'));
// });
app.use( (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});
// //custom err middleware
// Error handling middleware - CORRECT order of parameters
app.use((err, req, res, next) => {
    let { status = 500, message = 'Something went wrong' } = err;
    
    res.render('./listings/error.ejs',{message});
});