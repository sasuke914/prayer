const Prayer = require('../models/prayerModel')
const errorHandler = require('../helpers/dbErrorHandler')
const formidable = require('formidable')
const fs = require('fs')

const create = (req, res, next) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
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
    let prayer = new Prayer(fields)
    prayer.postedBy = req.profile
    if (files.photo) {
      prayer.photo.data = fs.readFileSync(files.photo[0].filepath)
      prayer.photo.contentType = files.photo[0].mimetype
    }
    try {
      let result = await prayer.save()
      res.json(result)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
  })
}

const postByID = async (req, res, next, id) => {
  try {
    let prayer = await Prayer.findById(id).populate('postedBy', '_id userName').exec()
    if (!prayer)
      return res.status('400').json({
        error: "Prayer not found"
      })
    req.post = prayer
    next()
  } catch (err) {
    return res.status('400').json({
      error: "Could not retrieve use post"
    })
  }
}

const list = async (req, res) => {
  try {
    let prayers = await Prayer.find()
    res.json(prayers)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const prayerOne = async (req, res) => {
  try {
    res.json(req.post)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const listByUser = async (req, res) => {
  try {
    let prayers = await Prayer.find({ postedBy: req.profile._id })
      .populate('energys.postedBy', '_id userName')
      .populate('postedBy', '_id userName')
      .sort('-created')
      .exec()
    res.json(prayers)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const listNewsFeed = async (req, res) => {
  let following = req.profile.following
  following.push(req.profile._id)
  try {
    let prayers = await Prayer.find({ postedBy: { $in: req.profile.following } })
      .populate('energys.postedBy', '_id userName')
      .populate('postedBy', '_id userName')
      .sort('-created')
      .exec()
    res.json(prayers)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  let prayer = req.post
  console.log(prayer)
  try {
    let deletedPrayer = await Prayer.deleteOne({ _id: prayer._id });
    res.json(deletedPrayer)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const photo = (req, res, next) => {
  res.set("Content-Type", req.post.photo.contentType)
  return res.send(req.post.photo.data)
}

const energy = async (req, res) => {
  let energy = req.body.energy
  energy.postedBy = req.body.userId
  energy.userName = req.body.userName
  energy.location = req.body.location
  energy.faith = req.body.faith
  try {
    let result = await Prayer.findByIdAndUpdate(req.body.postId, { $push: { energys: energy } }, { new: true })
      .populate('energys.postedBy', '_id userName')
      .populate('postedBy', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const prayerUpdate = async (req, res) => {
  try {
    let prayer = await Prayer.findByIdAndUpdate(req.body.prayerId, { feed: req.body.feed }, { new: true })
    res.json(prayer)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const unenergy = async (req, res) => {
  let energy = req.body.energy
  console.log("energy:", energy)
  try {
    let result = await Prayer.findByIdAndUpdate(req.body.userId, { $pull: { energys: { _id: energy._id } } }, { new: true })
      .populate('energys.postedBy', '_id userName')
      .populate('postedBy', '_id userName')
      .exec()
    res.json(result)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const isPoster = (req, res, next) => {
  let isPoster = req.post && req.auth && req.post.postedBy._id === req.auth._id
  if (!isPoster) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  }
  next()
}

module.exports = {
  listByUser,
  listNewsFeed,
  prayerOne,
  list,
  create,
  postByID,
  remove,
  photo,
  energy,
  prayerUpdate,
  unenergy,
  isPoster
}
