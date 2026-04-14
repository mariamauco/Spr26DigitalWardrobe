import mongoose from "mongoose";

const ProfilePicSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true
        },

        image_path: {type: String, required:true},
    },

    { timestamps: true }
);

export default mongoose.model("ProfilePic", ProfilePicSchema);