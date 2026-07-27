const quotas = ["50+2", "40", 40, null, undefined, "", 0, "0"];
const parseNum = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const strVal = String(val).split("+")[0];
  const n = Number(strVal);
  return !isNaN(n) && n > 0 ? n : null;
};
console.log(quotas.map(parseNum));
