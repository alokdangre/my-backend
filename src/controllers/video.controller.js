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

const getAllVideos = asyncHandler(async(req, res) => {

    const {page=1, limit=10, query, sortBy="Relevance", sortType="Videos" , order="desc", userId } = req.query

    //sortType: Video, Channel, //Playlist
    //sortBy:{ 
    //     Relevence: (closest to query), 
    //     Upload date: (extra sort by created date [lastest to old]), 
    //     View count: (extra sort by views)
    // }

    if(!query){
        throw new ApiError(400, "Give your query")
    }



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

    if(!video){
        throw new ApiError(400, "Something went wrong while fetching video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video details fetched successfully")
    )

})

const updateVideo = asyncHandler( async(req, res) => {

    const {videoId} = req.params

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
                thumbnail: thumbnail.url
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