const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.get("/", async (req, res) => {
    res.send("Hello API")
});


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})