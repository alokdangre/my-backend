import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url)

        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        console.log("hi")
        //remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath) 
        return null;
    }
}

const deleteOnCloudinary = async (FilePublicId) => {
    try {
        if(!FilePublicId) return null;
        //delete the image on cloudinary
        const response = await cloudinary.uploader.destroy(FilePublicId)

        console.log(response)
        return response
    } catch (error) {
        console.log("image not deleted from cloudinary")
        console.log(error)
    }
}

const deleteVideoOnCloudinary = async (FilePublicId) => {
    try {
        if(!FilePublicId) return null;
        //delete the image on cloudinary
        const response = await cloudinary.uploader.destroy(FilePublicId, { resource_type: 'video' })

        console.log(response)
        return response
    } catch (error) {
        console.log("image not deleted from cloudinary")
        console.log(error)
    }
}

export {
    uploadOnCloudinary,
    deleteOnCloudinary,
    deleteVideoOnCloudinary
}