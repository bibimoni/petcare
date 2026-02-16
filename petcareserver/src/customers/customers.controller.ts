import { Controller, HttpCode, HttpStatus, Injectable, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions } from "src/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "src/users/entities/user.entity";
import { STORE_PERMISSIONS } from "src/common/permissions";

@ApiTags('Customers')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
	constructor(private readonly customersService: CustomersService) {}

	@Post('pets/:petId/avatar')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(STORE_PERMISSIONS.PET_EDIT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upload pet image',
		description: 'Uploads an image for a pet and updates the pet record with the image URL',
	})
	@ApiResponse({
		status: 200,
		description: 'Pet image uploaded and pet record updated successfully',
	})
	@UseInterceptors(FileInterceptor('file'))
	async uploadPetImage(
		@Param('petId') petId: number,
		@CurrentUser() currentUser: User,
		@UploadedFile() file: Express.Multer.File
	) {
		return this.customersService.UploadPetAvatar(petId, currentUser.user_id, file);
	}
}
