import mongoose from "mongoose";

const DB_NAME = "Rant";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\nMongoDB connected, DB host: ${connectionInstance.connection.host}\nWith collection: ${DB_NAME}\n`);

    // Wait for the connection to be established before dropping indexes
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection("users").dropIndexes();
      console.log("Indexes dropped successfully");
    }
  } catch (error) {
    console.log("ERROR: ", error);
    process.exit(1);
  }
};

export default connectDB;
