import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

import { createConnection } from 'typeorm';
import * as crypto from 'crypto';

export class UnsafeExtractCredentials implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Unsafe Extract Credentials',
        name: 'unsafeExtractCredentials',
        icon: 'fa:key',
        group: ['transform'],
        version: 1,
        description: 'Extract and decrypt credentials from n8n database (USE WITH CAUTION)',
        defaults: {
            name: 'Unsafe Extract Credentials',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [],
        properties: [
            {
                displayName: 'Database Host',
                name: 'host',
                type: 'string',
                default: 'localhost',
                required: true,
                description: 'PostgreSQL host address',
            },
            {
                displayName: 'Database Port',
                name: 'port',
                type: 'number',
                default: 5432,
                required: true,
                description: 'PostgreSQL port',
            },
            {
                displayName: 'Database Name',
                name: 'database',
                type: 'string',
                default: 'n8n',
                required: true,
                description: 'Database name',
            },
            {
                displayName: 'Database User',
                name: 'username',
                type: 'string',
                default: 'postgres',
                required: true,
                description: 'Database username',
            },
            {
                displayName: 'Database Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Database password',
            },
            {
                displayName: 'Encryption Key',
                name: 'encryptionKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'N8N_ENCRYPTION_KEY from environment',
            },
            {
                displayName: 'Credential Type',
                name: 'credentialType',
                type: 'string',
                default: '',
                placeholder: 'telegramApi',
                description: 'Type of credential to extract (leave empty for all)',
            },
            {
                displayName: 'Credential ID',
                name: 'credentialId',
                type: 'string',
                default: '',
                placeholder: '1',
                description: 'Specific credential ID to extract (leave empty for all)',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        
        // Helper function to decrypt credentials
        const decryptCredential = (encryptedData: string, encryptionKey: string): any => {
            try {
                // Parse the encrypted data
                const encryptedDataObject = JSON.parse(encryptedData);
                
                // Extract IV and encrypted content
                const iv = Buffer.from(encryptedDataObject.iv, 'hex');
                const encryptedContent = Buffer.from(encryptedDataObject.encryptedData, 'hex');
                
                // Create decipher
                const key = Buffer.from(encryptionKey, 'utf8');
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                
                // Decrypt
                let decrypted = decipher.update(encryptedContent);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                
                // Parse and return
                return JSON.parse(decrypted.toString('utf8'));
            } catch (error: any) {
                throw new Error(`Decryption failed: ${error.message}`);
            }
        };

        for (let i = 0; i < items.length; i++) {
            try {
                const host = this.getNodeParameter('host', i) as string;
                const port = this.getNodeParameter('port', i) as number;
                const database = this.getNodeParameter('database', i) as string;
                const username = this.getNodeParameter('username', i) as string;
                const password = this.getNodeParameter('password', i) as string;
                const encryptionKey = this.getNodeParameter('encryptionKey', i) as string;
                const credentialType = this.getNodeParameter('credentialType', i) as string;
                const credentialId = this.getNodeParameter('credentialId', i) as string;

                // Connect to database
                const connection = await createConnection({
                    type: 'postgres',
                    host,
                    port,
                    username,
                    database,
                    password,
                    synchronize: false,
                    logging: false,
                });

                // Build query
                let query = 'SELECT id, name, type, data FROM credentials_entity WHERE 1=1';
                const params: any[] = [];
                let paramIndex = 1;

                if (credentialType) {
                    query += ` AND type = $${paramIndex}`;
                    params.push(credentialType);
                    paramIndex++;
                }

                if (credentialId) {
                    query += ` AND id = $${paramIndex}`;
                    params.push(credentialId);
                    paramIndex++;
                }

                // Execute query
                const credentials = await connection.query(query, params);

                // Decrypt credentials
                const decryptedCredentials = credentials.map((cred: any) => {
                    try {
                        const decryptedData = decryptCredential(cred.data, encryptionKey);
                        return {
                            id: cred.id,
                            name: cred.name,
                            type: cred.type,
                            data: decryptedData,
                        };
                    } catch (error: any) {
                        return {
                            id: cred.id,
                            name: cred.name,
                            type: cred.type,
                            data: null,
                            error: 'Failed to decrypt',
                        };
                    }
                });

                // Close connection
                await connection.close();

                returnData.push({
                    json: {
                        credentials: decryptedCredentials,
                        count: decryptedCredentials.length,
                    },
                });
            } catch (error: any) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error.message);
            }
        }

        return [returnData];
    }
}
