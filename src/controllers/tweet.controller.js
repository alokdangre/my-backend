import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler( async(req, res) => {
    const content = req.body.content

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user
    })

    const createdUserTweet = await Tweet.findById(tweet._id)

    if (!createdUserTweet) {
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUserTweet, "Tweet made by user Successfully")
    )

})

const getUserTweets = asyncHandler( async(req, res) => {

    const {userId} = req.params

    if(!userId){
        new ApiError(400, "User not logged in")
    }

    const allTweets = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'tweets', 
                localField: '_id', 
                foreignField: 'owner', 
                as: 'tweets'
            }
        },
        {
            $project: {
                avatar: 1, 
                tweets: 1, 
                username: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, allTweets, "fetched all tweets by user")
    )

})

const updateTweet = asyncHandler( async(req, res) => {
    const {tweetId} = req.params

    if (!tweetId?.trim()) {
        throw new ApiError(400, "tweetId is missing")
    }

    const {content} = req.body

    const tweetedUser = await Tweet.findById(tweetId)

    if(tweetedUser?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"This User cannot alter the tweet, Only the owner can change the tweet")
    }

    const updatedtweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {new: true}
    )

    if(!updatedtweet) {
        throw new ApiError(400, "Something went wrong your tweet not updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedtweet, "User tweet updated")
    )
})

const deleteTweet = asyncHandler( async(req, res) => {

    const {tweetId} = req.params

    if (!tweetId?.trim()) {
        throw new ApiError(400, "tweetId is missing")
    }
    
    const tweetedUser = await Tweet.findById(tweetId)

    if(tweetedUser?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"This User cannot alter the tweet, Only the owner can change the tweet")
    }

    const deleted = await Tweet.findByIdAndDelete(
        tweetId,
        {new: true}
    )

    return res
    .status(201)
    .json(
        new ApiResponse(201, deleted, "Tweet deleted by user successfully")
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}