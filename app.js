const express = require("express");
const app = express();
const dotenv = require("dotenv");
const authRoutes = require("../backend/routes/authRoutes.js");

dotenv.config();

const PORT = process.env.PORT;



app.use(express.json());

app.use("/api/auth", authRoutes);





app.listen(PORT, () => {
    console.log(`Szervered elindult a következő porton! ${PORT}`);
});