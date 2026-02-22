import * as bcrypt from 'bcrypt';
export function generateRandomToken(): string {
	const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	return token;
}

export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await bcrypt.hash(password, 10)
	return hashedPassword
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
	const isMatch = await bcrypt.compare(password, hash)
	return isMatch
}
