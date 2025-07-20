export const formatDate = (date) => {
  if (!date || isNaN(Date.parse(date))) return "";

  date = new Date(date);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${day < 10 ? '0' + day: day}.${month < 10 ? '0' + month: month}.${year} ${hours < 10 ? '0' + hours: hours}:${minutes < 10 ? "0" + minutes : minutes}`;
};
