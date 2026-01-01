import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import UserToken from '../models/UserToken';

const JWT_SECRET = config.jwt.secret;
const ACCESS_EXPIRES = config.jwt.accessExpires;
const REFRESH_EXPIRES = config.jwt.refreshExpires;

export function generateAccessToken(userId: string) {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
}

export async function createTokens(userId: string) {
    const accessToken = generateAccessToken(userId);
    const rawRefresh = generateRefreshToken();
    const hashedRefresh = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    await UserToken.destroy({ where: { userId, tokenType: 'REFRESH' } });

    await UserToken.create({
        userId,
        tokenType: 'REFRESH',
        token: hashedRefresh,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES * 1000),
    });

    return { accessToken, refreshToken: rawRefresh };
}

export async function verifyRefreshToken(token: string) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const record = await UserToken.findOne({ where: { token: hashed, tokenType: 'REFRESH' } });
    if (!record || record.expiresAt < new Date()) return null;
    return record;
}
