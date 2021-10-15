export const convertStrToValidName = (str: string, fileExt = ".png") =>
  str.replace(/[^a-z0-9//]/gi, "_").toLowerCase() + fileExt;
