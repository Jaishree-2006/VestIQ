import { parseCasText } from '../src/utils/casParser';
import fs from 'fs';

const ananyaText = fs.readFileSync('scratch/test_ananya.txt', 'utf-8');
const result = parseCasText(ananyaText, 'ananya_cas.pdf');
console.log('Parsed result for Ananya:', {
  investorName: result.investorName,
  pan: result.pan,
  totalAssets: result.totalAssets,
  holdingsCount: result.holdingsCount,
  detectedBrokers: result.detectedBrokers,
  holdings: result.parsedHoldings.map(h => ({ name: h.name, val: h.currentValue, broker: h.broker }))
});
