import mongoose from "mongoose";

const ClothingItemSchema = new mongoose.Schema(
    
    {
        // link each clothing item to a user
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // clothing item details
        name: {type: String, required: true}, // ex: Blue Jean Jacket
        type: {type: String, required: true, enum: ["Top", "top", "bottom", "Bottom", "Footwear", "Accessories"]}, 
        subtype: {type: String, required:false, enum: [
            "t-shirt", "long sleeve shirt", "tank top", "sweater",
             "jeans", "pants", "leggings","sweatpants", "shorts", "skirt",
             "dress", "jumpsuit", "romper", "overalls", "bodysuit", 
             "jacket", "coat", "blazer", "vest",
             "sneakers", "boots", "heels", "sandals", 
             "handbag", "backpack", "belt", "hat", "scarf", "jewelry", "sunglasses"
            ]},
        colors: {type: [String], default: []}, // ex: ["blue", "white"],
        tags: {type: [String], enum: ["casual", "formal", "summer", "winter", "workout"], default: []},

        imagePath: {type: String, required: true}, // URL to the clothing item image

        imageEmbedding: {type: [Number], validator: function (v) {return v.length === 512;},message: "imageEmbedding must be a 512-dimensional vector.", required:true}

    },

    { timestamps: true }

);

// create indexes for faster queries by user and category or colors
ClothingItemSchema.index({ user: 1, type: 1 });
ClothingItemSchema.index({ user: 1, colors: 1 });

export default mongoose.model("ClothingItem", ClothingItemSchema);