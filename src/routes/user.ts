import * as express from 'express'
import User from "../models/User";
import * as bcrypt from 'bcryptjs'
import * as path from 'path';
const { secret } = require("../config/keys");

export default function (app: express.Application) {
    app.get("/signup", (req, res) => {
        res.sendFile(path.join(__dirname + "/public/signup.html"))
    });
    app.post("/user", (req, res) => {
        User.findOne({ where: { username: req.body.username } }).then(user => {
            console.log(user);
            if (user) {
                let error = "Username exists in database.";
                return res.status(400).json(error);
            } else {
                const newUser = new User({
                    username: req.body.username,
                    password: req.body.password
                });
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then(user => {
                                const payload = {
                                    id: user.id,
                                    username: user.username
                                };
                                req.session.userId = payload.id;
                                req.session.username = payload.username;
                                res.send(200);
                            });
                    })
                });
            }
        });
    });


    // app.get("/login", (req, res) => {
    //     res.render("login", {});
    // });

    app.post("/login", (req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({ where: { username } }).then(user => {
            if (!user) {
                let errors: { username: string; };
                errors.username = "No Account Found";
                return res.status(404).json(errors);
            }
            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) {
                    console.log("in")
                    const payload = {
                        id: user.id,
                        username: user.username
                    };
                    req.session.userId = payload.id;
                    req.session.username = payload.username;
                    res.status(200).json(payload.id);
                } else {
                    let errors = {
                        password: ''
                    };
                    errors.password = "Password is incorrect";
                    res.status(500).json(errors);
                }
            });
        });
    });

    app.post("/logout", (req, res) => {
        if (req.session) {
            req.session.destroy(i => { });
            res.status(204).send("User has been logged out");
        } else {
            res.status(404).send("User not signed in");
        }
    });

    app.delete("/user/:id", (req, res) => {
        User.destroy({
            where: {
                id: req.params.id
            }
        })
            .then(affectedRows => {
                if (affectedRows > 0) {
                    res.status(200).end();
                } else {
                    res.status(404).end();
                }
            })
            .catch(err => {
                res.status(500).json(err);
            });
    });

}