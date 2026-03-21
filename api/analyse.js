export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Gemini API key not configured.' } });
  }

  const { mode } = req.body;

  // ── SCORECARD ─────────────────────────────────────────────────
  if (mode === 'scorecard') {
    const { imageData, mimeType } = req.body;
    const prompt = `This is an NTA CUET (UG) scorecard. Extract every subject from the Score Card Details table.
Return ONLY a JSON array:
[{"subject":"English","score":225.6066968},{"subject":"History","score":249.6}]
Use the "In Figure" decimal value (NOT Percentile). Include all rows. If unclear return []`;

    const body = {
      contents: [{ parts: [
        { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageData } },
        { text: prompt }
      ]}],
      generationConfig: { temperature: 0, maxOutputTokens: 600 }
    };
    return await callGemini(apiKey, body, res, 'scorecard');
  }

  // ── CHAT ───────────────────────────────────────────────────────
  if (mode === 'chat') {
    const { chatHistory, message } = req.body;

    const SYSTEM = `You are DU Admission AI Guide for CUET 2026. Help students with Delhi University admissions.
Be concise (under 250 words). Support Hindi and English.
Note: cut-offs are from CUET 2024 and may change for 2026.

DU PROGRAMMES (name|stream|eligibility|top colleges with UR cutoff):
B.Com|Commerce & Management|Combination I: Any one Language from List A + Any three subjects from List B|Kirori Mal College(UR:884.0,SC:739.8); Ramjas College(UR:877.68,SC:727.76); Sri Venketeswara College(UR:872.74,SC:717.76)
B.Com (Hons.)|Commerce & Management|Combination I: Any one Language from List A + Mathematics/ Applied Mathematics +|Shri Ram College of Commerce(UR:917.43,SC:792.49); Hindu College(UR:912.22,SC:784.1); Lady Shri Ram College for Women (W)(UR:906.37,SC:764.8)
Bachelor of Business Administration (Financial Investment Analysis) (BBA(FIA))|Commerce & Management|Any one Language from List A + Mathematics/Applied Mathematics + Any one other s|Shaheed Sukhdev College Business Studies(UR:577.2,SC:410.39); Shaheed Rajguru College of Applied Sciences for Women
(W)(UR:472.53,SC:305.23)
B.A. (Hons.) Business Economics|Commerce & Management|Any one Language from List A + Mathematics/Applied Mathematics + SECTION III of |Sri Guru Gobind Singh College of Commerce(UR:511.56,SC:0); Sri Guru Tegh Bahadur Khalsa College(UR:502.45,SC:0); Gargi College (W)(UR:479.71,SC:271.87)
Bachelor of Management Studies (BMS)|Commerce & Management|Any one Language from List A + Mathematics/Applied Mathematics + SECTION III of |Shaheed Sukhdev College Business Studies(UR:555.0,SC:378.85); Sri Guru Gobind Singh College of Commerce(UR:538.24,SC:0); Deen Dayal Upadhyaya College(UR:525.04,SC:344.79)
B.A. (Hons.) Applied Psychology|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:860.93,SC:677.59); Ramanujan College(UR:812.48,SC:595.17); Dr. Bhim Rao Ambedkar College(UR:762.99,SC:558.47)
B.A. (Hons.) Economics|Arts, Humanities & Social Sciences|Combination I :Any one Language from List A + Mathematics/Applied Mathematics + |Shri Ram College of Commerce(UR:908.9,SC:722.74); St. Stephen's College(UR:904.62,SC:726.27); Hindu College(UR:888.17,SC:705.97)
B.A. (Hons.) Geography|Arts, Humanities & Social Sciences|Combination I :Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:889.06,SC:770.89); Kirori Mal College(UR:868.45,SC:764.0); Indraprastha College for Women (W)(UR:814.43,SC:672.02)
B.A. (Hons.) History|Arts, Humanities & Social Sciences|Combination I :Any one Language from List A + Any three subjects from List B|St. Stephen's College(UR:918.72,SC:844.4); Hindu College(UR:914.38,SC:834.28); Miranda House (W)(UR:894.64,SC:780.1)
B.A. (Hons.) Humanities and Social Sciences|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Cluster Innovation Centre(UR:710.51,SC:439.01)
B.A. (Hons.) Journalism|Arts, Humanities & Social Sciences|Combination I: English from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:876.79,SC:719.2); Delhi College of Arts and Commerce(UR:779.36,SC:596.09); Kamala Nehru College (W)(UR:754.4,SC:522.0)
B.A. (Hons.) Philosophy|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|St. Stephen's College(UR:906.74,SC:787.99); Hindu College(UR:865.0,SC:714.28); Hansraj College(UR:827.48,SC:660.68)
B.A. (Hons.) Political Science|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hindu College(UR:950.58,SC:889.69); Miranda House (W)(UR:925.98,SC:838.26); Lady Shri Ram College for Women (W)(UR:915.7,SC:793.96)
B.A. (Hons.) Psychology|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:926.53,SC:831.51); Jesus & Mary College (W)(UR:898.8,SC:0); Indraprastha College for Women (W)(UR:878.06,SC:743.0)
B.A. (Hons.) Social Work|Arts, Humanities & Social Sciences|Combination I :Any one Language from List A + Any three subjects from List B|Dr. Bhim Rao Ambedkar College(UR:572.42,SC:373.0); Aditi Mahavidyalaya (W)(UR:528.42,SC:253.88)
B.A. (Hons.) Sociology|Arts, Humanities & Social Sciences|Combination I :Any one Language from List A + Any three subjects from List B|Hindu College(UR:891.99,SC:777.84); Lady Shri Ram College for Women (W)(UR:849.96,SC:667.39); Miranda House (W)(UR:841.5,SC:666.64)
B.A Program (Accounting and Finance + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Ramanujan College(UR:740.51,SC:454.87)
B.A Program (Advertising, Sales Promotion and Sales Management (ASPSM) + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:537.68,SC:153.07)
B.A Program (Any two discipline from these (English/Hindi/History/Pol. Science/Economics/Mathematics))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Ramjas College(UR:842.98,SC:719.42)
B.A Program (Commerce + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:755.36,SC:364.88)
B.A Program (Computer Applications + Any other discipline subject from (English/Hindi/Sanskrit/Political Sc./Economics/Mathematics/Comp. App./History))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:778.51,SC:571.86)
B.A Program (Computer Applications + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:830.45,SC:631.65); Delhi College of Arts and Commerce(UR:704.93,SC:456.61); Gargi College (W)(UR:702.68,SC:478.43)
B.A Program (Economics + Food Technology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Shyama Prasad Mukherji College For Women (W)(UR:586.65,SC:342.22); Aditi Mahavidyalaya (W)(UR:566.48,SC:325.79)
B.A Program (Economics + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:890.34,SC:628.71); Miranda House (W)(UR:855.95,SC:582.51); Sri Guru Tegh Bahadur Khalsa College(UR:826.28,SC:0)
B.A Program (Economics + Mathematics/Statistics/Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:832.15,SC:669.64)
B.A Program (English + Any other discipline subject from (English/Hindi/Sanskrit/Political
Sc./Economics/Mathematics/Comp. App./History))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:799.38,SC:629.65)
B.A Program (English + Food Technology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Vivekananda College (W)(UR:656.75,SC:562.26)
B.A Program (English + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Motilal Nehru College(UR:675.6,SC:358.84); Deshbandhu College(UR:656.91,SC:428.89); Maharaja Agrasen College(UR:644.91,SC:396.54)
B.A Program (Entrepreneurship and Small Business (ESB) + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:722.38,SC:400.88); Ramanujan College(UR:672.43,SC:398.2); Kalindi College (W)(UR:600.27,SC:236.34)
B.A Program (Food Technology (FT) + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:547.07,SC:318.59)
B.A Program (Food Technology (FT) + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Vivekananda College (W)(UR:537.33,SC:340.09); Shyama Prasad Mukherji College For Women (W)(UR:520.64,SC:330.18); Bhagini Nivedita College (W)(UR:502.98,SC:264.59)
B.A Program (Food Technology (FT) + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Vivekananda College (W)(UR:567.87,SC:331.6); Lakshmibai College (W)(UR:548.9,SC:335.87); Bhagini Nivedita College (W)(UR:500.67,SC:258.06)
B.A Program (Geography + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:794.19,SC:0); Dyal Singh College(UR:604.66,SC:413.81); Kalindi College (W)(UR:570.39,SC:414.78)
B.A Program (Hindi + Any other discipline subject from (English/Hindi/Sanskrit/Political Sc./Economics/Mathematics/Comp. App./History))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:737.5,SC:610.37)
B.A Program (Hindi + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:523.65,SC:345.39)
B.A Program (History + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Deshbandhu College(UR:622.0,SC:397.8); Satyawati College(UR:519.64,SC:300.87); Satyawati College (Evening)(UR:508.08,SC:266.55)
B.A Program (Human Resource Management (HRM) + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dr. Bhim Rao Ambedkar College(UR:628.45,SC:338.41)
B.A Program (Mathematics + Any other discipline subject from (English/Hindi/Sanskrit/Political Sc./Economics/Mathematics/Comp. App./History))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:780.83,SC:470.03)
B.A Program (Mathematics + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Guru Tegh Bahadur Khalsa College(UR:672.05,SC:0)
B.A Program (Mathematics + OMSP)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:609.75,SC:284.65); Satyawati College(UR:553.7,SC:259.75); Swami Shardhanand College(UR:549.35,SC:217.8)
B.A Program (Mathematics + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Deshbandhu College(UR:682.43,SC:289.17); Kamala Nehru College (W)(UR:632.21,SC:311.58); Zakir Husain Delhi College(UR:591.42,SC:389.99)
B.A Program (Mathematics + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Guru Tegh Bahadur Khalsa College(UR:781.9,SC:0); Deshbandhu College(UR:630.4,SC:376.16); Satyawati College(UR:527.39,SC:265.45)
B.A Program (Mathematics + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:673.45,SC:451.92); Aditi Mahavidyalaya (W)(UR:528.77,SC:186.89)
B.A Program (Philosophy + Any one out of
these (English/Hindi/History/Pol. Science/Economics/Mathematics/Sanskrit))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Ramjas College(UR:818.29,SC:667.83)
B.A Program (Political Science + Mathematics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Satyawati College (Evening)(UR:518.1,SC:266.8)
B.A Program (Sanskrit + Any one out of these (English/Hindi/History/Pol. Science/Economics/Mathematics/Philosophy))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Ramjas College(UR:706.59,SC:603.85)
B.A Program (Sanskrit + Any other discipline subject from (English/Hindi/Sanskrit/Political Sc./Economics/Mathematics/Comp. App./History))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:634.75,SC:378.3)
B.Sc (Hons.) Anthropology|Sciences, Mathematics & Technology|Physics + Chemistry + Biology/ Biological Studies/ Biotechnology/ Biochemistry M|Hansraj College(UR:601.82,SC:483.25)
B.Sc (Hons.) Bio-Chemistry|Sciences, Mathematics & Technology|Combination I: Chemistry + Biology/ Biological Studies/ Biotechnology/ Biochemis|Sri Venketeswara College(UR:627.46,SC:500.16); Daulat Ram College (W)(UR:607.82,SC:484.43); Deshbandhu College(UR:583.13,SC:426.26)
B.Sc (Hons.) Biological Sciences|Sciences, Mathematics & Technology|Physics + Chemistry + Biology/ Biological Studies/ Biotechnology/ Biochemistry M|Sri Venketeswara College(UR:602.13,SC:438.18)
B.Sc (Hons.) Biomedical Science|Sciences, Mathematics & Technology|Chemistry + Physics + Biology/Biological Studies/Biotechnology/ Biochemistry Mer|Acharya Narendra Dev College(UR:591.14,SC:438.56); Bhaskaracharya College of Applied Sciences(UR:575.93,SC:418.34); Shaheed Rajguru College of Applied Sciences for Women (W)(UR:572.82,SC:422.54)
B.Sc (Hons.) Botany|Sciences, Mathematics & Technology|Physics + Chemistry + Biology/Biological Studies/ Biotechnology/Biochemistry Mer|Hindu College(UR:656.12,SC:523.88); Miranda House (W)(UR:634.16,SC:508.22); Hansraj College(UR:621.14,SC:483.87)
B.Sc (Hons.) Chemistry|Sciences, Mathematics & Technology|Physics + Chemistry + Mathematics/Applied Mathematics Merit will be based on the|St. Stephen's College(UR:550.65,SC:406.15); Hindu College(UR:537.91,SC:386.12); Hansraj College(UR:495.44,SC:352.11)
B.Sc (Hons.) Computer Science|Sciences, Mathematics & Technology|Combination I : Any one Language from List A + Mathematics/ Applied Mathematics |Hansraj College(UR:784.35,SC:638.28); Shaheed Sukhdev College Business Studies(UR:761.22,SC:566.5); Sri Guru Tegh Bahadur Khalsa College(UR:724.31,SC:0)
B.Sc (Hons.) Electronics|Sciences, Mathematics & Technology|Combination I: Physics + Mathematics/Applied Mathematics + Chemistry|Hansraj College(UR:505.37,SC:328.09); Sri Venketeswara College(UR:427.81,SC:265.05); Sri Guru Tegh Bahadur Khalsa College(UR:425.5,SC:0)
B.Sc (Hons.) Environmental Sciences|Sciences, Mathematics & Technology|Combination I: Physics + Chemistry + Biology/Biological Studies/Biotechnology/Bi|Ramanujan College(UR:502.8,SC:348.54)
B.Sc (Hons.) Food Technology|Sciences, Mathematics & Technology|Combination I: Physics + Chemistry + Biology/Biological Studies/Biotechnology/Bi|Lady Irwin College (W)(UR:546.96,SC:422.04); Bhaskaracharya College of Applied Sciences(UR:535.2,SC:366.08); Shaheed Rajguru College of Applied Sciences for Women (W)(UR:514.52,SC:367.6)
B.Sc (Hons.) Geology|Sciences, Mathematics & Technology|Combination I: Physics + Chemistry + Mathematics/Applied Mathematics|Hansraj College(UR:594.13,SC:422.55); Ram Lal Anand College(UR:501.87,SC:353.83)
B.Sc (Hons.) Home Science|Sciences, Mathematics & Technology|Combination I: Biology/Biological Studies/ Biotechnology/ Biochemistry + Physics|Lady Irwin College (W)(UR:433.27,SC:282.06); Lakshmibai College (W)(UR:405.82,SC:251.49); Institute of Home Economics (W)(UR:399.63,SC:252.05)
B.Sc (Hons.) Instrumentation|Sciences, Mathematics & Technology|Combination I: Physics + Mathematics/Applied Mathematics+ Chemistry|Bhaskaracharya College of Applied Sciences(UR:267.11,SC:107.88); Shaheed Rajguru College of Applied Sciences for Women (W)(UR:241.03,SC:47.59)
B.Sc (Hons.) Mathematics|Sciences, Mathematics & Technology|Combination I:Any one Language from List A + Mathematics/Applied Mathematics + A|St. Stephen's College(UR:834.08,SC:651.9); Hindu College(UR:818.35,SC:631.74); Hansraj College(UR:787.72,SC:572.96)
B.Sc (Hons.) Microbiology|Sciences, Mathematics & Technology|Physics + Chemistry + Biology/Biological Studies/ Biotechnology/ Biochemistry Me|Gargi College (W)(UR:609.03,SC:483.37); Ram Lal Anand College(UR:577.19,SC:439.15); Bhaskaracharya College of Applied Sciences(UR:571.61,SC:438.28)
B.Sc (Hons.) Physics|Sciences, Mathematics & Technology|Physics + Chemistry + Mathematics/Applied Mathematics Merit will be based on the|St. Stephen's College(UR:578.76,SC:486.49); Hindu College(UR:557.26,SC:391.0); Hansraj College(UR:528.57,SC:377.07)
B.Sc (Hons.) Polymer Science|Sciences, Mathematics & Technology|Physics + Chemistry + Mathematics/Applied Mathematics Merit will be based on the|Bhaskaracharya College of Applied Sciences(UR:258.46,SC:99.62)
B.Sc (Hons.) Statistics|Sciences, Mathematics & Technology|Combination I: Any one Language from List A + Mathematics/ Applied Mathematics +|Hindu College(UR:848.63,SC:620.13); Lady Shri Ram College for Women (W)(UR:827.72,SC:569.42); Kirori Mal College(UR:822.76,SC:567.84)
B.Sc (Hons.) Zoology|Sciences, Mathematics & Technology|Physics + Chemistry + Biology/Biological Studies/ Biotechnology/ Biochemistry Me|Hindu College(UR:678.44,SC:593.1); Miranda House (W)(UR:660.65,SC:556.26); Hansraj College(UR:643.62,SC:534.77)
B.Sc (Pass) Home Science|B.Sc. (Programme)|Combination I: Any one Language from List A + Any three subjects from List B|Lady Irwin College (W)(UR:564.47,SC:346.55); Institute of Home Economics (W)(UR:523.78,SC:320.0)
B.Sc (Prog.) Applied Life Science|B.Sc. (Programme)|Chemistry + Physics + Biology/Biological Studies/ Biotechnology/Biochemistry Mer|Swami Shardhanand College(UR:483.85,SC:338.2)
B.Sc (Prog.) Applied Physical Sciences with Industrial Chemistry|B.Sc. (Programme)|Chemistry + Physics + Biology/Biological Studies/ Biotechnology/Biochemistry Mer|Atma Ram Sanatan Dharma College(UR:289.02,SC:133.38); Rajdhani College(UR:249.68,SC:87.29); Deshbandhu College(UR:247.27,SC:88.62)
B.Sc (Prog.) Life Science|B.Sc. (Programme)|Chemistry + Physics + Biology/Biological Studies/ Biotechnology/Biochemistry Mer|Miranda House (W)(UR:639.71,SC:526.11); Hansraj College(UR:627.33,SC:499.66); Kirori Mal College(UR:618.09,SC:477.06)
B.Sc (Prog.) Mathematical Sciences|B.Sc. (Programme)|Combination I: Any one language from List A + Mathematics/ Applied Mathematics +|Deen Dayal Upadhyaya College(UR:564.53,SC:328.93); Keshav Mahavidyalaya(UR:504.64,SC:252.48); Maharaja Agrasen College(UR:500.25,SC:270.22)
B.Sc (Prog.) Physical Science with Chemistry|B.Sc. (Programme)|Physics + Mathematics/Applied Mathematics + Chemistry Merit will be based on the|St. Stephen's College(UR:487.37,SC:376.28); Hindu College(UR:448.47,SC:309.86); Hansraj College(UR:430.01,SC:289.36)
B.Sc (Prog.) Physical Science with Computer Science/ Informatics Practices|B.Sc. (Programme)|Combination I : Physics + Mathematics/Applied Mathematics + Chemistry|St. Stephen's College(UR:534.35,SC:403.01); Hansraj College(UR:490.77,SC:328.81); Miranda House (W)(UR:451.38,SC:275.76)
B.Sc (Prog.) Physical Science with Electronics|B.Sc. (Programme)|Combination I : Physics + Mathematics/Applied Mathematics + Chemistry|Hindu College(UR:441.92,SC:295.58); Ramjas College(UR:362.57,SC:217.44); Atma Ram Sanatan Dharma College(UR:305.4,SC:149.22)
B.Sc Applied Physical Sciences with Analytical Methods in Chemistry & Biochemistry|B.Sc. (Programme)|Physics + Mathematics/Applied Mathematics + Chemistry Merit will be based on the|Kirori Mal College(UR:350.01,SC:215.37)
B.A. (Hons.) Arabic|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:523.55,SC:270.74)
B.A. (Hons.) Bengali|Languages|Combination I: Bengali from List A + Any three subjects from List B|Miranda House (W)(UR:432.87,SC:250.68); Zakir Husain Delhi College(UR:320.52,SC:223.88)
B.A. (Hons.) English|Languages|Combination I: English from List A + Any three subjects from List B|St. Stephen's College(UR:926.93,SC:819.75); Hindu College(UR:885.76,SC:783.16); Miranda House (W)(UR:863.02,SC:718.42)
B.A. (Hons.) French|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Department of Germanic and Romance Studies(UR:673.91,SC:503.33)
B.A. (Hons.) German|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Department of Germanic and Romance Studies(UR:664.69,SC:585.41)
B.A. (Hons.) Hindi|Languages|Combination I: Hindi from List A + Any three subjects from List B|Hindu College(UR:753.61,SC:662.31); Hansraj College(UR:644.38,SC:551.73); Miranda House (W)(UR:602.0,SC:399.01)
B.A. (Hons.) Italian|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Department of Germanic and Romance Studies(UR:617.83,SC:453.97)
B.A. (Hons.) Persian|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:490.75,SC:287.05); Zakir Husain Delhi College (Evening)(UR:463.29,SC:215.22)
B.A. (Hons.) Punjabi|Languages|Combination I:Punjabi from List A + Any three subjects from List B|Dyal Singh College(UR:441.39,SC:198.29); Sri Guru Nanak Dev Khalsa College(UR:428.76,SC:0); Mata Sundri College for Women (W)(UR:391.21,SC:0)
B.A. (Hons.) Sanskrit|Languages|Combination I: Any one Language from List A + Sanskrit from List A + Any two sub|St. Stephen's College(UR:694.41,SC:668.83); Hindu College(UR:480.32,SC:389.14); Zakir Husain Delhi College(UR:394.75,SC:170.51)
B.A. (Hons.) Spanish|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Department of Germanic and Romance Studies(UR:639.55,SC:474.12)
B.A. (Hons.) Urdu|Languages|Combination I: Urdu from List A + Any three subjects from List B|Kirori Mal College(UR:447.56,SC:233.63); Satyawati College(UR:387.56,SC:165.37); Zakir Husain Delhi College (Evening)(UR:256.62,SC:145.7)
B.A Program (Accounting and Finance + Computer Applications)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Delhi College of Arts and Commerce(UR:774.37,SC:602.7)
B.A Program (Accounting and Finance + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Ramanujan College(UR:771.18,SC:582.06); P.G.D.A.V. College(UR:734.29,SC:591.53); Satyawati College (Evening)(UR:678.37,SC:455.04)
B.A Program (Advertising, Sales Promotion and Sales Management (ASPSM) + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Delhi College of Arts and Commerce(UR:765.94,SC:603.44); Jesus & Mary College (W)(UR:760.49,SC:0); Kamala Nehru College (W)(UR:742.79,SC:507.82)
B.A Program (Advertising, Sales Promotion and Sales Management (ASPSM) + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:783.89,SC:582.56); Lakshmibai College (W)(UR:720.04,SC:449.28)
B.A Program (Any two disciplines from (History/Political Sc./Economics))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Atma Ram Sanatan Dharma College(UR:780.33,SC:632.76)
B.A Program (Apparel Design & Construction
+ Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lakshmibai College (W)(UR:585.26,SC:382.68)
B.A Program (Arabic + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:484.57,SC:263.02); Zakir Husain Delhi College (Evening)(UR:473.91,SC:0)
B.A Program (Arabic + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:436.44,SC:0); Zakir Husain Delhi College (Evening)(UR:369.42,SC:0)
B.A Program (Arabic + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College (Evening)(UR:435.86,SC:0); Zakir Husain Delhi College(UR:400.2,SC:200.04)
B.A Program (Banking and Insurance + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College (Evening)(UR:657.27,SC:482.05)
B.A Program (Bengali + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:462.3,SC:142.61); Zakir Husain Delhi College (Evening)(UR:362.92,SC:0)
B.A Program (Bengali + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:585.78,SC:0); Dyal Singh College(UR:464.51,SC:213.25)
B.A Program (Bengali + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kirori Mal College(UR:611.6,SC:0); Deshbandhu College(UR:361.32,SC:0); Dyal Singh College(UR:300.37,SC:234.78)
B.A Program (Bengali + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kirori Mal College(UR:649.43,SC:445.42); Miranda House (W)(UR:587.35,SC:0); Zakir Husain Delhi College(UR:241.91,SC:122.16)
B.A Program (Buddhist Studies + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Satyawati College (Evening)(UR:601.3,SC:387.51)
B.A Program (Buddhist Studies + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:606.03,SC:477.93)
B.A Program (Buddhist Studies + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:567.28,SC:396.92)
B.A Program (Buddhist Studies + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Satyawati College (Evening)(UR:579.92,SC:370.61); Kalindi College (W)(UR:571.86,SC:359.96)
B.A Program (Commerce + Computer Applications)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:739.6,SC:395.99)
B.A Program (Commerce + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hansraj College(UR:874.96,SC:709.39); Indraprastha College for Women (W)(UR:828.7,SC:630.71); Dyal Singh College(UR:766.68,SC:538.98)
B.A Program (Commerce + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:788.89,SC:602.24)
B.A Program (Computer Applications + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:863.64,SC:631.87); Gargi College (W)(UR:796.43,SC:592.93); Indraprastha College for Women (W)(UR:749.51,SC:401.18)
B.A Program (Computer Applications + Entrepreneurship and Small Business (ESB))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:713.48,SC:436.44); Mata Sundri College for Women (W)(UR:593.35,SC:0); Kalindi College (W)(UR:590.14,SC:392.99)
B.A Program (Computer Applications + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:558.29,SC:371.64); Shyama Prasad Mukherji College For Women (W)(UR:532.34,SC:267.85)
B.A Program (Computer Applications + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:588.68,SC:359.57)
B.A Program (Computer Applications + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:605.28,SC:385.83); Shyam Lal College (Evening)(UR:554.17,SC:303.07); Vivekananda College (W)(UR:553.18,SC:243.79)
B.A Program (Economics + Entrepreneurship and Small Business (ESB))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:777.23,SC:621.31); Ramanujan College(UR:749.44,SC:549.33); Kalindi College (W)(UR:701.03,SC:460.52)
B.A Program (Economics + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:845.53,SC:809.95); Dyal Singh College(UR:726.29,SC:635.32); Shivaji College(UR:660.66,SC:488.85)
B.A Program (Economics + HDFE)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Janki Devi Memorial College (W)(UR:642.55,SC:334.22)
B.A Program (Economics + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:883.17,SC:732.31); Miranda House (W)(UR:861.06,SC:752.14); Hansraj College(UR:845.34,SC:718.34)
B.A Program (Economics + Human Resource Management (HRM))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Delhi College of Arts and Commerce(UR:787.24,SC:571.39); Jesus & Mary College (W)(UR:780.8,SC:0); Zakir Husain Delhi College(UR:677.72,SC:457.47)
B.A Program (Economics + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Guru Tegh Bahadur Khalsa College(UR:799.07,SC:0); Sri Aurobindo College (Evening)(UR:641.07,SC:378.29); Janki Devi Memorial College (W)(UR:609.77,SC:361.74)
B.A Program (Economics + OMSP)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:663.13,SC:421.3); Satyawati College(UR:619.05,SC:361.64); Dr. Bhim Rao Ambedkar College(UR:618.45,SC:381.93)
B.A Program (Economics + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kirori Mal College(UR:840.41,SC:686.33); Dyal Singh College(UR:722.07,SC:506.81); Deshbandhu College(UR:686.11,SC:462.21)
B.A Program (Economics + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:600.29,SC:459.52)
B.A Program (Economics + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:897.2,SC:790.66); Miranda House (W)(UR:885.54,SC:777.76); Kirori Mal College(UR:859.13,SC:717.66)
B.A Program (Economics + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:836.93,SC:624.41); Ramanujan College(UR:752.7,SC:568.65); Mata Sundri College for Women (W)(UR:727.81,SC:0)
B.A Program (Economics + Sanskrit)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:522.48,SC:320.07)
B.A Program (Economics + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:747.57,SC:526.07); Shyama Prasad Mukherji College For Women (W)(UR:597.78,SC:359.09)
B.A Program (Education + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:529.79,SC:317.48)
B.A Program (Education + Human Development and Family Empowerment (HDFE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:529.63,SC:314.23)
B.A Program (Education + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:507.81,SC:293.51)
B.A Program (English + Advertising, Sales Promotion and Sales Management (ASPSM))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:704.7,SC:488.61)
B.A Program (English + Computer Applications)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Vivekananda College (W)(UR:595.4,SC:413.31); Shyam Lal College (Evening)(UR:577.49,SC:409.82)
B.A Program (English + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hindu College(UR:894.51,SC:789.26); Miranda House (W)(UR:869.19,SC:707.07); Shaheed Bhagat Singh College(UR:798.29,SC:591.14)
B.A Program (English + French)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:626.73,SC:0); Vivekananda College (W)(UR:586.47,SC:390.3)
B.A Program (English + German)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:628.16,SC:435.6); Delhi College of Arts and Commerce(UR:617.26,SC:469.93)
B.A Program (English + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:855.08,SC:783.08); Daulat Ram College (W)(UR:775.53,SC:627.14); Gargi College (W)(UR:767.56,SC:627.96)
B.A Program (English + Human Development and Family Empowerment (HDFE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:693.87,SC:490.24)
B.A Program (English + Linguistics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Rajdhani College(UR:625.55,SC:453.16)
B.A Program (English + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:644.17,SC:481.2)
B.A Program (English + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:812.73,SC:672.4); Gargi College (W)(UR:737.61,SC:548.3); Jesus & Mary College (W)(UR:720.61,SC:0)
B.A Program (English + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:582.27,SC:478.1)
B.A Program (English + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:883.92,SC:723.78); Kirori Mal College(UR:858.51,SC:746.33); Indraprastha College for Women (W)(UR:783.25,SC:647.1)
B.A Program (English + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:822.74,SC:678.98); Kamala Nehru College (W)(UR:798.08,SC:624.64); Aryabhatta College(UR:748.44,SC:566.95)
B.A Program (English + Sanskrit)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:485.47,SC:225.48)
B.A Program (English + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:721.98,SC:0); Maitreyi College (W)(UR:711.1,SC:517.26); Shivaji College(UR:660.73,SC:498.09)
B.A Program (English + Sociology/Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:823.7,SC:660.97)
B.A Program (English + Spanish)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Delhi College of Arts and Commerce(UR:583.9,SC:399.52)
B.A Program (Entrepreneurship And Small Business + Nutrition And Health Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Daulat Ram College (W)(UR:720.05,SC:515.05)
B.A Program (Entrepreneurship and Small Business (ESB) + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:600.96,SC:340.01)
B.A Program (Entrepreneurship and Small Business (ESB) + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:600.84,SC:331.82); Dyal Singh College (Evening)(UR:577.44,SC:329.9)
B.A Program (Entrepreneurship and Small Business (ESB) + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:690.48,SC:526.03); Kalindi College (W)(UR:618.68,SC:346.91); Dyal Singh College (Evening)(UR:574.87,SC:355.39)
B.A Program (French + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Vivekananda College (W)(UR:608.99,SC:357.35)
B.A Program (French + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:511.71,SC:0)
B.A Program (Geography + English)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:841.11,SC:0); Indraprastha College for Women (W)(UR:775.54,SC:605.93)
B.A Program (Geography + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:851.93,SC:751.77); Indraprastha College for Women (W)(UR:805.13,SC:0); Kamala Nehru College (W)(UR:731.82,SC:548.71)
B.A Program (Geography + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:907.94,SC:787.98); Indraprastha College for Women (W)(UR:797.99,SC:638.48); Shaheed Bhagat Singh College(UR:762.37,SC:586.36)
B.A Program (Geography + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dr. Bhim Rao Ambedkar College(UR:712.67,SC:492.58)
B.A Program (Geography + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:839.87,SC:717.56)
B.A Program (German + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:569.93,SC:344.2)
B.A Program (German + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:624.18,SC:324.47)
B.A Program (Hindi + Buddhist Studies)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Satyawati College (Evening)(UR:521.22,SC:322.21)
B.A Program (Hindi + Computer Applications)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Shyam Lal College (Evening)(UR:499.6,SC:263.17)
B.A Program (Hindi + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Deshbandhu College(UR:639.64,SC:455.03); Maharaja Agrasen College(UR:586.23,SC:418.18); Zakir Husain Delhi College(UR:577.29,SC:426.08)
B.A Program (Hindi + Entrepreneurship and Small Business (ESB))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:582.57,SC:415.57)
B.A Program (Hindi + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:707.24,SC:489.5); Shaheed Bhagat Singh College(UR:660.55,SC:494.45); Dyal Singh College(UR:645.93,SC:537.13)
B.A Program (Hindi + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:807.05,SC:703.48); Indraprastha College for Women (W)(UR:705.52,SC:522.04); Gargi College (W)(UR:656.2,SC:497.19)
B.A Program (Hindi + History/Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:780.23,SC:663.51)
B.A Program (Hindi + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:612.62,SC:407.79); Janki Devi Memorial College (W)(UR:482.66,SC:381.1)
B.A Program (Hindi + NHE)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:453.82,SC:199.13)
B.A Program (Hindi + OMSP)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:440.85,SC:153.02)
B.A Program (Hindi + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hindu College(UR:810.47,SC:711.84); Deshbandhu College(UR:611.14,SC:427.9); Shyama Prasad Mukherji College For Women (W)(UR:533.29,SC:328.07)
B.A Program (Hindi + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hansraj College(UR:689.44,SC:547.32); Delhi College of Arts and Commerce(UR:596.31,SC:468.6); Daulat Ram College (W)(UR:593.89,SC:452.53)
B.A Program (Hindi + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:849.61,SC:710.53); Kirori Mal College(UR:829.13,SC:716.52); Indraprastha College for Women (W)(UR:732.22,SC:503.38)
B.A Program (Hindi + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:763.53,SC:506.16)
B.A Program (Hindi + Sanskrit)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:454.03,SC:221.55); Sri Aurobindo College (Evening)(UR:434.68,SC:225.03)
B.A Program (Hindi + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Shyama Prasad Mukherji College For Women (W)(UR:563.5,SC:430.13)
B.A Program (History + Apparel Design & Construction (ADC))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bhagini Nivedita College (W)(UR:489.07,SC:271.91)
B.A Program (History + Human Development and Family Empowerment (HDFE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bhagini Nivedita College (W)(UR:482.01,SC:270.6)
B.A Program (History + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Guru Tegh Bahadur Khalsa College(UR:721.84,SC:0); Sri Aurobindo College (Evening)(UR:536.85,SC:411.99); Kalindi College (W)(UR:532.83,SC:267.65)
B.A Program (History + Nutrition and Health Education (NHE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bhagini Nivedita College (W)(UR:485.14,SC:282.69)
B.A Program (History + OMSP)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:589.96,SC:414.48); Swami Shardhanand College(UR:551.51,SC:365.26); Bharati College (W)(UR:529.08,SC:283.0)
B.A Program (History + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:830.25,SC:664.63); Kirori Mal College(UR:823.01,SC:699.09); Indraprastha College for Women (W)(UR:756.9,SC:545.56)
B.A Program (History + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:768.55,SC:659.08); Kamala Nehru College (W)(UR:690.74,SC:458.99); Sri Aurobindo College (Evening)(UR:535.57,SC:425.82)
B.A Program (History + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hindu College(UR:936.18,SC:856.1); Miranda House (W)(UR:891.72,SC:815.81); Lady Shri Ram College for Women (W)(UR:888.25,SC:789.0)
B.A Program (History + Sanskrit)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Aurobindo College (Evening)(UR:404.59,SC:282.4)
B.A Program (History + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:846.76,SC:669.99); Miranda House (W)(UR:839.95,SC:727.57); Indraprastha College for Women (W)(UR:773.7,SC:589.86)
B.A Program (Human Development and
Family Empowerment (HDFE) + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:495.58,SC:212.49)
B.A Program (Human Development and Family  Empowerment (HDFE) + Hindi)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:652.01,SC:377.84)
B.A Program (Human Development and Family  Empowerment (HDFE) + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:796.2,SC:599.74)
B.A Program (Human Development and Family Empowerment (HDFE) + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:690.24,SC:403.48); Janki Devi Memorial College (W)(UR:575.44,SC:332.57)
B.A Program (Human Development and Family Empowerment (HDFE) + Political
Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Janki Devi Memorial College (W)(UR:555.01,SC:278.09)
B.A Program (Human Development and Family Empowerment (HDFE) + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bharati College (W)(UR:528.51,SC:263.17); Shyama Prasad Mukherji College For Women (W)(UR:524.4,SC:268.77); Bhagini Nivedita College (W)(UR:489.12,SC:146.48)
B.A Program (Human Development and Family Empowerment (HDFE) + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:699.65,SC:511.79); Shyama Prasad Mukherji College For Women (W)(UR:545.93,SC:292.08)
B.A Program (Human Resource Management (HRM) + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dyal Singh College (Evening)(UR:628.84,SC:368.07)
B.A Program (Human Resource Management (HRM) + English)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:743.75,SC:494.89)
B.A Program (Human Resource Management (HRM) + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:644.01,SC:416.63)
B.A Program (Human Resource Management (HRM) + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:822.22,SC:0); Zakir Husain Delhi College(UR:747.11,SC:580.33); Dr. Bhim Rao Ambedkar College(UR:733.85,SC:551.14)
B.A Program (Linguistics + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Rajdhani College(UR:582.37,SC:402.05)
B.A Program (Music + Nutrition And Health Education(NHE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Daulat Ram College (W)(UR:652.79,SC:429.23)
B.A Program (Music + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Janki Devi Memorial College (W)(UR:600.58,SC:315.85)
B.A Program (Music + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Janki Devi Memorial College (W)(UR:566.44,SC:364.71); Kalindi College (W)(UR:528.18,SC:291.44); Mata Sundri College for Women (W)(UR:486.33,SC:0)
B.A Program (Music + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:445.94,SC:188.37)
B.A Program (NHE + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:489.9,SC:181.18)
B.A Program (Office Management & Secretarial Practice (OMSP) + English)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Mata Sundri College for Women (W)(UR:611.42,SC:0)
B.A Program (Office Management & Secretarial Practice (OMSP) + Political
Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Maharaja Agrasen College(UR:616.39,SC:419.4); Dr. Bhim Rao Ambedkar College(UR:599.18,SC:426.84)
B.A Program (Office Management & Secretarial Practice (OMSP) + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Swami Shardhanand College(UR:583.23,SC:471.85); Bhagini Nivedita College (W)(UR:532.02,SC:391.7)
B.A Program (Office Management & Secretarial Practice (OMSP) + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Aditi Mahavidyalaya (W)(UR:521.78,SC:191.96)
B.A Program (Operational Research (OR) + Computer Applications)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Delhi College of Arts and Commerce(UR:703.41,SC:462.8)
B.A Program (Persian + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:360.83,SC:224.69); Zakir Husain Delhi College (Evening)(UR:333.02,SC:0)
B.A Program (Persian + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:264.73,SC:0); Zakir Husain Delhi College (Evening)(UR:241.13,SC:0)
B.A Program (Persian + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:128.87,SC:0); Zakir Husain Delhi College (Evening)(UR:112.37,SC:0)
B.A Program (Philosophy + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hansraj College(UR:741.68,SC:624.02)
B.A Program (Philosophy + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:856.62,SC:675.69); Kirori Mal College(UR:845.21,SC:712.59); Gargi College (W)(UR:737.36,SC:547.41)
B.A Program (Philosophy + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Gargi College (W)(UR:820.0,SC:664.2); Jesus & Mary College (W)(UR:802.43,SC:0); Indraprastha College for Women (W)(UR:795.91,SC:612.21)
B.A Program (Philosophy + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Indraprastha College for Women (W)(UR:738.73,SC:550.84); Kamala Nehru College (W)(UR:691.21,SC:524.64); Lakshmibai College (W)(UR:579.72,SC:351.84)
B.A Program (Physical Education + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|P.G.D.A.V. College (Evening)(UR:539.88,SC:390.93)
B.A Program (Physical Education + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:790.98,SC:661.19); Daulat Ram College (W)(UR:734.86,SC:538.72); P.G.D.A.V. College(UR:618.76,SC:472.29)
B.A Program (Physical Education + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lakshmibai College (W)(UR:680.06,SC:483.33)
B.A Program (Political Science + Apparel Design & Construction (ADC))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bhagini Nivedita College (W)(UR:503.88,SC:178.03)
B.A Program (Political Science + Nutrition and Health Education (NHE))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Bhagini Nivedita College (W)(UR:505.26,SC:264.14)
B.A Program (Political Science + Psychology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:886.19,SC:754.47); Ramanujan College(UR:771.3,SC:580.88)
B.A Program (Political Science + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:880.25,SC:733.54); Jesus & Mary College (W)(UR:755.81,SC:0); Maitreyi College (W)(UR:725.33,SC:544.52)
B.A Program (Psychology + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lady Shri Ram College for Women (W)(UR:874.82,SC:740.61); Jesus & Mary College (W)(UR:838.91,SC:0); Indraprastha College for Women (W)(UR:834.62,SC:635.41)
B.A Program (Punjabi + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dyal Singh College(UR:566.58,SC:349.09); Sri Guru Nanak Dev Khalsa College(UR:472.09,SC:0); Bharati College (W)(UR:409.46,SC:261.68)
B.A Program (Punjabi + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:706.69,SC:618.02); Deshbandhu College(UR:437.39,SC:0); Dyal Singh College(UR:421.11,SC:216.7)
B.A Program (Punjabi + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dyal Singh College(UR:531.34,SC:337.33); Deshbandhu College(UR:518.88,SC:0); Maitreyi College (W)(UR:446.68,SC:0)
B.A Program (Sanskrit + Buddhist Studies)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:257.63,SC:0)
B.A Program (Sanskrit + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Deshbandhu College(UR:498.25,SC:132.14); Sri Aurobindo College (Day)(UR:482.95,SC:0); Swami Shardhanand College(UR:424.49,SC:0)
B.A Program (Sanskrit + Geography)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:690.04,SC:0); Indraprastha College for Women (W)(UR:512.31,SC:0); Dyal Singh College(UR:487.3,SC:248.41)
B.A Program (Sanskrit + HDFE)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Janki Devi Memorial College (W)(UR:339.47,SC:0)
B.A Program (Sanskrit + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:729.4,SC:0); Indraprastha College for Women (W)(UR:544.62,SC:268.35); Maitreyi College (W)(UR:490.47,SC:91.07)
B.A Program (Sanskrit + Music)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kalindi College (W)(UR:467.65,SC:0); Daulat Ram College (W)(UR:327.76,SC:0); Aditi Mahavidyalaya (W)(UR:278.63,SC:0)
B.A Program (Sanskrit + OMSP)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dr. Bhim Rao Ambedkar College(UR:282.39,SC:115.38); Swami Shardhanand College(UR:263.02,SC:0)
B.A Program (Sanskrit + Philosophy)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hansraj College(UR:620.13,SC:343.38); Indraprastha College for Women (W)(UR:471.21,SC:301.26); Deshbandhu College(UR:467.51,SC:256.28)
B.A Program (Sanskrit + Physical Education)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Kamala Nehru College (W)(UR:289.84,SC:0)
B.A Program (Sanskrit + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Hindu College(UR:807.89,SC:616.43); Miranda House (W)(UR:759.67,SC:424.52); Indraprastha College for Women (W)(UR:613.09,SC:169.69)
B.A Program (Sanskrit + Sociology)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Lakshmibai College (W)(UR:182.98,SC:0)
B.A Program (Sanskrit +Sociology/History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:605.86,SC:309.22)
B.A Program (Sindhi + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Deshbandhu College(UR:320.24,SC:0)
B.A Program (Spanish + Advertising, Sales Promotion and Sales Management (ASPSM))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:490.96,SC:0)
B.A Program (Spanish + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:496.4,SC:0)
B.A Program (Tamil + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:665.84,SC:485.84); Dyal Singh College (Evening)(UR:111.56,SC:0)
B.A Program (Tamil + Political Science/History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:460.78,SC:165.68)
B.A Program (Telegu + Political Science/History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Sri Venketeswara College(UR:545.34,SC:240.67)
B.A Program (Urdu + Economics)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dyal Singh College(UR:574.26,SC:0); Zakir Husain Delhi College(UR:505.44,SC:0); Zakir Husain Delhi College (Evening)(UR:482.9,SC:0)
B.A Program (Urdu + History)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Dyal Singh College(UR:485.6,SC:0); Zakir Husain Delhi College(UR:441.56,SC:0); Zakir Husain Delhi College (Evening)(UR:392.9,SC:0)
B.A Program (Urdu + Political Science)|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|Zakir Husain Delhi College(UR:498.19,SC:0); Zakir Husain Delhi College (Evening)(UR:496.52,SC:0); Dyal Singh College(UR:496.1,SC:255.58)
B.A. (Hons.) Hindi Patrakarita|Arts, Humanities & Social Sciences|Combination I: Hindi from List A + Any three subjects from List B|Ram Lal Anand College(UR:523.76,SC:339.35); Sri Guru Nanak Dev Khalsa College(UR:435.82,SC:0); Dr. Bhim Rao Ambedkar College(UR:425.68,SC:299.41)
B.A. (Hons.) Multi Media and Mass Communication|Arts, Humanities & Social Sciences|Any one Language from List A + Any one subject from List B + General Aptitude Te|Indraprastha College for Women (W)(UR:520.67,SC:393.73)
B.A. (Hons.) Russian|Languages|Combination I: Any one Language from List A + Any three subjects from List B|Department of Slavonic and Finno Ugrian Studies(UR:575.27,SC:388.38)
B.A. (Vocational Studies) Human  Resource Management|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:681.0,SC:460.8)
B.A. (Vocational Studies) Management and Marketing of Insurance|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:663.0,SC:438.13)
B.A. (Vocational Studies) Marketing Management and Retail Business|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:666.03,SC:433.01)
B.A. (Vocational Studies) Material Management|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:630.58,SC:392.57)
B.A. (Vocational Studies) Office Management and Secretarial Practice|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:631.26,SC:401.18)
B.A. (Vocational Studies) Small and Medium Enterprises|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:651.12,SC:402.05)
B.A. (Vocational Studies) Tourism Management|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|College of Vocational Studies(UR:631.37,SC:418.45)
B.A. Program (Any two discipline out of these (Economics/English/History/Political
Science/Philosophy))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|St. Stephen's College(UR:912.57,SC:826.93)
B.A. Program (Urdu + Any other discipline subject from (Economics/History/Political Science/Philosophy))|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Any three subjects from List B|St. Stephen's College(UR:726.19,SC:0)
B.Tech. Information Technology and Mathematical Innovations (IT & MI)|Sciences, Mathematics & Technology|Any one Language from List A + Mathematics/Applied Mathematics + General Aptitud|Cluster Innovation Centre(UR:550.74,SC:432.24)
B.Voc Health Care Management|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:653.94,SC:0)
B.Voc Retail Management and IT|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|Jesus & Mary College (W)(UR:662.46,SC:0)
B.Voc Software Development|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|Ramanujan College(UR:599.25,SC:438.23)
B.Voc. Banking, Financial Services and Insurance|Vocational Studies|Combination I :Any one Language from List A + Any three subjects from List B|Ramanujan College(UR:728.97,SC:513.46)
Bachelor of Elementary Education (B.El.Ed.)|Education|Combination I:Any one Language from List A + Any three subjects from List B|Miranda House (W)(UR:738.28,SC:637.72); Lady Shri Ram College for Women (W)(UR:733.4,SC:618.39); Gargi College (W)(UR:679.49,SC:581.33)
Five Year Integrated Program in Journalism|Arts, Humanities & Social Sciences|Combination I: Any one Language from List A + Mass Media/Mass Communication from|Delhi School of Journalism(UR:499.68,SC:366.83)`;

    // Put system as first turn in contents (most compatible with all Gemini models)
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM }] },
      { role: 'model', parts: [{ text: 'Understood! I am your DU Admission AI Guide. I have the complete database of 265 DU programmes. How can I help you?' }] }
    ];

    // Add last 4 messages from history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.slice(-4).forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current question
    contents.push({ role: 'user', parts: [{ text: message }] });

    const body = {
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
    };
    return await callGemini(apiKey, body, res, 'chat');
  }

  return res.status(400).json({ error: { message: 'Invalid mode.' } });
}

async function callGemini(apiKey, body, res, mode) {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (mode === 'scorecard') {
          return res.status(200).json({ content: [{ type: 'text', text }] });
        }
        return res.status(200).json({ reply: text });
      }

      lastError = data.error?.message || 'Error ' + response.status;
      console.error('Model', model, 'failed:', lastError);
      const retry = lastError.includes('not found') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED');
      if (!retry) break;

    } catch(e) {
      lastError = e.message;
      console.error('Model', model, 'threw:', e.message);
    }
  }

  return res.status(500).json({ error: { message: lastError || 'All models failed.' } });
}
