type LogDetails = Record<string, unknown>;

export const createLogger = (functionName: string) => {
  return {
    error: (message: string, details: LogDetails = {}) => {
      const payload = {
        level: "error",
        function: functionName,
        message,
        ...details,
        timestamp: new Date().toISOString(),
      };

      console.error(JSON.stringify(payload));
    },
  };
};
