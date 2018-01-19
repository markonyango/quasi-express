const express = require('express');
const mongoose = require('mongoose');
const User = require('../server/schema/user');
const Project = require('../server/schema/project');


const router = express.Router();


router.get('/', async function (req, res) {
    const uid = req.session.passport.user._id;

    const user = await User.findOne({ _id: uid });

    res.render('settings', { title: 'Settings', user: user, script: '../js/settings.js' });
});


router.post('/', async function (req, res) {
    const   username = req.body.username,
            r_path = req.body.rpath,
            save_path = req.body.savepath;

    const uid = req.session.passport.user._id;

    const user = await User.findByIdAndUpdate(uid, { settings: { r_path: r_path, save_path: save_path }, username: username });
    
    req.flash('success_msg', 'Settings for ' + user.username + ' successfully changed');
    res.redirect('/settings');
});


router.post('/remove', async function (req, res) {
    const uid = req.session.passport.user._id;

    const deleteProjects = await Project.deleteMany({ uid: mongoose.Types.ObjectId(uid) });
    console.log(deleteProjects);
    const ret = await User.findByIdAndRemove(uid);
    console.log(ret);

    req.clearCookie = true;
    req.flash('success_msg', 'Your account has been successfully deleted.');
    res.redirect('/');
    req.session.destroy();
});


module.exports = router;