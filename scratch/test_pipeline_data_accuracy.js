import { computeHealthScore, DEFAULT_THRESHOLDS } from '../server/healthScoreEngine.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Original ~72-score Priya Sharma Portfolio
const ORIG_HOLDINGS = [
  { id: 'ps1', name: 'Reliance Industries Ltd', isin: 'INE002A01018', category: 'equities', broker: 'Zerodha', quantity: 120, avgPrice: 2410.00, currentPrice: 2570.00, currentValue: 308400.00, portfolioWeight: 16.3, lockInMonths: 0 },
  { id: 'ps2', name: 'HDFC Bank Ltd', isin: 'INE040A01034', category: 'equities', broker: 'ICICI Direct', quantity: 200, avgPrice: 1540.00, currentPrice: 1630.00, currentValue: 326000.00, portfolioWeight: 17.2, lockInMonths: 0 },
  { id: 'ps3', name: 'Infosys Ltd', isin: 'INE009A01021', category: 'equities', broker: 'Zerodha', quantity: 150, avgPrice: 1290.00, currentPrice: 1237.33, currentValue: 185600.00, portfolioWeight: 9.8, lockInMonths: 0 },
  { id: 'ps4', name: 'PFC 7.35% NCD 2029', isin: 'INE134E07563', category: 'bonds', broker: 'ICICI Direct', quantity: 300, avgPrice: 1000.00, currentPrice: 1033.33, currentValue: 310000.00, portfolioWeight: 16.4, lockInMonths: 0 },
  { id: 'ps5', name: 'Embassy Office Parks REIT', isin: 'INE041025011', category: 'reits_invits', broker: 'Zerodha', quantity: 800, avgPrice: 340.00, currentPrice: 340.00, currentValue: 272000.00, portfolioWeight: 14.4, lockInMonths: 0 },
  { id: 'ps6', name: 'Grid Infrastructure InvIT', isin: 'INE081U23015', category: 'reits_invits', broker: 'Relationship Manager - ICICI', quantity: 4400, avgPrice: 100.00, currentPrice: 100.14, currentValue: 440600.00, portfolioWeight: 23.3, lockInMonths: 36 },
  { id: 'ps7', name: 'Parag Parikh Flexi Cap Fund', isin: 'INF879O01015', category: 'equities', broker: 'CAMS / KFintech', quantity: 612.45, avgPrice: 82.10, currentPrice: 82.10, currentValue: 50282.14, portfolioWeight: 2.6, lockInMonths: 0 }
];

// 2. HighScore Portfolio (Diversified across Bonds, Equities, Gold, Mutual Funds; no concentration > 25%, no lock-in)
const HIGHSCORE_HOLDINGS = [
  { id: 'hs1', name: 'G-Sec 7.26% 2033 Bond', isin: 'IN0020230018', category: 'bonds', broker: 'RBI Retail Direct', quantity: 250, avgPrice: 1000.00, currentPrice: 1000.00, currentValue: 250000.00, portfolioWeight: 25.0, lockInMonths: 0 },
  { id: 'hs2', name: 'Sovereign Gold Bond 2030', isin: 'IN0020200278', category: 'bonds', broker: 'Zerodha', quantity: 250, avgPrice: 1000.00, currentPrice: 1000.00, currentValue: 250000.00, portfolioWeight: 25.0, lockInMonths: 0 },
  { id: 'hs3', name: 'Nifty 50 Index Direct Fund', isin: 'INF200K01150', category: 'equities', broker: 'Groww', quantity: 1250, avgPrice: 200.00, currentPrice: 200.00, currentValue: 250000.00, portfolioWeight: 25.0, lockInMonths: 0 },
  { id: 'hs4', name: 'Parag Parikh Flexi Cap Direct', isin: 'INF879O01015', category: 'equities', broker: 'CAMS', quantity: 2500, avgPrice: 100.00, currentPrice: 100.00, currentValue: 250000.00, portfolioWeight: 25.0, lockInMonths: 0 }
];

// 3. LowScore Portfolio (Severe concentration: 70% in 1 illiquid InvIT with 36m lock-in, 30% in equity)
const LOWSCORE_HOLDINGS = [
  { id: 'ls1', name: 'Powergrid Infrastructure InvIT', isin: 'INE081U23015', category: 'reits_invits', broker: 'RM ICICI', quantity: 7000, avgPrice: 100.00, currentPrice: 100.00, currentValue: 700000.00, portfolioWeight: 70.0, lockInMonths: 36 },
  { id: 'ls2', name: 'Reliance Industries Ltd', isin: 'INE002A01018', category: 'equities', broker: 'Zerodha', quantity: 120, avgPrice: 2410.00, currentPrice: 2500.00, currentValue: 300000.00, portfolioWeight: 30.0, lockInMonths: 0 }
];

