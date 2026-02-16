import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InviteStaffResponseDto } from '../stores/dto/invite-staff-response.dto';

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
	) {}
	
	async sendInvitationEmail(invitationData: InviteStaffResponseDto, full_name?: string) {
		try {
			const frontendUrl = this.configService.get<string>('FRONTEND_URL');
			const invitationLink = `${frontendUrl}/accept-invitation?token=${invitationData.invitation.token}`;
			const formattedExpiryDate = new Date(invitationData.invitation.expires_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});

			const textContent = `
You're invited to join ${invitationData.store.name}!

${full_name ? `Hello ${full_name},` : 'Hello,'}

You have been invited to join our team as a ${invitationData.role.name}.
${invitationData.role.description ? `Role Description: ${invitationData.role.description}` : ''}

Store: ${invitationData.store.name}
Role: ${invitationData.role.name}
${invitationData.invitation.message ? `Message: ${invitationData.invitation.message}` : ''}

To accept this invitation, please visit:
${invitationLink}

This invitation will expire on: ${formattedExpiryDate}

If you did not expect this invitation, please ignore this email.

---
This is an automated email. Please do not reply.`;

			await this.mailerService.sendMail({
				to: invitationData.invitation.email,
				subject: `Invitation to join ${invitationData.store.name} as ${invitationData.role.name}`,
				text: textContent,
			});

			console.log(`Invitation email sent successfully to: ${invitationData.invitation.email}`);
		} catch (error) {
			console.error('Error sending invitation email:', error);
			throw error;
		}
	}
}
