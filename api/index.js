const express = require("express");
const jwt = require("jsonwebtoken");

const app = express(); // return new router object (express application)
app.use(express.json()); // built-in middleware function, parses incoming req with JSON payload and returns an object.

const users = [
    {
        id: "1",
        username: "john",
        password: "john123",
        isAdmin: true,
    },
    {
        id: "2",
        username: "jane",
        password: "jane123",
        isAdmin: false,
    }
];

app.post("/api/login", (req, res) =>{
    const {username, password} = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password;
    });
    if(user){
        // Generate an access token
        const accessToken = jwt.sign(
            {id: user.id, isAdmin: user.isAdmin}, 
            "mySecretKey"
        ); // signature, two parameter - payload and secret key (create env file)
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
        });
    } else {
        res.status(400).json("Username or Pasword incorrect !!");
    }
});

app.listen(3000, () => {
    console.log("backend server is running");
});