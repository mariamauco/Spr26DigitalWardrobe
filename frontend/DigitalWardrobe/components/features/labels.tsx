// Shape returned by the clothing API and used throughout this screen.
export type ClothingItem = {
  _id: string;
  user: string;
  name: string;
  type: string;
  subtype?: string;
  colors?: string[];
  tags?: string[];
  imagePath: string;
  createdAt?: string;
  updatedAt?: string;
};

// Top-level categories shown in the type dropdown.
export const CLOTHING_TYPES = ["Top", "Bottom", "One Piece", "Outerwear", "Shoe", "Accessory"];

// Available subtypes depend on the selected top-level type.
export const SUBTYPES: Record<string, string[]> = {
  Top:          ["T-Shirt", "Long Sleeve Shirt", "Blouse", "Tank Top", "Sweater"],
  Bottom:       ["Jeans", "Trousers", "Pants", "Leggings", "Sweatpants", "Shorts", "Skirt"],
  "One Piece":  ["Dress", "Jumpsuit", "Romper", "Overalls", "Bodysuit"],
  Outerwear:    ["Jacket", "Coat", "Blazer", "Cardigan", "Vest", "Trench Coat"],
  Shoe:         ["Sneakers", "Boots", "Loafers", "Flats", "Heels", "Sandals"],
  Accessory:    ["Handbag", "Backpack", "Belt", "Hat", "Scarf", "Jewelry", "Sunglasses"],
};

export const typeToSectionKey = new Map<string, string>([
  ["top", "tops"],
  ["bottom", "bottoms"],
  ["one_piece", "onePieces"],
  ["outerwear", "outerwear"],
  ["shoe", "shoes"], 
  ["accessory", "accessories"]
]);


// Selectable metadata chips for each item in the edit modal.
export const COLORS = [
  "black", "white", "gray", "red", "blue", "green", "yellow",
  "orange", "purple", "pink", "brown", "beige", "navy", "maroon",
  "teal", "cream", "burgundy", "rust", "camel", "mustard", "olive",
  "lavender", "coral", "grey"
];

export const TAGS = [
  "casual", "streetwear",
  "bohemian", "summer", "winter", "spring", "fall",
  "party", "beach", "outdoor", "loungewear",
  "y2k", "academia",
  "formal, business casual",
  "vintage, cottage core",
  "sporty",
  "minimalist, classic",
  "coquette", "earthy", "goth"
];

// Internal section identifiers used for grouping and ordering on this page.
export type SectionKey = "tops" | "bottoms" | "onePieces" | "outerwear" | "shoes" | "accessories" | "other";

export const SECTION_KEYS: SectionKey[] = ["tops", "bottoms", "onePieces", "outerwear", "shoes", "accessories", "other"];