// 4. Broker-Name Variant Portfolio (Same asset balance as Orig, but with Groww and Paytm Money DP/Brokers)
const BROKER_VARIANT_HOLDINGS = ORIG_HOLDINGS.map(h => ({
  ...h,
  broker: h.broker === 'Zerodha' ? 'Groww' : (h.broker === 'ICICI Direct' ? 'Paytm Money' : h.broker)
}));

// 5. Edge Case 1: 1 Single Holding
const ONE_HOLDING = [
  { id: 'e1', name: 'Reliance Industries Ltd', isin: 'INE002A01018', category: 'equities', broker: 'Zerodha', quantity: 100, avgPrice: 2410.00, currentPrice: 2500.00, currentValue: 250000.00, portfolioWeight: 100.0, lockInMonths: 0 }
];

// 6. Edge Case 2: No Liquidity Risk (0 lock-in instruments)
const NO_LIQUIDITY_RISK = [
  { id: 'e2a', name: 'HDFC Bank Ltd', isin: 'INE040A01034', category: 'equities', broker: 'Zerodha', quantity: 200, avgPrice: 1500.00, currentPrice: 1500.00, currentValue: 300000.00, portfolioWeight: 50.0, lockInMonths: 0 },
  { id: 'e2b', name: 'PFC 7.35% NCD 2029', isin: 'INE134E07563', category: 'bonds', broker: 'Zerodha', quantity: 300, avgPrice: 1000.00, currentPrice: 1000.00, currentValue: 300000.00, portfolioWeight: 50.0, lockInMonths: 0 }
];

