const mongoose=require("mongoose");
const initializeDb=require("./data");
const listings=require("../models/listing");
const Mongo_URL='mongodb://127.0.0.1:27017/Wanderlust';
async function main(){
await mongoose.connect(Mongo_URL);}
main().then(()=>console.log("MongoDB is connected")).catch((err)=>console.log(err));
const initializeDatabase=async()=>{
await listings.deleteMany({});
await listings.insertMany(initializeDb.data)
console.log("Database initialized with sample data");

}
initializeDatabase();