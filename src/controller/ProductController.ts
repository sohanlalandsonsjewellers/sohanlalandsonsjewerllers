import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { generateSKU } from "../utils/generateSKU.js";
import { v2 as cloudinary } from "cloudinary";

// ===================================================================
// 🚀 CLOUDINARY CONFIGURATION (DYNAMICALLY CONNECTED TO YOUR .ENV KEYS)
// ===================================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔥 HELPER FUNCTION: Extracts Cloudinary Public ID from a secure URL safely
function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes("cloudinary.com")) return null;
    
    // Cloudinary URL structure: .../upload/v12345/folder/subfolder/filename.ext
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let path = parts[1]; // e.g., "v1779599409/sohanlal_jewellers/products/z1mgrljflyxrcru1h9ae.webp"
    
    // 1. Version number ("v177...") hatao
    const segments = path.split("/");
    if (segments[0].startsWith("v")) {
      segments.shift(); 
    }
    
    // 2. Ab bacha "sohanlal_jewellers/products/z1mgrljflyxrcru1h9ae.webp"
    const fullPath = segments.join("/");
    
    // 3. Extension hatao (webp/jpg)
    const publicId = fullPath.substring(0, fullPath.lastIndexOf("."));
    
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
}

class ProductController {

  // ===================================================================
  // ========================== ADMIN CONTROL OPERATIONS ================
  // ===================================================================

  // 1. CREATE PRODUCT (WITH WEBP BASE64 UPLOAD PIPELINE)
  static async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (!data.name || !data.category || data.price == null) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      let productImagesUrls: string[] = [];
      let incomingImages = [];

      if (files && files['productImages']) {
        incomingImages = files['productImages'].map(f => f.path);
      } else if (Array.isArray(data.images)) {
        incomingImages = data.images;
      }

      if (incomingImages && incomingImages.length > 0) {
        for (let i = 0; i < incomingImages.length; i++) {
          const imgStr = incomingImages[i];

          if (imgStr.startsWith("data:image")) {
            // cloudanary options mein ye add kar do
            const uploadRes = await cloudinary.uploader.upload(imgStr, {
              folder: "sohanlal_jewellers/products",
              resource_type: "image",
              format: "webp",          // 🚀 Backend se force conversion
              quality: "auto:good",    // 🚀 Cloudinary ko bolo ki size optimize kare
              transformation: [
                { width: 800, crop: "limit" } // 🚀 Image 800px se badi nahi hogi
              ]
            });
            productImagesUrls.push(uploadRes.secure_url);
          } else {
            productImagesUrls.push(imgStr);
          }
        }
      }

      let bannerPayload: any = null;
      const isBannerFlag = data.isBanner === 'true' || data.isBanner === true;

      if (isBannerFlag || files?.['desktopBanner'] || files?.['mobileBanner']) {
        let desktopUrl = files?.['desktopBanner'] ? files['desktopBanner'][0].path : (data.bannerDesktopUrl || null);
        let mobileUrl = files?.['mobileBanner'] ? files['mobileBanner'][0].path : (data.bannerMobileUrl || null);

        if (desktopUrl && desktopUrl.startsWith("data:image")) {
          const upDesktop = await cloudinary.uploader.upload(desktopUrl, {
            folder: "sohanlal_jewellers/banners",
            resource_type: "image"
          });
          desktopUrl = upDesktop.secure_url;
        }

        if (mobileUrl && mobileUrl.startsWith("data:image")) {
          const upMobile = await cloudinary.uploader.upload(mobileUrl, {
            folder: "sohanlal_jewellers/banners",
            resource_type: "image"
          });
          mobileUrl = upMobile.secure_url;
        }

        bannerPayload = {
          desktopUrl,
          mobileUrl
        };
      }

      const sku = generateSKU(data.name, data.category);

      const product = await prisma.product.create({
        data: {
          name: data.name,
          category: data.category,
          subCategory: data.subCategory || "Women",
          price: Number(data.price),
          weight: Number(data.weight || 0),
          description: data.description || "",
          images: productImagesUrls,
          isBanner: isBannerFlag,
          bannerImages: bannerPayload,
          sku,
          stock: Number(data.stock || 0),
        },
      });

