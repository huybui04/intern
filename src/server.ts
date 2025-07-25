import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./services/database.config";

dotenv.config();

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
