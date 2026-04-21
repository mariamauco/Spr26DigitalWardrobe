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
        type: {type: String, required: false, enum: ["Top", "top", "bottom", "Bottom", "shoe", "accessory", "outerwear", "one_piece"]}, 
        typeConfidence: {type: Number, required: false},
        subtype: {type: String, required:false, enum: [
            "t-shirt", "long sleeve shirt", "tank top", "sweater", "blouse", // top
             "jeans", "pants", "leggings","sweatpants", "shorts", "skirt", "trousers", // bottom
             "dress", "jumpsuit", "romper", "overalls", "bodysuit", //one_piece
             "jacket", "coat", "blazer", "cardigan", "vest", "trench coat", // outerwear
             "sneakers", "boots", "loafers", "flats", "heels", "sandals", // shoe
             "handbag", "backpack", "belt", "hat", "scarf", "jewelry", "sunglasses" // accessory
        ]},
        subtypeConfidence: {type: Number, required: false},
        colors: {type: [String], enum: [
            "black", "white", "gray", "red", "blue", "green", "yellow",
            "orange", "purple", "pink", "brown", "beige", "navy", "maroon",
             "teal", "cream", "burgundy", "rust", "camel", "mustard", "olive",
             "lavender", "coral", "grey"
        ], default: []}, // ex: ["blue", "white"],
        colorConfidence: {type: Number, required: false},
        tags: {type: [String], enum: [
            "casual", "streetwear",
            "bohemian", "summer", "winter", "spring", "fall",
            "party", "beach", "outdoor", "loungewear",
            "y2k", "academia",
            "formal, business casual",
            "vintage, cottage core",
            "sporty",
            "minimalist, classic",
            "coquette", "earthy", "goth"
        ], default: []},
        styleConfidence: {type: Number, required: false},

        imagePath: {type: String, required: true}, // URL to the clothing item image

        imageEmbedding: {type: [Number], validator: function (v) {return v.length === 512;},message: "imageEmbedding must be a 512-dimensional vector.", required:true}

    },

    { timestamps: true }

);

// create indexes for faster queries by user and category or colors
ClothingItemSchema.index({ user: 1, type: 1 });
ClothingItemSchema.index({ user: 1, colors: 1 });

export default mongoose.model("ClothingItem", ClothingItemSchema);