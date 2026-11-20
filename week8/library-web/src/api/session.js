let accessToken = null;
let onSessionEnd = () => {};

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const setOnSessionEnd = (callback) => {
  onSessionEnd = callback;
};

export const endSession = () => {
  accessToken = null;
  onSessionEnd();
};
