import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const getAllVideos = asyncHandler(async(req, res) => {

})

const publishAVideo = asyncHandler(async(req, res) => {

    const {title, description} = req.body

    if (
        [title, description].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "title and description both are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    const thumbnaileLocalPath = req.files?.thumbnail[0]?.path

    console.log(videoFileLocalPath)
    console.log(thumbnaileLocalPath)
    if(!videoFileLocalPath || !thumbnaileLocalPath){
        throw new ApiError(400, "video file and thumbnail both are required")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnaileLocalPath)

    console.log(video)

    if (!video || !thumbnail) {
        throw new ApiError(400, "Video and Thumbnail file is required")
    }

    const uploadedVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        owner: req.user,
        isPublished: true,
        views: 0,
        duration: video.duration
    })

    if(!uploadedVideo) {
        throw new ApiError(400, "Something went wrong video not published")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, uploadedVideo, "Video uploaded successfully")
    )

})

const getVideoById = asyncHandler(async(req, res) => {

    
})

const updateVideo = asyncHandler( async(req, res) => {

})

const deleteVideo = asyncHandler( async(req, res) => {

})

const togglePublishStatus = asyncHandler(async (req, res) => {

})

export {
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    publishAVideo,
    togglePublishStatus
}