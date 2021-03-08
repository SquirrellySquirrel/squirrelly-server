import { createConnection, getConnection } from 'typeorm';

const connection = {
    async create() {
        await createConnection();
    },

    async close() {
        await getConnection().close();
    },

    async clear() {
        const connection = getConnection();
        const entities = connection.entityMetadatas;

        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        for (const entity of entities) {
            const repository = connection.getRepository(entity.name);
            await repository.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    },
};

export default connection;
