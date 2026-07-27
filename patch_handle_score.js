const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

const oldHandleScore = `  const handleScoreChange = (
    field: string,
    max: number,
    type: "c" | "i",
    value: string,
  ) => {
    setNewResult((prev: any) => {
      const current = prev.scores[field] || { c: "", i: "", n: 0 };

      let val = parseInt(value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;

      let newC = type === "c" ? val : parseInt(current.c) || 0;
      let newI = type === "i" ? val : parseInt(current.i) || 0;

      if (newC + newI > max) {
        if (type === "c") {
          newC = max - newI;
        } else {
          newI = max - newC;
        }
      }

      const newN = newC - newI * 0.25;

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [field]: {
            c:
              newC === 0 && type === "c" && value === "" ? "" : newC.toString(),
            i:
              newI === 0 && type === "i" && value === "" ? "" : newI.toString(),
            n: parseFloat(newN.toFixed(2)),
          },
        },
      };
    });
  };`;

const newHandleScore = `  const handleScoreChange = (
    field: string,
    defaultMax: number,
    type: "c" | "i" | "m",
    value: string,
  ) => {
    setNewResult((prev: any) => {
      const current = prev.scores[field] || { c: "", i: "", n: 0, m: defaultMax };

      let val = parseInt(value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;

      let newM = type === "m" ? (value === "" ? defaultMax : val) : (current.m !== undefined ? current.m : defaultMax);
      let newC = type === "c" ? val : parseInt(current.c) || 0;
      let newI = type === "i" ? val : parseInt(current.i) || 0;

      if (newC + newI > newM) {
        if (type === "c") {
          newC = newM - newI;
        } else if (type === "i") {
          newI = newM - newC;
        } else {
          newC = Math.min(newC, newM);
          newI = Math.min(newI, newM - newC);
        }
      }

      const newN = newC - newI * 0.25;

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [field]: {
            ...current,
            c: newC === 0 && type === "c" && value === "" ? "" : newC.toString(),
            i: newI === 0 && type === "i" && value === "" ? "" : newI.toString(),
            n: parseFloat(newN.toFixed(2)),
            m: newM,
          },
        },
      };
    });
  };`;

if(content.includes(oldHandleScore)) {
  content = content.replace(oldHandleScore, newHandleScore);
} else {
  console.log("oldHandleScore not found");
}

fs.writeFileSync('src/pages/student/Exams.tsx', content);
