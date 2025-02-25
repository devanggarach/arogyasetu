import { MongoClient } from 'mongodb';

let mongoDbClient: MongoClient | null = null;

export class DbHelper {
	static readonly closeMongoDBNativeClient = async (): Promise<any> => {
		if (mongoDbClient) {
			await mongoDbClient.close(true);
		}
	};
}
