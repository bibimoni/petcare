import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InviteStaffResponseDto } from '../stores/dto/invite-staff-response.dto';
import { RESET_PASSWORD_PAGE_ROUTE, RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES } from 'src/common';
import { buildInvitationUrl } from '../notifications/notification.util';

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
	) {}

	async sendInvitationEmail(invitationData: InviteStaffResponseDto, full_name?: string) {
		try {
			const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
			const invitationLink = buildInvitationUrl(frontendUrl, invitationData.invitation.token);
			const formattedExpiryDate = new Date(invitationData.invitation.expires_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			const textContent = `
Bạn được mời tham gia ${invitationData.store.name}!

${full_name ? `Xin chào ${full_name},` : 'Xin chào,'}

Bạn đã được mời tham gia đội ngũ của chúng tôi với vai trò ${invitationData.role.name}.
${invitationData.role.description ? `Mô tả vai trò: ${invitationData.role.description}` : ''}

Cửa hàng: ${invitationData.store.name}
Vai trò: ${invitationData.role.name}
${invitationData.invitation.message ? `Lời nhắn: ${invitationData.invitation.message}` : ''}

Để chấp nhận lời mời này, vui lòng truy cập:
${invitationLink}

Lời mời này sẽ hết hạn vào: ${formattedExpiryDate}

Nếu bạn không mong đợi lời mời này, vui lòng bỏ qua email này.

---
Đây là email tự động. Vui lòng không trả lời.`;

			await this.mailerService.sendMail({
				to: invitationData.invitation.email,
				subject: `Lời mời tham gia ${invitationData.store.name} với vai trò ${invitationData.role.name}`,
				text: textContent,
			});

			console.log(`Invitation email sent successfully to: ${invitationData.invitation.email}`);
		} catch (error) {
			console.error('Error sending invitation email:', error);
			throw error;
		}
	}

	async sendResetPasswordEmail(email: string, token: string) {
		try {
			const frontendUrl = this.configService.get<string>('FRONTEND_URL');
			const resetLink = `${frontendUrl}/${RESET_PASSWORD_PAGE_ROUTE}?token=${token}`;

			const textContent = `
You have requested to reset your password.

To reset your password, please click the link below:
${resetLink}

This link will expire in ${RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES} minutes.

If you did not request a password reset, please ignore this email.

---
This is an automated email. Please do not reply.`;

			await this.mailerService.sendMail({
				to: email,
				subject: 'Password Reset Request',
				text: textContent,
			});

			console.log(`Password reset email sent successfully to: ${email}`);
		} catch (error) {
			console.error('Error sending password reset email:', error);
			throw error;
		}
	}
}
