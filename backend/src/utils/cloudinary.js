import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = async(localFilePath, folder = "profiles") => {
    try {
        if (!localFilePath) {
            console.log("No file path provided");
            return null;
        }

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: folder,
            resource_type: "auto", // automatically detect image/video
            transformation: [
                { width: 500, height: 500, crop: "fill", gravity: "face" },
                { quality: "auto" }
            ]
        });

        // Delete local file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.log("Cloudinary Upload Success: ", result.secure_url);
        return result.secure_url; // Return the Cloudinary URL
        
    } catch (error) {
        console.log("Failed to upload image to Cloudinary: ", error);
        // Delete local file even if upload fails
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export { cloudinary, uploadToCloudinary };

