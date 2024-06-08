import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler( async(req, res) => {

    const {channelId} = req.params
    
    if (!channelId?.trim()) {
        throw new ApiError(400, "channelId is missing")
    }
    
    if(channelId === req.user?._id.toString()){
        throw new ApiError(401, "User cannot subscriber to his own channel")
    }

    if(isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid id")
    }

    //if channel exists
    const channel = await User.findById(channelId)
    
    if(!channel){
        throw new ApiError(400, "Channel does not exists")
    }

    const user = await User.findById(req.user?._id)

    const isSubscribed = await Subscription.find({
        $and: [{channel}, {subscriber: user}]
    })

    if(!isSubscribed[0]?._id) {

        const subscription = await Subscription.create({
            channel: channel,
            subscriber: user
        })
    
        if(!subscription) {
            throw new ApiError(401, "Something went wrong your are enable to subscribe the channel")
        }


        return res
        .status(200)
        .json(
            new ApiResponse(200, subscription, "You subscribed the channel")
        )

    }
    else {
        const unSubscribed = await Subscription.findByIdAndDelete(
            isSubscribed[0]._id,
            {new: true}
        )

        console.log(unSubscribed)

        if(!unSubscribed){
            throw new ApiError(400, "Something went wrong we are unable to unsubscribe you")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, unSubscribed, "You unSubscribed the channel")
        )
    }

})

const getUserChannelSubscribers = asyncHandler( async(req, res) => {

    const {channelId} = req.params

    if (!channelId?.trim()) {
        throw new ApiError(400, "channelId is missing")
    }

    if(isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid id")
    }

    const subscribers = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
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
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "fetched subscribers")
    )
    
})

const getSubscribedChannels = asyncHandler( async(req, res) => {

    const {subscriberId} = req.params

    if (!subscriberId?.trim()) {
        throw new ApiError(400, "channelId is missing")
    }

    if(isValidObjectId(subscriberId)) {
        throw new ApiError(401, "Invalid id")
    }

    const subscribedChannel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1,
                                        email: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscribedChannel: 1,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannel, "fetched all subscribed channels")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}