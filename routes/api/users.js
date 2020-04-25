const express = require("express");
const router = express.Router();
const {
    check,
    validationResult
} = require("express-validator")
const gravatar = require("gravatar")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../../models/User")
const config = require("config")

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post("/", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please enter a valid email address").isEmail(),
    check("password", "Please enter a password longer than  6 char").isLength({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    console.log(req.body, req.headers['content-type'])
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }

    const {
        name,
        email,
        password
    } = req.body;

    try {
        // see if users exists
        let user = await User.findOne({
            email
        })
        if (user) {
            return res.status(400).send({
                errors: [{
                    msg: "User already exists"
                }]
            })
        }

        // get user gravatar
        const avatar = gravatar.url(email, {
            s: "200",
            r: "pg",
            d: "mm"
        })

        user = new User({
            name,
            email,
            password,
            avatar
        })

        // encrypt password 
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get("jwtSecret"), {
            expiresIn: 360000
        }, (err, token) => {
            if (err) throw err;
            res.json({
                token
            })

        });

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error.")
    }


});

module.exports = router;