export const TMP_DIR = process.env.TMP_DIR as string;
export const FILE_DIR = process.env.FILE_DIR as string;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const TOKEN_TTL = Number(process.env.TOKEN_TTL) || 3600;