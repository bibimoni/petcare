import { Injectable } from "@nestjs/common";
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import * as streamifier from 'streamifier'

@Injectable()
export class CloudinaryService {
	uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
		return new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				(error, result) => {
					if (error) return reject(error)
					resolve(result!)
				}
			)
			if (!file) {
				return reject(new Error('No file provided'))
			}

			streamifier.createReadStream(file.buffer).pipe(uploadStream)
		})
	}
}
