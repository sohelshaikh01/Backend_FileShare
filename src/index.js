import connectDB from "./db/conn.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: '../.env'
});

const PORT = process.env.PORT;

// Database connection and server start
connectDB()
.then(() => {
    app.on('error', (error) => {
        console.log("Error in App:", error);
    });
    
    app.listen(PORT, () => {
        console.log(`Server Running on http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.log("MongoDB Connection failed !!!", error);
});

