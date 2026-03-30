PERSON_CHECK_PROMPTS = {
    "no_person":  "a clothing item alone with no person, isolated garment",
    "on_person":  "a clothing item worn by a person or model",
}

COARSE_PROMPTS = {
    "top": "a photo of an upper body base layer garment such as a t-shirt, blouse, sweater, or tank top, worn directly on the torso",
    "bottom": "a photo of a lower body garment such as jeans, trousers, shorts, leggings, or a skirt, worn on the legs or waist",
    "one_piece": "a photo of a single garment covering both the upper and lower body, such as a dress, jumpsuit, or romper, worn as a complete outfit",
    "outerwear": "a photo of a structured outer layer garment worn over other clothing, such as a jacket, coat, blazer, or cardigan",
    "shoe": "a photo of footwear worn on the feet, such as sneakers, boots, heels, sandals, or flats",
    "accessory": "a photo of a non-footwear fashion accessory such as a handbag, belt, hat, scarf, or jewelry",
}

FINE_CATEGORY_PROMPTS = {
    "top": {
        "t-shirt":          "a photo of a t-shirt or short sleeve top with no collar or buttons",
        "long sleeve shirt": "a photo of a long sleeve shirt or fitted long sleeve top",
        #"shirt":            "a photo of a button-down shirt or woven shirt with a collar",
        "blouse":           "a photo of a blouse with soft fabric, feminine details or ruffles",
        "tank top":         "a photo of a sleeveless tank top or camisole with thin straps",
        "sweater":          "a photo of a knit sweater, hoodie, or pullover",
        #"hoodie":           "a photo of a hoodie sweatshirt with a hood",
    },
    "bottom": {
        "jeans":        "a photo of denim jeans with visible stitching and pockets",
        "trousers":     "a photo of tailored trousers or dress pants with a clean drape",
        "pants":        "a photo of slim or relaxed fit chino or casual trousers",
        "leggings":     "a photo of form-fitting leggings or tights in stretchy fabric",
        "sweatpants":   "a photo of loose sweatpants or joggers in fleece or jersey fabric",
        "shorts":       "a photo of shorts above the knee",
        "skirt":        "a photo of a skirt, either mini, midi, or maxi length",
    },
    "one_piece": {
        "dress":        "a photo of a dress, either casual, midi, or formal length",
        "jumpsuit":     "a photo of a jumpsuit with long pants and a connected top",
        "romper":       "a photo of a short romper with shorts and a connected top",
        "overalls":     "a photo of overalls or dungarees with bib and straps",
        "bodysuit":     "a photo of a tight fitted bodysuit snapping at the crotch",
    },
    "outerwear": {
        "jacket":       "a photo of a casual jacket such as a bomber, denim, or zip-up jacket",
        "coat":         "a photo of a long coat or wool coat",
        "blazer":       "a photo of a tailored blazer with structured shoulders and lapels",
        "cardigan":     "a photo of a knit cardigan with buttons down the front",
        "vest":         "a photo of a sleeveless vest or gilet worn as outerwear",
        "trench coat":  "a photo of a long trench coat with a belt",
    },
    "shoe": {
        "sneakers":     "a photo of sneakers or athletic shoes with rubber soles",
        "boots":        "a photo of ankle or knee-high boots",
        "loafers":      "a photo of loafers or moccasins with a low flat sole",
        "flats":        "a photo of flat ballet flats or slip-on flats with no heel",
        "heels":        "a photo of high heels, stilettos, or block heels",
        "sandals":      "a photo of open-toe sandals or strappy sandals",
    },
    "accessory": {
        "handbag":      "a photo of a handbag, purse, or clutch carried by hand or on the shoulder",
        "backpack":     "a photo of a backpack worn on the back with two straps",
        "belt":         "a photo of a leather or fabric belt with a buckle",
        "hat":          "a photo of a hat, cap, or beanie worn on the head",
        "scarf":        "a photo of a scarf or wrap worn around the neck",
        "jewelry":      "a photo of jewelry such as earrings, necklace, bracelet, or ring",
        "sunglasses":   "a photo of sunglasses worn on the face",
    },
}

SLEEVE_PROMPTS = {
    "sleeveless":   "a photo of a sleeveless garment with no sleeves, such as a tank top, camisole, or strapless top",
    "short_sleeve": "a photo of a garment with short sleeves ending above the elbow",
    "long_sleeve":  "a photo of a garment with long sleeves extending to the wrist",
}

LEG_COVERAGE_PROMPTS = {
    "shorts":     "a photo of shorts with a hemline well above the knee",
    "mini_skirt": "a photo of a mini skirt with a hemline at mid-thigh or above",
    "midi_skirt": "a photo of a midi skirt with a hemline between the knee and ankle",
    "maxi_skirt": "a photo of a maxi skirt or long skirt reaching the ankle or floor",
    "pants":      "a photo of full-length pants or trousers reaching the ankle",
}

OUTERWEAR_COVERAGE_PROMPTS = {
    "light_layer":  "a photo of a lightweight outer layer such as a cardigan, thin jacket, or shirt jacket",
    "medium_layer": "a photo of a medium-weight outer layer such as a denim jacket, blazer, or fleece",
    "heavy_layer":  "a photo of a heavy outer layer such as a coat, parka, puffer jacket, or trench coat",
}