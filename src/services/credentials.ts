import dotenv from 'dotenv';

dotenv.config();

export async function retrieveSecrets(): Promise<Record<string, any>> {
	// try {

	// 	return process.env;
	// } catch (error) {
	// 	console.error('Something went wrong in fetching secrets: ', error);
	// }
	return process.env;
}