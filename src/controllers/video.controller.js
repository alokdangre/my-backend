import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { 
    deleteOnCloudinary, 
    deleteVideoOnCloudinary, 
    uploadOnCloudinary 
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async(req, res) => {

    const {page=1, limit=10, query, sortBy="createdAt", sortType, userId } = req.query

    //sortBy: title , description, channel(username), duration, views,

    if(req.user._id.toString() !== userId.toString()) {
        throw new ApiError(400, "User not logged in")
    }

    if(!query){
        throw new ApiError(400, "Give your query")
    }

    let sortCriteria = {}

    if(sortBy && sortType){
        sortCriteria[sortBy] = sortType === "desc" ? -1 : 1
    }

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    { title: { $regex: "D" } },
                    { description: { $regex: "D" } },
                ],
            },
        },
        {
            $sort: sortCriteria
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "fetched videos")
    )

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


    if(!videoFileLocalPath || !thumbnaileLocalPath){
        throw new ApiError(400, "video file and thumbnail both are required")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnaileLocalPath)

    // console.log(video)

    if (!video || !thumbnail) {
        throw new ApiError(400, "Video and Thumbnail file is required")
    }

    const uploadedVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        owner: req.user._id,
        isPublished: true,
        views: 0,
        duration: video.duration
    })

    if(!uploadedVideo) {
        throw new ApiError(400, "Something went wrong video not published")
    }

    const videoPublished = await Video.findById(uploadedVideo._id).select(
        "-owner"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoPublished, "Video uploaded successfully")
    )

})

const getVideoById = asyncHandler(async(req, res) => {

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing")
    }

    const video = await Video.findById(videoId)

    const user = await User.findById(req.user?._id, { watchHistory : 1 });

    if (!user){
        throw new ApiError(404, "User not found");
    } 

    // increment count based on watchHistory
      if (!user?.watchHistory.includes(videoId)) {
        const videos = await Video.findByIdAndUpdate(
            videoId,
            {
                $inc: { views: 1 },
            },
            {
                new : true
            }

        )

        const watchHistory = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $addToSet: {
                    watchHistory : videoId
                }
            },
            {
                new : true
            }
        )
        
    }

    const videos = await Video.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1,
                            _id: 1
                        }

                    }
                ]
            }
        },
    ])

    if(!video){
        throw new ApiError(400, "Something went wrong while fetching video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Video details fetched successfully")
    )

})

const updateVideo = asyncHandler( async(req, res) => {

    const {videoId} = req.params

    const {title, description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing")
    }
    
    const thumbnailLocalPath = req.file?.path
    
    const prevVideo = await Video.findById(videoId)
    
    if(prevVideo?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "The owner can only update the video thumbnail")
    }

    const thumbnailurl = prevVideo.thumbnail
    
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.url,
                title,
                description
            }
        },
        { new: true }
    )

    const deleted = await deleteOnCloudinary(thumbnailurl.slice(thumbnailurl.lastIndexOf('/')+1,thumbnailurl.lastIndexOf('.')))

    if(!deleted){
        console.log("not deleted")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "thumbnail updated")
        )

})

const deleteVideo = asyncHandler( async(req, res) => {

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing")
    }
    
    const prevVideo = await Video.findById(videoId)
    
    if(prevVideo?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "The owner can only delete the video")
    }

    const thumbnailurl = prevVideo.thumbnail
    const videourl = prevVideo.videoFile

    const deletedVideo = await Video.findByIdAndDelete(
        videoId,
        {new: true}
    )

    const deletedthumbnail = await deleteOnCloudinary(thumbnailurl.slice(thumbnailurl.lastIndexOf('/')+1,thumbnailurl.lastIndexOf('.')))

    const deleted = await deleteVideoOnCloudinary(videourl.slice(videourl.lastIndexOf('/')+1,videourl.lastIndexOf('.')))

    if(!deleted || !deletedthumbnail) {
        throw new ApiError(402, "Video and thumbnail not deleted from store")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "thumbnail updated")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {

    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    if (!videoId?.trim()) {
        throw new ApiError(400, "videoId is missing")
    }
    
    const prevVideo = await Video.findById(videoId)
    
    if(prevVideo?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "The owner can only publish or unpublish")
    }

    if(prevVideo.isPublished){

        const unPublish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: false
                }
            },
            { new: true }
        )

        if(!unPublish){
            throw new ApiError(400, "Video is still published something went wrong")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200 , unPublish, "Video unpublished successfully")
        )

    }
    else {

        const publish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: true
                }
            },
            { new: true }
        )

        if(!publish){
            throw new ApiError(400, "Video is still unpublished something went wrong")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200 , publish, "Video published successfully")
        )

    }

})

export {
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    publishAVideo,
    togglePublishStatus
}