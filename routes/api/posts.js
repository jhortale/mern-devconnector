const express = require("express");
const router = express.Router();
const {
    check,
    validationResult
} = require("express-validator");
const auth = require("../../middleware/auth")

const Profile = require("../../models/Profile");
const User = require("../../models/User")
const Post = require("../../models/Post")

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post("/",
    [
        auth,
        [
            check("text", "text is required")
            .not()
            .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: errors.array()
            });
        }

        try {
            const user = await User.findById(req.user.id).select("-password");

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            const post = await newPost.save();
            res.json(post);

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error")
        }
    }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get("/", auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({
            date: -1
        });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

// @route   GET api/posts/:post_id
// @desc    Get single post
// @access  Private

router.get("/:post_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({
                msg: "Post not found"
            })
        }
        res.json(post);
    } catch (err) {
        console.error(err.message, err.kind);
        res.status(500).send("Server Error")
    }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete a post
// @access  Private

router.delete("/:post_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        // check post
        if (!post) {
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        // check user 
        console.log(post.user.toString() === req.user.id)
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({
                msg: "User not authorized"
            })
        }

        await post.remove();

        res.json({
            msg: "Post removed"
        });
    } catch (err) {
        console.error(err.message, err.kind);
        res.status(500).send("Server Error")
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private

router.put("/like/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //check if the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({
                msg: "Post already liked"
            })
        }
        post.likes.unshift({
            user: req.user.id
        });

        await post.save();

        res.json(post.likes)

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

// @route   PUT api/posts/unlike/:id
// @desc    unlike a post
// @access  Private

router.put("/unlike/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        //check if the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({
                msg: "Post hast not yet been liked"
            })
        }
        // Get remove index
        const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user.id);

        post.likes.splice(removeIndex, 1)

        await post.save();

        res.json(post.likes)

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post("/comment/:id",
    [
        auth,
        [
            check("text", "text is required")
            .not()
            .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: errors.array()
            });
        }

        try {
            const user = await User.findById(req.user.id).select("-password");
            const post = await Post.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);

            await post.save();
            res.json(post.comments);

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error")
        }
    }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a Comment on a post
// @access  Private

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Pull out comments from
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // make sure coimments exists
        if (!comment) {
            return res.status(404).json({
                msg: "Comment does not exist"
            })
        }

        // check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({
                msg: "User not authorized"
            })
        }

        // Get remove index
        const removeIndex = post.comments
            .map(comment => comment.user.toString())
            .indexOf(req.user.id);

        post.comments.splice(removeIndex, 1)

        await post.save();

        res.json(post.comments)


    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

module.exports = router;