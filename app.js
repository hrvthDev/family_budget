const express = require("express");
const app = express();
const dotenv = require("dotenv");
const authRoutes = require("../backend/routes/authRoutes.js");
const familyRoutes = require("../backend/routes/familyRoutes.js");
const path = require("path");


dotenv.config();

const PORT = process.env.PORT;



app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/families", familyRoutes);




app.listen(PORT, () => {
    console.log(`Szervered elindult a következő porton! ${PORT}`);
});