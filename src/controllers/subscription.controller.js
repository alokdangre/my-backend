import mongoose from "mongoose";
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
        
    if(channelId === req.user?._id){
        throw new ApiError(401, "User cannot subscriber to his own channel")
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

    
})

const getSubscribedChannels = asyncHandler( async(req, res) => {

    const {subscriberId} = req.params

    if (!subscriberId?.trim()) {
        throw new ApiError(400, "channelId is missing")
    }


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}