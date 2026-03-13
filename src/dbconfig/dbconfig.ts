import mongoose, { mongo } from "mongoose";

export const connect = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI!);
    const connection = mongoose.connection;

    connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    })

    connection.on("error", (err) => {
      console.error(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    })
  } catch (error) {
    console.error("Error connecting to database");
    console.error(error);
  }
}