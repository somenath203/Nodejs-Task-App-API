const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');

const auth = require('../middlware/auth');

const router = express.Router();


// get authorized user
router.get('/users/me', auth, async (req, res) => {

    res.send(req.user);

});


// creating/sign-up new user
router.post('/users', async (req, res) => {

    const user = new User(req.body);

    try {

        const newToken = await user.generateAuthToken();

        await user.save()

        res.status(201).send({
            "message": "user signed up successfully",
            "userinfo": user,
            "newToken": newToken
        });

    } catch (error) {

        res.status(400).send(error.message);

    }

});

// logging in user
router.post('/users/login', async (req, res) => {
    try {

        const user = await User.findByCredentials(req.body.email, req.body.password);

        const newToken = await user.generateAuthToken();

        res.status(200).send({
            "message": "user logged in successfully",
            "user": user,
            "newToken": newToken
        });

    } catch (error) {
        res.status(400).send({
            "message": "Wrong Credentials!! Unable to login!"
        });
    }
});


// logging out user
router.post('/users/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();

        res.status(200).json({
            "message": "user logged out successfully"
        });

    } catch (error) {
        res.status(500).send(error);
    }

});

// logout of all session
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();

        res.status(200).send({
            "message": "user logged out successully from all sessions"
        });

    } catch (error) {
        res.status(500).send(error);
    }
});


// update user
// the authenticated user will be able to update only him/her, not other users
router.patch('/users/me', auth, async (req, res) => {

    const enteredFieldKeys = Object.keys(req.body);

    const allowedFieldKeys = ["name", "email", "password", "age"];

    const isValidFields = enteredFieldKeys.every((key) => {
        return allowedFieldKeys.includes(key);
    });


    if (!isValidFields) {
        return res.status(404).send({
            error: 'invalid update of User!'
        })
    }

    try {

        const user = await User.findById(req.user._id);

        enteredFieldKeys.forEach((key) => {
            user[key] = req.body[key];
        });

        await user.save();


        res.status(201).send({
            "message": "user details updated successfully",
            "userinfo": user
        });

    } catch (error) {

        res.status(400).send(error);

    }
});

// profile pic upload

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('only jpg, jpeg and png files are supported'))
        }

        cb(undefined, true);

    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {


    const modifiedImage = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = modifiedImage;


    await req.user.save();

    res.send({
        "message": "profile pic uploaded successfully"
    });
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
});

// delete user's avatar
router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined;

    await req.user.save();

    res.send({
        "message": "profile pic deleted successfully"
    });

});

// getting the user's profile pic
router.get('/users/:id/avatar', async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error("unable to fetch requested user's profile pic");
        }

        res.set('Content-Type', 'image/jpg');

        res.send(user.avatar);

    } catch (error) {

        res.status(404).send({
            "message": error.message
        });

    }

});


// delete user 
// the authenticated user will be able to update only him/her, not other users
router.delete('/users/me', auth, async (req, res) => {

    try {

        await req.user.remove();

        res.status(200).send({
            message: "user deleted successfully"
        });

    } catch (error) {

        res.status(500).send(error);

    }

});



module.exports = router;




