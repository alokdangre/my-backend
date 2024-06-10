import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Playlist } from "../models/playlist.model.js";


const createPlaylist = asyncHandler( async(req, res) => {

    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(400, "title and description both are required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user._id
    })

    if(!playlist) {
        throw new ApiError(400, "Something went wrong while creating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "You have successfully created")
    )
})

const getUserPlaylists = asyncHandler( async(req, res) => {

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "send valid userId")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if(!playlists){
        throw new ApiError(400, "Something went wrong unable to fetch playlists")
    }

    return res.
    status(200)
    .json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    )

})

const getPlaylistById = asyncHandler( async(req, res) => {

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid params")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Something went wrong playlist cannot be fetched")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "fetched playlist successfully")
    )

})

const addVideoToPlaylist = asyncHandler( async(req, res) => {

    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    const playlist = await Playlist.findById(playlistId)

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new ApiError(400, "owner can only add videos to the playlist")
    }

    const playlistUpdated = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        { new: true }
    )

    if(!playlistUpdated){
        throw new ApiError(400, "Something went wrong unable to create playlist")
    }

    return res
    .status(400)
    .json(
        new ApiResponse(200, playlistUpdated, "Video added to playlist successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler( async(req, res) => {

    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    const playlist = await Playlist.findById(playlistId)

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new ApiError(400, "owner can only remove videos to the playlist")
    }

    const videoRemoved = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    )

    if(!videoRemoved){
        throw new ApiError(400, "Something went wrong unable to remove video")
    }

    return res
    .status(400)
    .json(
        new ApiResponse(200, videoRemoved, "Video removed to playlist successfully")
    )

})

const deletePlaylist = asyncHandler( async(req, res) => {

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid params")
    }

    const playlist = await Playlist.findById(playlistId)

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new ApiError(400, "owner can only delete the playlist")
    }

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistDeleted){
        throw new ApiError(400, "Something went wrong unable to delete playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlistDeleted, "Successfully deleted playlist")
    )

})

const updatePlaylist = asyncHandler( async(req, res) => {

    const {playlistId} = req.params

    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid params")
    }

    const playlist = await Playlist.findById(playlistId)

    if(req.user._id.toString() !== playlist.owner.toString()){
        throw new ApiError(400, "owner can only remove videos to the playlist")
    }

    if(!name || !description){
        throw new ApiError(400, "Name and description required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}