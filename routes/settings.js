const express = require('express');
const mongoose = require('mongoose');
const User = require('../server/schema/user');
const Project = require('../server/schema/project');
const to = require('../catchError');


const router = express.Router();


router.get('/', async function (req, res) {
    const uid = req.session.passport.user._id;
    let error, user;

    [error, user] = await to(User.findOne({ _id: uid }));

    if (error) {
        req.flash('error_msg', 'Something went wrong while retrieving your settings: ' + error);
        res.redirect('/');
    } else {
        res.render('settings', { title: 'Settings', user: user, script: '../js/settings.js' });
    }
});


router.post('/', async function (req, res) {
    const username = req.body.username,
        r_path = req.body.rpath,
        save_path = req.body.savepath;

    const uid = req.session.passport.user._id;

    let error, user;
    [error, user] = await to(User.findByIdAndUpdate(uid, { settings: { r_path: r_path, save_path: save_path }, username: username }));

    if (error) {
        req.flash('error_msg', 'Something went wrong while saving your new settings: ' + error);
        res.redirect('/settings');
    } else {
        req.flash('success_msg', 'Settings for ' + user.username + ' successfully changed');
        res.redirect('/settings');
    }
});

module.exports = router;