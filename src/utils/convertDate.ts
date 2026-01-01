const toIsoString = (value: unknown) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) return new Date(asNumber).toISOString();
        const asDate = new Date(value);
        if (!Number.isNaN(asDate.getTime())) return asDate.toISOString();
    }
    return new Date(0).toISOString();
};

export default toIsoString;
