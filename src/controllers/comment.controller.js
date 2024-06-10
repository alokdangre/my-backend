import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler( async(req, res) => {

    const {videoId} = req.params

    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    if(!comments){
        throw new ApiError(400, "Something went wrong unable to fetch comments")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )

})

const addComment = asyncHandler( async(req, res) => {

    const {videoId} = req.params

    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid params")
    }

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    })

    if(!comment) {
        throw new ApiError(400, "Something went wrong cannot comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added to video successfully"
        )
    )

})

const updateComment = asyncHandler( async(req, res) => {

    const {commentId} = req.params

    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid params")
    }

    const comment = await Comment.findById(commentId)

    if(req.user._id.toString() !== comment.owner.toString()){
        throw new ApiError(400, "Only user can update his/her comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )

})

const deleteComment = asyncHandler(async(req, res) => {

    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid params")
    }

    const comment = await Comment.findById(commentId)

    if(req.user._id.toString() !== comment.owner.toString()){
        throw new ApiError(400, "Only user can delete his/her comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(
        commentId,
        { new: true }
    )

    if(!deletedComment){
        throw new ApiError(400, "Comment unable to deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
    )

})

export {
    getVideoComments,
    addComment,
    deleteComment,
    updateComment
}