      return res.json({ success: true, product });
    } catch (err: any) {
      console.error("Crash inside Admin Product Overhaul Create Engine:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. GET ALL PRODUCTS FOR ADMIN GRID LIST MATRIX
  static async getAll(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { created_at: "desc" },
      });
      return res.json({ success: true, products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  // 3. GET SPECIFIC PRODUCT BY ID FOR MODAL BINDING
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return res.status(404).json({ success: false, message: "Product profile not found" });
      }
      return res.json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  // 4. 🔥 FIXED MASTER UPDATE OPERATION (HANDLES BOTH REMOVALS & NEW BASE64 UPLOADS)
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent conversion type crashes
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.stock !== undefined) updates.stock = Number(updates.stock);
      if (updates.weight !== undefined) updates.weight = Number(updates.weight);

      // A. Fetch current database record baseline
      const currentProduct = await prisma.product.findUnique({ where: { id } });
      if (!currentProduct) {
        return res.status(404).json({ success: false, message: "Product profile not found" });
      }

      // B. PIPELINE CASE 1: CLEANUP UNWANTED/DELETED IMAGES FROM CLOUDINARY
      if (updates.images && Array.isArray(updates.images) && currentProduct.images && Array.isArray(currentProduct.images)) {
        const oldImages = currentProduct.images as string[];
        const incomingImages = updates.images as string[];

        // Extract images that existed before but were removed on frontend click
        const removedImages = oldImages.filter(url => !incomingImages.includes(url));

        for (const removedUrl of removedImages) {
          const pid = getPublicIdFromUrl(removedUrl);
          console.log("➡️ UPDATE TRACE: CLEANING REMOVED IMAGE:", pid);
          if (pid) {
            const delLog = await cloudinary.uploader.destroy(pid);
            console.log("💥 UPDATE TRACE: DESTROY ACTION RESPONSE:", delLog);
          }
        }

        // C. PIPELINE CASE 2: PROCESS & UPLOAD NEWLY ADDED BASE64 IMAGES DURING EDIT
        const finalizedUrls: string[] = [];
        for (const imgStr of incomingImages) {
          if (imgStr.startsWith("data:image")) {
            console.log("🚀 UPDATE TRACE: UPLOADING NEW IMAGES ADDED IN EDIT MODE...");
            const uploadRes = await cloudinary.uploader.upload(imgStr, {
              folder: "sohanlal_jewellers/products",
              resource_type: "image"
            });
            finalizedUrls.push(uploadRes.secure_url);
          } else {
            // Keep existing valid HTTPS secure URLs as they are
            finalizedUrls.push(imgStr);
          }
        }

        // Re-assign back clean filtered tracking arrays array loops 
        updates.images = finalizedUrls;
      }

      // D. PIPELINE CASE 3: INTERCEPT DYNAMIC RESPONSIVE BANNER BASE64 UPDATES IF ANY
      if (updates.bannerImages) {
        let dUrl = updates.bannerImages.desktopUrl;
        let mUrl = updates.bannerImages.mobileUrl;

        if (dUrl && dUrl.startsWith("data:image")) {
          const upDesk = await cloudinary.uploader.upload(dUrl, { folder: "sohanlal_jewellers/banners" });
          updates.bannerImages.desktopUrl = upDesk.secure_url;
        }
        if (mUrl && mUrl.startsWith("data:image")) {
          const upMob = await cloudinary.uploader.upload(mUrl, { folder: "sohanlal_jewellers/banners" });
          updates.bannerImages.mobileUrl = upMob.secure_url;
        }
      }

      // Commit finalized clean data fields structure into MongoDB
      const product = await prisma.product.update({
        where: { id },
        data: updates,
      });

      return res.json({ success: true, product });
    } catch (err) {
      console.error("Crash logs inside Admin Product Update Engine:", err);
      return res.status(500).json({ success: false });
    }
  }

  // 5. DESTROY REMOVE PIPELINE SYSTEM (POORA PRODUCT DELETE LOGIC WITH FULL WORKSPACE CLEANUP)
  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingProduct = await prisma.product.findUnique({ where: { id } });

      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const productObj = existingProduct as any;

      if (productObj.images && Array.isArray(productObj.images)) {
        for (const imgUrl of productObj.images) {
          const pid = getPublicIdFromUrl(imgUrl);
          console.log("TARGET PUBLIC ID TO DELETE:", pid);

          if (pid) {
            const cloudDelRes = await cloudinary.uploader.destroy(pid);
            console.log("CLOUDINARY DELETION RESPONSE LOG:", cloudDelRes);
          }
        }
      }

      if (productObj.bannerImages) {
        const bannerData = productObj.bannerImages;
        if (bannerData?.desktopUrl) {
          const dPid = getPublicIdFromUrl(bannerData.desktopUrl);
          if (dPid) await cloudinary.uploader.destroy(dPid);
        }
        if (bannerData?.mobileUrl) {
          const mPid = getPublicIdFromUrl(bannerData.mobileUrl);
          if (mPid) await cloudinary.uploader.destroy(mPid);
        }
      }

      await prisma.product.delete({ where: { id } });

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Crash inside Admin Product Delete Engine:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ===================================================================
  // ========================== PUBLIC SHOP WINDOW ENGINE ==============
  // ===================================================================

  static async getPublicProducts(req: Request, res: Response) {
    try {
      const { q, category } = req.query;

      const normalizeCategory = (cat: any) => {
        if (!cat || cat === "all") return null;
        const map: Record<string, string> = {
          "1Gram Gold": "1Gram Gold Polished Jewellery",
          "1Gram Gold Polished Jewellery": "1Gram Gold Polished Jewellery",
          "Gold": "Gold",
          "Silver": "Silver",
        };
        return map[String(cat)] || String(cat);
      };

      const finalCategory = normalizeCategory(category);
      let whereClause: any = {};

      if (finalCategory) {
        whereClause.category = finalCategory;
      }

      if (q && String(q).trim() !== "") {
        whereClause.name = {
          contains: String(q).trim(),
          mode: "insensitive"
        };
      }

      const queryOptions: any = {
        where: whereClause,
        orderBy: { created_at: "desc" },
      };

      const products = await prisma.product.findMany(queryOptions);
      const banners = products.slice(0, 5);

      let featured = null;
      if (banners && banners.length > 0) {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const diff = Math.floor((new Date().getTime() - startOfYear.getTime()) / 86400000);
        const index = diff % banners.length;
        featured = banners[index];
      }

      return res.json({ success: true, products, banners, featured });
    } catch (error) {
      console.error("Error inside getPublicProducts endpoint:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getPublicProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        select: { id: true, name: true, price: true, images: true, description: true, category: true, sku: true, weight: true }
      });
      if (!product) {
        return res.status(404).json({ success: false, message: "Asset profile not active" });
      }
      return res.json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  static async getBannerProducts(req: Request, res: Response) {
    try {
      let { category } = req.query;

      const normalizeCategory = (cat: any) => {
        if (!cat || cat === "all") return null;
        const map: Record<string, string> = {
          "1Gram Gold": "1Gram Gold Polished Jewellery",
          "1Gram Gold Polished Jewellery": "1Gram Gold Polished Jewellery",
          Gold: "Gold",
          Silver: "Silver",
        };
        return map[String(cat)] || String(cat);
      };

      const finalCategory = normalizeCategory(category);
      let banners;

      if (finalCategory) {
        banners = await prisma.product.findMany({
          where: { category: finalCategory },
          orderBy: { created_at: "desc" },
          take: 5,
        });
      } else {
        banners = await prisma.product.findMany({
          orderBy: { created_at: "desc" },
          take: 5,
        });
      }

      if (!banners || banners.length === 0) {
        return res.json({ banners: [], featured: null });
      }

      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diff = Math.floor((new Date().getTime() - startOfYear.getTime()) / 86400000);
      const index = diff % banners.length;

      return res.json({ banners, featured: banners[index] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Banner system error" });
    }
  }
}

export default ProductController;