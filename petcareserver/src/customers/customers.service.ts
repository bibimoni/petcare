import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { Store } from "src/stores/entities/store.entity";
import { Pet } from "./entities/pet.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class CustomersService {
	constructor(
		@InjectRepository(Pet)
		private petRepository: Repository<Pet>,
		private cloudinaryService: CloudinaryService
	) {}

	async UploadPetAvatar(pet_id: number, currentUserId: number, file: Express.Multer.File) {
		const pet = await this.petRepository.findOne({
			relations: {
				store: {
					users: true
				}
			},
			where: { pet_id, store: { users: { user_id: currentUserId } } }
		});
		if (!pet) {
			throw new BadRequestException('Pet not found or you do not have permission to update this pet');
		}

		const cloudinaryResp = await this.cloudinaryService.uploadFile(file)
		await this.petRepository.update(pet_id, { avatar_url: cloudinaryResp.secure_url, avatar_public_id: cloudinaryResp.public_id });

		return cloudinaryResp.secure_url;
	}
}
