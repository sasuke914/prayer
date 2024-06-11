const express = require('express')
const userCtrl = require('../controllers/userInfoController')

const router = express.Router()

router.route('/auth/signin')
  .post(userCtrl.signin)
router.route('/auth/signout')
  .post(userCtrl.signout)

module.exports = router
