const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth")
const bcrypt = require("bcryptjs")
const {
    check,
    validationResult
} = require("express-validator")
const jwt = require("jsonwebtoken")
const User = require("../../models/User")
const config = require("config")

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/auth
// @desc    authenticate User & get token
// @access  Public
router.post("/", [
    check("email", "Please enter a valid email address").isEmail(),
    check("password", "Password is required").exists({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }

    const {
        email,
        password
    } = req.body;

    try {
        // see if users exists
        let user = await User.findOne({
            email
        })
        if (!user) {
            return res.status(400).send({
                errors: [{
                    msg: "Invalid Credentials"
                }]
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res
                .status(400)
                .send({
                    errors: [{
                        msg: "Invalid Credentials"
                    }]
                })
        }

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