const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v4: uuidv4 } = require('uuid');

// Set up storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Generate unique name
    const ext = file.originalname.split('.').pop();
    const publicId = `${uuidv4()}`;
    
    // Determine folder and resource type based on mime type
    let folder = 'chat-media/files';
    let resource_type = 'raw'; // Default for documents/files

    if (file.mimetype.startsWith('image/')) {
      folder = 'chat-media/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/') || file.originalname.endsWith('.m4a') || file.originalname.endsWith('.caf') || file.originalname.endsWith('.mp3') || file.originalname.endsWith('.wav') || file.originalname.endsWith('.aac')) {
      folder = 'chat-media/voice';
      resource_type = 'video'; // Cloudinary treats audios as video resource type
    }

    return {
      folder: folder,
      public_id: publicId,
      resource_type: resource_type,
      // For raw files, Cloudinary requires original extension preserved or access via raw format
      format: resource_type === 'raw' ? ext : undefined
    };
  }
});

const ALLOWED_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'mp3', 'wav', 'aac', 'm4a', 'ogg', 'caf',
  'mp4', 'mov', 'mkv', '3gp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'zip', 'rar'
];

const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/caf', 'audio/x-caf',
  'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/3gpp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'application/rtf',
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'
];

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype) || 
                        file.mimetype.startsWith('image/') || 
                        file.mimetype.startsWith('audio/') || 
                        file.mimetype.startsWith('video/');

  if (isAllowedExt && isAllowedMime) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Supported formats: images, audio, video, pdf, docx, txt, zip.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/upload
const uploadMedia = (req, res) => {
  // Use multer middleware inline to catch errors
  const singleUpload = upload.single('media');

  singleUpload(req, res, function (err) {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({
      success: true,
      mediaUrl: req.file.path || req.file.secure_url,
      mediaName: req.file.originalname,
      mediaMimeType: req.file.mimetype,
      mediaSize: req.file.size
    });
  });
};

module.exports = { uploadMedia };
