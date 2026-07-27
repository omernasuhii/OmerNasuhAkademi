const quotas = [{ val: 50 }, { val: "50+2" }, { val: 40 }];
const parseNum = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const strVal = String(val).split("+")[0];
  const n = Number(strVal);
  return !isNaN(n) && n >= 0 ? n : null;
};
console.log(quotas.map(parseNum));
