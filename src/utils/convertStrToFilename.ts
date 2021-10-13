export const convertStrToFilename = (str: string) => str.replace(/[^a-z0-9//]/gi, "_").toLowerCase() + ".png";
