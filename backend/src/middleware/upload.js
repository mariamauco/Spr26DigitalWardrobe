import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Store files on disk with safe unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Make a unique filename: userId_timestamp_random + extension
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = `u_${req.user.id}_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}${ext}`);
  },
});

// Only allow images
function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, or WEBP images are allowed."), false);
  }
  cb(null, true);
}

// Limit file size 
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


function resolveLocalUploadPath(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;

  let candidate = imagePath.trim();

  // If we receive a URL, use only its path portion.
  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).pathname;
    } catch {
      return null;
    }
  }

  // Normalize "uploads/x.jpg" and "/uploads/x.jpg" to a relative path.
  const uploadsPrefix = /^\/?uploads\//i;
  if (uploadsPrefix.test(candidate)) {
    candidate = candidate.replace(/^\//, "");
  } else if (path.isAbsolute(candidate)) {
    // For absolute paths, only allow files already under this project's uploads dir.
    const normalized = path.normalize(candidate);
    const uploadsRoot = path.normalize(uploadDir + path.sep);
    return normalized.startsWith(uploadsRoot) ? normalized : null;
  } else {
    // For non-uploads relative values, treat as unsupported input.
    return null;
  }

  return path.join(process.cwd(), candidate);
}


export function deleteImage(imagePath) {
  const resolvedPath = resolveLocalUploadPath(imagePath);
  if (!resolvedPath) return false;

  if (!fs.existsSync(resolvedPath)) return false;

  fs.unlinkSync(resolvedPath);
  return true;
}