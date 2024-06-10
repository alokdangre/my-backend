import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler( async(req, res) => {

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    const liked = await Like.findOne({
        $and: [
            { video: videoId },
            { likedBy: req.user._id },
        ]
    })

    if(!liked){

        const likedVideo = await Like.create({
            likedBy: req.user._id,
            video: videoId
        })
    
        if(!likedVideo){
            throw new ApiError(400, "Unable to like the video")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideo, "Liked the video successfully")
        )

    }
    else {

        const dislikeVideo = await Like.deleteOne(liked._id)

        if(!dislikeVideo){
            throw new ApiError(400, "Unable to dislike the video")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, dislikeVideo, "Disliked the video successfully")
        )

    }

})

const toggleCommentLike = asyncHandler( async(req, res) => {

    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid params")
    }

    const liked = await Like.findOne({
        $and: [
            { comment: commentId },
            { likedBy: req.user._id }
        ]
    })

    if(!liked){

        const likedComment = await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })
    
        if(!likedComment){
            throw new ApiError(400, "Unable to like the comment")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, likedComment, "Liked the comment successfully")
        )

    }
    else {

        const dislikeComment = await Like.deleteOne(liked._id)

        if(!dislikeComment){
            throw new ApiError(400, "Unable to dislike the comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, dislikeComment, "Disliked the comment successfully")
        )

    }

})

const toggleTweetLike = asyncHandler( async(req, res) => {

    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid params")
    }

    const liked = await Like.findOne({
        $and: [
            { tweet: tweetId },
            { likedBy: req.user._id },
        ]
    })

    if(!liked){

        const likedTweet = await Like.create({
            likedBy: req.user._id,
            tweet: tweetId
        })
    
        if(!likedTweet){
            throw new ApiError(400, "Unable to like the tweet")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, likedTweet, "Liked the tweet successfully")
        )

    }
    else {

        const dislikeTweet = await Like.deleteOne(liked._id)

        if(!dislikeTweet){
            throw new ApiError(400, "Unable to dislike the tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, dislikeTweet, "Disliked the tweet successfully")
        )

    }

})

const getLikedVideos = asyncHandler( async(req, res) => {

    const likedVideos = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        likedBy: new mongoose.Types.ObjectId(req.user._id)
                    },
                    {
                        video: {$ne: null}
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "fetched liked videos")
    )
})

export {
    toggleTweetLike,
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
}