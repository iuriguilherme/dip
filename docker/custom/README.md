# n8n-nodes-unsafe-extract-credentials

⚠️ **WARNING: USE WITH EXTREME CAUTION** ⚠️

This n8n community node allows you to extract and decrypt credentials directly from the n8n PostgreSQL database.

## Features

- Connect directly to n8n's PostgreSQL database
- Extract credentials by type or ID
- Decrypt credential data using N8N_ENCRYPTION_KEY
- Returns decrypted credential data in JSON format

## Installation

1. Navigate to this directory:
   ```bash
   cd ./custom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the node:
   ```bash
   npm run build
   ```

4. Link or publish the node to make it available in n8n

## Usage

### Parameters

- **Database Host**: PostgreSQL server address (default: `localhost`)
- **Database Port**: PostgreSQL port (default: `5432`)
- **Database Name**: Database name (default: `n8n`)
- **Database User**: Database username (default: `postgres`)
- **Database Password**: Database password
- **Encryption Key**: Your `N8N_ENCRYPTION_KEY` from environment variables
- **Credential Type**: (Optional) Filter by credential type (e.g., `telegramApi`)
- **Credential ID**: (Optional) Extract specific credential by ID

### Example Workflow Usage

```javascript
{
  "host": "{{ $env.POSTGRES_HOST }}",
  "port": "{{ $env.POSTGRES_PORT }}",
  "database": "{{ $env.POSTGRES_DB }}",
  "username": "{{ $env.POSTGRES_USER }}",
  "password": "{{ $env.POSTGRES_PASSWORD }}",
  "encryptionKey": "{{ $env.N8N_ENCRYPTION_KEY }}",
  "credentialType": "telegramApi",
  "credentialId": ""
}
```

### Output

The node returns a JSON object with:
```json
{
  "credentials": [
    {
      "id": 1,
      "name": "Telegram Bot",
      "type": "telegramApi",
      "data": {
        "accessToken": "your_decrypted_token_here"
      }
    }
  ],
  "count": 1
}
```

## Security Warnings

🚨 **CRITICAL SECURITY CONSIDERATIONS** 🚨

1. **Exposes Decrypted Credentials**: This node bypasses n8n's security layer and exposes raw credential data
2. **Requires Direct Database Access**: Needs database credentials with read access
3. **Logs May Contain Secrets**: Execution data will include decrypted credentials
4. **Not for Production**: Should ONLY be used in development/testing environments
5. **Access Control**: Restrict access to workflows using this node
6. **Audit Trail**: Monitor usage carefully

### Recommended Use Cases ONLY

- Development and debugging
- Migration tasks
- Backup/restore operations
- Emergency recovery scenarios
- Isolated, secure environments

### DO NOT Use For

- Production workflows
- Multi-user environments
- Automated processes
- Public-facing systems
- Any scenario where credentials could be logged or exposed

## Dependencies

- `typeorm`: ^0.3.17
- `pg`: ^8.11.3
- `n8n-workflow`: (peer dependency)

## License

MIT

## Support

This is a community node. Use at your own risk.

## Changelog

### 0.1.0
- Initial release
- Basic credential extraction and decryption
- PostgreSQL support
