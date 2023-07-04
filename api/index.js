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

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
    // Take the refresh token from the user
    const refreshToken = req.body.token;

    // send error if there is no token or invalid token 
    if(!refreshToken) return res.status(401).json("You are not authenticated !");
    if(!refreshTokens.includes(refreshToken)){
        return res.status(403).json("Refresh token is not valid !");
    }
    jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken); // keep all token except refreshToken in array

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.push(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken, 
            refreshToken: newRefreshToken
        });
    });

    // if everything is ok, create a new access token, refresh token and send to user
});

const generateAccessToken = (user) => {
    // Generate an access token
    return jwt.sign(
        {id: user.id, isAdmin: user.isAdmin}, 
        "mySecretKey",
        {expiresIn: "300s"}
    ); // signature, two parameter - payload and secret key (create env file)
};

const generateRefreshToken = (user) => {
    // Generate a refresh token
    return jwt.sign(
        {id: user.id, isAdmin: user.isAdmin}, 
        "myRefreshSecretKey"
    ); 
};

app.post("/api/login", (req, res) =>{
    const {username, password} = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password;
    });
    if(user){

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);

        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken,
        });
    } else {
        res.status(400).json("Username or Pasword incorrect !!");
    }
});

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(" ")[1];

        jwt.verify(token, "mySecretKey", (err, user) => {         // verify finction takes two arg - token and secret key and return decode payload (either user or error) and next callback function runs on it.
            if(err){
                return res.status(403).json("Token is not valid"); 
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json("You are not authenticated");
    }
};

app.delete("/api/users/:userId", verify, (req,res) => {
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json("User has been deleted.");
    } else {
        res.status(403).json("You are not allowed to delete this user!");
    }
});

app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You logged out successfully.");
})

app.listen(3000, () => {
    console.log("backend server is running");
});