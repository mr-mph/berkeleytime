import { PutObjectCommand } from "@aws-sdk/client-s3";
import { type Application, type Request, type Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import { config } from "../../../../../packages/common/src/utils/config";
import { isStaffAdminEnabled } from "../../helpers/staffAdmin";
import { createS3Client } from "../../utils/s3Client";

// Configure multer to handle file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * POST /api/uploadStaffImage
 *
 * Uploads an image file to the S3 bucket configured for staff photos.
 * Disabled unless STAFF_ADMIN_ENABLED=true; requires an authenticated staff session.
 */
export default (app: Application): void => {
  app.post(
    "/uploadStaffImage",
    upload.single("image"),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!isStaffAdminEnabled()) {
          res.status(403).json({ error: "Staff admin features are disabled" });
          return;
        }

        if (!req.isAuthenticated?.() || !req.user) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        const user = req.user as { staff?: boolean };
        if (!user.staff) {
          res
            .status(403)
            .json({ error: "Only staff members can upload images" });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            error:
              "No image file provided. Please upload a file with field name 'image'",
          });
          return;
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split(".").pop() || "jpg";
        const fileName = `${uuidv4()}.${fileExtension}`;

        // Create S3 client
        const s3Client = createS3Client();

        // Upload to S3
        const putCommand = new PutObjectCommand({
          Bucket: "images",
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });

        await s3Client.send(putCommand);

        res.status(200).json({
          success: true,
          fileName,
          url: `${config.s3.imagesAccessUrl}/${fileName}`,
        });
      } catch (error: unknown) {
        console.error("[Staff Upload API] Error:", error);

        if (
          error instanceof Error &&
          error.message === "Only image files are allowed"
        ) {
          res.status(400).json({
            error: "Invalid file type. Only image files are allowed",
          });
          return;
        }

        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "LIMIT_FILE_SIZE"
        ) {
          res.status(400).json({
            error: "File too large. Maximum file size is 5MB",
          });
          return;
        }

        res.status(500).json({
          error: "Failed to upload image",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};
