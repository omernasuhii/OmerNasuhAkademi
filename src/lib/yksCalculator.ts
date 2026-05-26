export type Netleri = {
  // OBP
  obp: number; // 50 to 100
  kirikOBP?: boolean;
  // TYT
  tytTr: number;
  tytSos: number;
  tytMat: number;
  tytFen: number;
  // AYT SAY
  aytMat: number;
  aytFiz: number;
  aytKim: number;
  aytBiy: number;
  // AYT EA/SÖZ
  aytEd: number;
  aytTar1: number;
  aytCog1: number;
  aytTar2: number;
  aytCog2: number;
  aytFel: number;
  aytDin: number;
  // YDT
  ydt: number;
};

export type ScoreResult = {
  year: number;
  tyt: { ham: number; yerlestirme: number; siralama: number | string };
  say: { ham: number; yerlestirme: number; siralama: number | string };
  ea: { ham: number; yerlestirme: number; siralama: number | string };
  soz: { ham: number; yerlestirme: number; siralama: number | string };
  dil: { ham: number; yerlestirme: number; siralama: number | string };
};

export async function calculateScores(nets: Netleri): Promise<ScoreResult[]> {
  const reqBody = { ...nets, diploma: nets.obp, kirikOBP: !!nets.kirikOBP };
  const res = await fetch('/api/calculate-yks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  
  if (!res.ok) throw new Error('Failed to calculate');
  const responseData = await res.json();
  const d = responseData.ogm; // array from OGM
  const puango = responseData.puango;

  const safeNum = (val: number | string | undefined | null) => Number(val) || 0;
  const safeAralik = (val: string | undefined | null) => val || '-';
  
  const getAvgRank = (r1: any, r2: any, r3: any) => {
    const v1 = Number(r1) || 0;
    const v2 = Number(r2) || 0;
    const v3 = Number(r3) || 0;
    const count = (v1>0?1:0) + (v2>0?1:0) + (v3>0?1:0);
    if (count === 0) return '-';
    return Math.round((v1 + v2 + v3) / count);
  };

  return [
    {
      year: 2026,
      tyt: { ham: safeNum(d[0]?.tytPuani), yerlestirme: safeNum(d[3]?.tytPuani), siralama: safeAralik(d[3]?.tytAralik) },
      say: { ham: safeNum(d[1]?.sayisalPuani), yerlestirme: safeNum(d[4]?.sayisalPuani), siralama: safeAralik(d[4]?.sayAralik) },
      ea: { ham: safeNum(d[1]?.esitAgirlikPuani), yerlestirme: safeNum(d[4]?.esitAgirlikPuani), siralama: safeAralik(d[4]?.eaAralik) },
      soz: { ham: safeNum(d[1]?.sozelPuani), yerlestirme: safeNum(d[4]?.sozelPuani), siralama: safeAralik(d[4]?.sozAralik) },
      dil: { ham: safeNum(d[2]?.dilPuani), yerlestirme: safeNum(d[5]?.dilPuani), siralama: safeAralik(d[5]?.dilAralik) }
    },
    {
      year: 2025,
      tyt: { ham: puango.tyt_ham || 0, yerlestirme: puango.tyt_yer || 0, siralama: getAvgRank(puango.tyt_s_yer, puango.tyt_s_yer_1, puango.tyt_s_yer_2) },
      say: { ham: puango.yks_say_ham || 0, yerlestirme: puango.yks_say_yer || 0, siralama: getAvgRank(puango.yks_s_say_yer, puango.yks_s_say_yer_1, puango.yks_s_say_yer_2) },
      ea: { ham: puango.yks_ea_ham || 0, yerlestirme: puango.yks_ea_yer || 0, siralama: getAvgRank(puango.yks_s_ea_yer, puango.yks_s_ea_yer_1, puango.yks_s_ea_yer_2) },
      soz: { ham: puango.yks_soz_ham || 0, yerlestirme: puango.yks_soz_yer || 0, siralama: getAvgRank(puango.yks_s_soz_yer, puango.yks_s_soz_yer_1, puango.yks_s_soz_yer_2) },
      dil: { ham: puango.yks_dil_ham || 0, yerlestirme: puango.yks_dil_yer || 0, siralama: getAvgRank(puango.yks_s_dil_yer, puango.yks_s_dil_yer_1, puango.yks_s_dil_yer_2) }
    },
    {
      year: 2024,
      tyt: { ham: puango.tyt_ham || 0, yerlestirme: puango.tyt_yer || 0, siralama: puango.tyt_s_yer || '-' },
      say: { ham: puango.yks_say_ham || 0, yerlestirme: puango.yks_say_yer || 0, siralama: puango.yks_s_say_yer || '-' },
      ea: { ham: puango.yks_ea_ham || 0, yerlestirme: puango.yks_ea_yer || 0, siralama: puango.yks_s_ea_yer || '-' },
      soz: { ham: puango.yks_soz_ham || 0, yerlestirme: puango.yks_soz_yer || 0, siralama: puango.yks_s_soz_yer || '-' },
      dil: { ham: puango.yks_dil_ham || 0, yerlestirme: puango.yks_dil_yer || 0, siralama: puango.yks_s_dil_yer || '-' }
    },
    {
      year: 2023,
      tyt: { ham: puango.tyt_ham || 0, yerlestirme: puango.tyt_yer || 0, siralama: puango.tyt_s_yer_1 || '-' },
      say: { ham: puango.yks_say_ham || 0, yerlestirme: puango.yks_say_yer || 0, siralama: puango.yks_s_say_yer_1 || '-' },
      ea: { ham: puango.yks_ea_ham || 0, yerlestirme: puango.yks_ea_yer || 0, siralama: puango.yks_s_ea_yer_1 || '-' },
      soz: { ham: puango.yks_soz_ham || 0, yerlestirme: puango.yks_soz_yer || 0, siralama: puango.yks_s_soz_yer_1 || '-' },
      dil: { ham: puango.yks_dil_ham || 0, yerlestirme: puango.yks_dil_yer || 0, siralama: puango.yks_s_dil_yer_1 || '-' }
    },
    {
      year: 2022,
      tyt: { ham: puango.tyt_ham || 0, yerlestirme: puango.tyt_yer || 0, siralama: puango.tyt_s_yer_2 || '-' },
      say: { ham: puango.yks_say_ham || 0, yerlestirme: puango.yks_say_yer || 0, siralama: puango.yks_s_say_yer_2 || '-' },
      ea: { ham: puango.yks_ea_ham || 0, yerlestirme: puango.yks_ea_yer || 0, siralama: puango.yks_s_ea_yer_2 || '-' },
      soz: { ham: puango.yks_soz_ham || 0, yerlestirme: puango.yks_soz_yer || 0, siralama: puango.yks_s_soz_yer_2 || '-' },
      dil: { ham: puango.yks_dil_ham || 0, yerlestirme: puango.yks_dil_yer || 0, siralama: puango.yks_s_dil_yer_2 || '-' }
    }
  ];
}
