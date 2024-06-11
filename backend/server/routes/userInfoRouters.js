const express = require('express')
const userCtrl = require('../controllers/userInfoController')

const router = express.Router()

router.route('/')
    .get(userCtrl.list)
    .post(userCtrl.create)

router.route('/photo/:userId')
    .get(userCtrl.photo, userCtrl.defaultPhoto)

router.route('/defaultphoto')
    .get(userCtrl.defaultPhoto)

router.route('/follow')
    .put(userCtrl.requireSignin, userCtrl.addFollowing, userCtrl.addFollower)
router.route('/unfollow')
    .put(userCtrl.requireSignin, userCtrl.removeFollowing, userCtrl.removeFollower)

router.route('/findpeople/:userId')
    .get(userCtrl.requireSignin, userCtrl.findPeople)

router.route('/comment')
    .put(userCtrl.comment)
router.route('/uncomment')
    .put(userCtrl.uncommnet)

router.route('/:userId')
    .get(userCtrl.requireSignin, userCtrl.read)
    .put(userCtrl.requireSignin, userCtrl.update)
    .delete(userCtrl.requireSignin, userCtrl.hasAuthorization, userCtrl.remove)

router.param('userId', userCtrl.userByID)

module.exports = router
