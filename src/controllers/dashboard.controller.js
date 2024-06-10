import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler( async(req,res) => {

    if(!req.user._id){
        throw new ApiError(400, "Unauthorized call")
    }

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            channel: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $addFields: {
                            likes: {
                                $size: "$likes"
                            }
                        }
                    },
                    {
                        $project: {
                            likes: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "tweet",
                            as: "likesToTweet"
                        }
                    },
                    {
                        $addFields: {
                            likesToTweet: {
                                $size: "$likesToTweet"
                            },
                        }
                    },
                    {
                        $project: {
                            likesToTweet: 1,
                            content: 1,
                            createdAt: 1
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                subscribers: {
                    $size: "$subscribers"
                },
                subscribedToChannel: {
                    $size: "$subscribedTo"
                },
                totalTweets: {
                    $size: "$tweets"
                },
            }
        },
        {
            $project: {
                videos: 1,
                totalVideos: 1,
                subscribedToChannel: 1,
                totalTweets: 1,
                tweets: 1,
                subscribedTo: 1,
                subscribers: 1,
                createdAt: 1,
                coverImage: 1,
                avatar: 1,
                fullname: 1,
                email: 1,
                username: 1
            }
        }
    ])

    if(!user) {
        throw new ApiError(400, "Something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Channel stats fetched successfully")
    )

})

const getChannelVideos = asyncHandler( async(req, res) => {

    if(!req.user._id){
        throw new ApiError(400, "Unauthorized call")
    }

    const videos = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "comments",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "likes",
                                        localField: "_id",
                                        foreignField: "comment",
                                        as: "likesToComment"
                                    }
                                },
                                {
                                    $project: {
                                        likesToComment: { $size: "$likesToComment" },
                                        owner: 1,
                                        content: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            likes: { $size: "$likes"},
                            comments: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                coverImage: 1,
                avatar: 1,
                fullname: 1,
                email: 1,
                username: 1,
                videos: 1
            }
        }
    ]) 

    if(!videos) {
        throw new ApiError(400, "Something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Channel stats fetched successfully")
    )

})

export {
    getChannelStats,
    getChannelVideos
}