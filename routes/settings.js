const express = require('express')
const User = require('../server/schema/UserSchema')


const router = express.Router()


router.get('/', function (req, res) {
    const uid = req.user._id
    User.findOne({ _id: uid }).exec()
        .then(user => {
            res.render('settings', { title: 'Settings', user: user, script: '../js/settings.js' })
        })
        .catch(error => {
            req.flash('error_msg', 'Something went wrong while retrieving your settings: ' + error)
            res.redirect('/')
        })
})


router.post('/', function (req, res) {
    const { username } = req.body
    const uid = req.user._id

    User.findByIdAndUpdate(uid, { username: username }).exec()
        .then(user => {
            req.flash('success_msg', 'Settings for ' + username + ' successfully changed')
            res.redirect('/settings')
        })
        .catch(error => {
            req.flash('error_msg', 'Something went wrong while saving your new settings: ' + error)
            res.redirect('/settings')
        })
})

module.exports = router