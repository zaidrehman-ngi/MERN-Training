type JobLogger = {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export type JobResult = Record<string, string | number>;

const summary = (result: JobResult): string =>
  Object.entries(result)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

export const runJob = async (
  name: string,
  work: () => Promise<JobResult>,
  logger: JobLogger,
): Promise<JobResult | null> => {
  const startedAt = Date.now();
  logger.info(`[${name}] started`);
  try {
    const result = await work();
    logger.info(
      `[${name}] finished in ${Date.now() - startedAt}ms: ${summary(result)}`,
    );
    return result;
  } catch (err) {
    logger.error(`[${name}] FAILED after ${Date.now() - startedAt}ms:`, err);
    return null;
  }
};
