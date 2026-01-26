type LogDetails = Record<string, unknown>;

export const createLogger = (functionName: string) => {
  return {
    info: (message: string, details: LogDetails = {}) => {
      const payload = {
        level: "info",
        function: functionName,
        message,
        ...details,
        timestamp: new Date().toISOString(),
      };

      console.log(JSON.stringify(payload));
    },
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
