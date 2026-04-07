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
        name: {type: String, required: false}, // ex: Blue Jean Jacket
        type: {type: String, lowercase:true, required: false, enum: ["top", "bottom", "shoe", "accessory", "outerwear", "one piece"]}, 
        typeConfidence: {type: Number, required: false, min:0, max:1},
        subtype: {type: String, lowercase:true, required:false, enum: [
            "t-shirt", "long sleeve shirt", "tank top", "sweater", // top
             "jeans", "pants", "leggings","sweatpants", "shorts", "skirt", // bottom
             "dress", "jumpsuit", "romper", "overalls", "bodysuit", //one_piece
             "jacket", "coat", "blazer", "vest", // outerwear
             "sneakers", "boots", "heels", "sandals", // shoe
             "handbag", "backpack", "belt", "hat", "scarf", "jewelry", "sunglasses" // accessory
            ]},
        subtypeConfidence: {type: Number, required: false, min:0, max:1},
        colors: {type: [String], lowercase:true, default: []}, // ex: ["blue", "white"],
        tags: {type: [String], lowercase:true, enum: [
            "casual", "formal", "summer", "winter", "business", "sporty",
            "streetwear", "vintage", "bohemian", "minimalist", "spring", 
            "fall", "party", "beach", "outdoor", "loungewear", "y2k", 
            "academia", "cottage", "classic", "clean girl", "old money",
            "coquette", "earthy", "hippie"], default: []},

        imagePath: {type: String, required: true}, // URL to the clothing item image

        imageEmbedding: {type: [Number], validator: function (v) {return v.length === 512;},message: "imageEmbedding must be a 512-dimensional vector.", required:true}

    },

    { timestamps: true }

);

// create indexes for faster queries by user and category or colors
ClothingItemSchema.index({ user: 1, type: 1 });
ClothingItemSchema.index({ user: 1, colors: 1 });

export default mongoose.model("ClothingItem", ClothingItemSchema);