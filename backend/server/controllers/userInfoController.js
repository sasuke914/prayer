const User = require('../models/userInfoModel')
const extend = require('lodash/extend')
const errorHandler = require('../helpers/dbErrorHandler')
const generateToken = require('../utils/generateTokens')
const jwt = require('jsonwebtoken')
const formidable = require('formidable')
const fs = require('fs')
const path = require('path')
const expressJwt = require('express-jwt')
const { config } = require('../config/db')

const create = async (req, res) => {
  try {
    const user = new User(req.body)
    const { email } = req.body
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(200).json({ error: "User already exists" });
    } else {
      await user.save()
      return res.status(200).json({
        message: "Successfully signed up!"
      })
    }
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    // Generate JWT tokens
    let token = generateToken(res, user._id);
    res.status(200).json({
      token,
      message: "Logged in successfully",
      user: user
    });
  } else {
    return res.status(200).json({
      error: "Invalid email or password"
    })
  }
};

const signout = async (req, res) => {
  // Destroying jwt token from te cookie
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
};

const requireSignin = expressJwt({
  secret: config.jwtSecret,
  userProperty: 'auth'
})

// defining admin middleware
const hasAuthorization = (req, res, next) => {
  const authorized = req.profile && req.auth && req.profile._id.toString() === req.auth._id.toString()
  if (authorized) {
    next();
  } else {
    return res.status(401).json({
      error: "Not authorized as admin"
    })
  }
};

const userByID = async (req, res, next, id) => {
  try {
    let user = await User.findById(id)
    if (!user)
      return res.status('400').json({
        error: "User not foud"
      })
    req.profile = user
    next()
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve user"
    })
  }
}

const read = (req, res) => {
  return res.json(req.profile)
}

const list = async (req, res) => {
  try {
    let users = await User.find()
    res.json(users)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const update = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded"
      })
    }
    const ensureSingleValueFields = (fields) => {
      for (const key in fields) {
        if (Array.isArray(fields[key])) {
          fields[key] = fields[key][0];
        }
      }
    };
    ensureSingleValueFields(fields);
    let user = req.profile
    user = extend(user, fields)
    user.updated = Date.now()
    if (files.photo) {
      user.photo.data = fs.readFileSync(files.photo[0].filepath)
      user.photo.contentType = files.photo[0].mimetype
    }
    try {
      await user.save()
      res.json(user)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
  })
}

const remove = async (req, res) => {
  try {
    let user = req.profile
    let deletedUser = await User.deleteOne({ _id: user._id });
    res.json(deletedUser)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const photo = (req, res, next) => {
  if (req.profile.photo.data) {
    res.set("Content-Type", req.profile.photo.contentType)
    return res.send(req.profile.photo.data)
  }
  next()
}

const defaultPhoto = (req, res) => {
  const imagePath = path.join(__dirname, 'avatar.png');
  fs.readFile(imagePath, (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('Error retrieving image');
      return;
    }

    res.set('Content-Type', 'image/png');
    return res.send(data);
  });
}

const addFollowing = async (req, res, next) => {
  try {
    console.log(req.body)
    await User.findByIdAndUpdate(req.body.userId, { $push: { following: req.body.followId } })
    next()
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const addFollower = async (req, res) => {
  try {
    let result = await User.findByIdAndUpdate(req.body.followId, { $push: { followers: req.body.userId } }, { new: true })
      .populate('following', '_id userName')
      .populate('followers', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const removeFollowing = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.body.userId, { $pull: { following: req.body.unfollowId } })
    next()
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
const removeFollower = async (req, res) => {
  try {
    let result = await User.findByIdAndUpdate(req.body.unfollowId, { $pull: { followers: req.body.userId } }, { new: true })
      .populate('following', '_id userName')
      .populate('followers', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const findPeople = async (req, res) => {
  let following = req.profile.following
  following.push(req.profile._id)
  try {
    let users = await User.find({ _id: { $nin: following } }).select('name')
    res.json(users)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}


const comment = async (req, res) => {
  let comment = req.body.feed
  comment.postedBy = req.body.userId
  comment.dataId = req.body.dataId
  comment.userName = req.body.userName
  comment.title = req.body.title
  try {
    let result = await User.findByIdAndUpdate(req.body.postId, { $push: { comments: comment } }, { new: true })
      .populate('comments.postedBy', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
const uncommnet = async (req, res) => {
  let comment = req.body.feed
  try {
    let result = await User.findByIdAndUpdate(req.body.userId, { $pull: { comments: { _id: comment._id } } }, { new: true })
      .populate('comments.postedBy', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

module.exports = {
  create,
  userByID,
  read,
  list,
  remove,
  update,
  photo,
  defaultPhoto,
  signin,
  signout,
  requireSignin,
  hasAuthorization,
  addFollowing,
  addFollower,
  removeFollowing,
  removeFollower,
  findPeople,
  comment,
  uncommnet
}
