import { config } from '../constants/config';
import { useAuthStore } from '../store/authStore';

type GraphQLResponse<TData> = {
    data?: TData;
    errors?: Array<{ message?: string } & Record<string, any>>;
};

export class GraphQLRequestError extends Error {
    public status: number | null;
    public responseBody?: unknown;

    constructor(message: string, opts?: { status?: number | null; responseBody?: unknown }) {
        super(message);
        this.name = 'GraphQLRequestError';
        this.status = opts?.status ?? null;
        this.responseBody = opts?.responseBody;
    }
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const getGraphQLEndpoint = () => {
    const raw = config.apiURL ?? '';
    const base = raw ? normalizeBaseUrl(raw) : '';
    return base ? `${base}/graphql` : '/graphql';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function graphqlFetch<
    TData = unknown,
    TVariables extends Record<string, any> = Record<string, any>,
>(
    query: string,
    variables?: TVariables,
    opts?: {
        timeoutMs?: number;
        retries?: number;
        retryDelayMs?: number;
        signal?: AbortSignal;
    },
): Promise<TData> {
    const endpoint = getGraphQLEndpoint();
    const timeoutMs = opts?.timeoutMs ?? 12000;
    const retries = opts?.retries ?? 2;
    const retryDelayMs = opts?.retryDelayMs ?? 400;

    const accessToken = useAuthStore.getState().accessToken;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const combinedSignal = (() => {
            if (!opts?.signal) return controller.signal;
            if (opts.signal.aborted) return opts.signal;

            const parent = opts.signal;
            const onAbort = () => controller.abort();
            parent.addEventListener('abort', onAbort, { once: true });
            return controller.signal;
        })();

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ query, variables }),
                signal: combinedSignal,
            });

            const text = await res.text();
            let body: GraphQLResponse<TData> | unknown = undefined;
            try {
                body = text ? (JSON.parse(text) as GraphQLResponse<TData>) : undefined;
            } catch {
                body = text;
            }

            if (!res.ok) {
                const retryable =
                    res.status === 429 ||
                    res.status === 502 ||
                    res.status === 503 ||
                    res.status === 504;
                if (attempt < retries && retryable) {
                    const delay = retryDelayMs * Math.pow(2, attempt);
                    await sleep(delay);
                    continue;
                }
                throw new GraphQLRequestError(`HTTP ${res.status} from GraphQL endpoint`, {
                    status: res.status,
                    responseBody: body,
                });
            }

            const parsed = body as GraphQLResponse<TData>;
            if (parsed?.errors?.length) {
                const message =
                    parsed.errors
                        .map((e) => e?.message)
                        .filter(Boolean)
                        .join('\n') || 'GraphQL error';
                throw new GraphQLRequestError(message, {
                    status: res.status,
                    responseBody: parsed,
                });
            }

            return (parsed?.data ?? ({} as TData)) as TData;
        } catch (err: any) {
            const isAbort = err?.name === 'AbortError';
            const isNetwork = err instanceof TypeError;
            const canRetry = (isAbort || isNetwork) && attempt < retries;
            if (canRetry) {
                const delay = retryDelayMs * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    throw new GraphQLRequestError('GraphQL request failed');
}
