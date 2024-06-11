const express = require('express')
const userCtrl = require('../controllers/userInfoController')
const prayerCtrl = require('../controllers/prayerController')

const router = express.Router()

router.route('/new/:userId')
    .post(userCtrl.requireSignin, prayerCtrl.create)

router.route('/')
    .get(prayerCtrl.list)

router.route('/photo/:postId')
    .get(prayerCtrl.photo)

router.route('/by/:userId')
    .get(prayerCtrl.listByUser)

router.route('/feed/:userId')
    .get(userCtrl.requireSignin, prayerCtrl.listNewsFeed)

router.route('/energy')
    .put(prayerCtrl.energy)
router.route('/prayerUpdate')
    .put(prayerCtrl.prayerUpdate)
router.route('/unenergy')
    .put(prayerCtrl.unenergy)

router.route('/:postId')
    .delete(prayerCtrl.remove)
    .get(prayerCtrl.prayerOne)

router.param('userId', userCtrl.userByID)
router.param('postId', prayerCtrl.postByID)

module.exports = router