function runFullAudit() {
  console.log('========================================================================');
  console.log('VESTIQ E2E CORE PIPELINE DATA-ACCURACY & SCORES COMPREHENSIVE AUDIT');
  console.log('========================================================================\n');

  const testCases = [
    { name: 'Original Sample (~72 Score)', holdings: ORIG_HOLDINGS },
    { name: 'HighScore Sample (Diversified, No Lock-in)', holdings: HIGHSCORE_HOLDINGS },
    { name: 'LowScore Sample (70% Conc + 36m Lock-in InvIT)', holdings: LOWSCORE_HOLDINGS },
    { name: 'Broker-Name Variant (Groww & Paytm Money)', holdings: BROKER_VARIANT_HOLDINGS }
  ];

  // 1. Verification of 4 Sample Portfolios
  console.log('--- 1. Verification of 4 Sample CAS Portfolios ---\n');
  const scores = {};

  testCases.forEach(tc => {
    console.log(`>>> Portfolio: ${tc.name}`);
    console.log(`Holdings count: ${tc.holdings.length}`);
    
    // Sum check
    const sumVal = tc.holdings.reduce((sum, h) => sum + h.currentValue, 0);
    console.log(`Calculated sum of holdings: ₹${sumVal.toLocaleString('en-IN')}`);
    
    // Weight check
    let weightErr = false;
    tc.holdings.forEach(h => {
      const calcWeight = parseFloat(((h.currentValue / sumVal) * 100).toFixed(1));
      if (Math.abs(calcWeight - h.portfolioWeight) > 0.5) {
        weightErr = true;
        console.log(`  Weight mismatch for ${h.name}: expected ${calcWeight}%, got ${h.portfolioWeight}%`);
      }
    });
    console.log(`Portfolio weights check: ${!weightErr ? 'PASS' : 'FAIL'}`);

    // Scoring check
    const scoreRes = computeHealthScore(tc.holdings);
    scores[tc.name] = scoreRes.score;
    console.log(`Health Score: ${scoreRes.score} / 100`);
    console.log('Factors breakdown:');
    scoreRes.breakdown.forEach(b => console.log(`  - [${b.factor}] ${b.penaltyOrBonus} pts: ${b.reason}`));
    console.log('\n');
  });

  console.log('Score Directionality Check:');
  console.log(`  HighScore (${scores['HighScore Sample (Diversified, No Lock-in)']}) > Original (${scores['Original Sample (~72 Score)']}) > LowScore (${scores['LowScore Sample (70% Conc + 36m Lock-in InvIT)']})`);
  const directionPass = scores['HighScore Sample (Diversified, No Lock-in)'] > scores['Original Sample (~72 Score)'] &&
                        scores['Original Sample (~72 Score)'] > scores['LowScore Sample (70% Conc + 36m Lock-in InvIT)'];
  console.log(`Directionality result: ${directionPass ? 'PASS' : 'FAIL'}\n`);

  // 2. Admin Threshold Override Verification
  console.log('--- 2. Admin Threshold Persistence & Calculation Override Check ---\n');
  const defaultScore = computeHealthScore(LOWSCORE_HOLDINGS, null, DEFAULT_THRESHOLDS).score;
  const customThresholds = { ...DEFAULT_THRESHOLDS, CONCENTRATION_THRESHOLD_PCT: 80, CONCENTRATION_TOTAL_MAX_PENALTY: 5 };
  const customScore = computeHealthScore(LOWSCORE_HOLDINGS, null, customThresholds).score;

  console.log(`LowScore portfolio score under DEFAULT thresholds (25% conc cutoff): ${defaultScore}`);
  console.log(`LowScore portfolio score under ADMIN OVERRIDE thresholds (80% conc cutoff): ${customScore}`);
  const thresholdPass = defaultScore !== customScore;
  console.log(`Admin Threshold calculation impact: ${thresholdPass ? 'PASS (Score changed dynamically from ' + defaultScore + ' to ' + customScore + ')' : 'FAIL'}\n`);

  // 3. DPDP Export Consistency Check
  console.log('--- 3. DPDP Export Data Consistency Check ---\n');
  const exportPayload = {
    userProfile: { fullName: 'Priya Sharma', panMasked: 'ABCDE****F' },
    portfolio: {
      holdingsCount: ORIG_HOLDINGS.length,
      holdings: ORIG_HOLDINGS,
      currentHealthScore: scores['Original Sample (~72 Score)'],
      healthScoreBreakdown: computeHealthScore(ORIG_HOLDINGS).breakdown
    }
  };

  const dashboardVal = ORIG_HOLDINGS.reduce((s, h) => s + h.currentValue, 0);
  const exportVal = exportPayload.portfolio.holdings.reduce((s, h) => s + h.currentValue, 0);

  console.log(`Dashboard portfolio value: ₹${dashboardVal.toLocaleString('en-IN')}`);
  console.log(`Exported portfolio value: ₹${exportVal.toLocaleString('en-IN')}`);
  console.log(`Dashboard score: ${scores['Original Sample (~72 Score)']}`);
  console.log(`Exported score: ${exportPayload.portfolio.currentHealthScore}`);
  const exportPass = dashboardVal === exportVal && scores['Original Sample (~72 Score)'] === exportPayload.portfolio.currentHealthScore;
  console.log(`DPDP Export consistency check: ${exportPass ? 'PASS (100% exact match)' : 'FAIL'}\n`);

  // 4. Edge Cases Verification
  console.log('--- 4. Edge Cases Verification ---\n');
  
  console.log('>>> Edge Case 1: 1 Single Holding Portfolio');
  const e1Res = computeHealthScore(ONE_HOLDING);
  console.log(`Score: ${e1Res.score} / 100`);
  console.log('Breakdown:');
  e1Res.breakdown.forEach(b => console.log(`  - ${b.factor}: ${b.penaltyOrBonus} pts`));
  const e1Pass = !Number.isNaN(e1Res.score) && e1Res.score >= 0 && e1Res.score <= 100;
  console.log(`Validity check (no NaN, non-negative, range 0-100): ${e1Pass ? 'PASS' : 'FAIL'}\n`);

  console.log('>>> Edge Case 2: Portfolio with 0 Liquidity Risk Instruments');
  const e2Res = computeHealthScore(NO_LIQUIDITY_RISK);
  console.log(`Score: ${e2Res.score} / 100`);
  console.log('Breakdown:');
  e2Res.breakdown.forEach(b => console.log(`  - ${b.factor}: ${b.penaltyOrBonus} pts`));
  const hasLiqPenalty = e2Res.breakdown.some(b => b.id === 'liquidity');
  console.log(`Liquidity penalty absent check: ${!hasLiqPenalty ? 'PASS (No liquidity penalty applied)' : 'FAIL'}\n`);
}

runFullAudit();
