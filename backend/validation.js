export class HttpError extends Error {
    constructor(status, message, code = 'INVALID_INPUT') {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export function positiveId(value, label = 'ID') {
    if ((typeof value !== 'number' && typeof value !== 'string') ||
        !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) {
        throw new HttpError(400, `${label} must be a positive integer`);
    }
    return Number(value);
}

export function textInput(value, label, maxLength, minLength = 1) {
    if (typeof value !== 'string') throw new HttpError(400, `${label} must be text`);
    const text = value.trim();
    if (text.length < minLength || text.length > maxLength) {
        throw new HttpError(400, `${label} must contain ${minLength}–${maxLength} characters`);
    }
    return text;
}

export function passwordInput(value, registering = false) {
    if (typeof value !== 'string' || value.length < (registering ? 8 : 1) || Buffer.byteLength(value, 'utf8') > 72) {
        throw new HttpError(400, registering
            ? 'Password must contain at least 8 characters and at most 72 UTF-8 bytes'
            : 'Password is required and must not exceed 72 UTF-8 bytes');
    }
    return value;
}
