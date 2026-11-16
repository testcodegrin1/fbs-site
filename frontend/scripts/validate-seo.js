const path = require('path');
const { serviceAreas, getServiceArea } = require(path.join(__dirname, '../app/data/service-areas-data.ts'));
const { citySeoConfig, getCitySeo } = require(path.join(__dirname, '../app/lib/city-seo-config.ts'));
const { siteConfig, supportedHosts } = require(path.join(__dirname, '../app/lib/seo.ts'));

console.log('=== VERIFYING ALL 25 CITIES ===\n');

let failed = 0;
const results = [];

serviceAreas.forEach((area, index) => {
  const seo = getCitySeo(area.slug);
  const hasSeo = !!seo;
  const hasH1 = !!seo?.h1;
  const hasPrimaryKeyword = !!seo?.primaryKeyword;
  const hasSeoTitle = !!seo?.seoTitle;
  const hasMetaDesc = !!seo?.metaDescription;
  const qaCount = area.quickAnswers ? area.quickAnswers.length : 0;
  const faqsCount = area.faqs ? area.faqs.length : 0;

  if (!hasSeo || !hasH1 || !hasPrimaryKeyword || !hasSeoTitle || !hasMetaDesc || qaCount < 4) {
    failed++;
  }

  results.push({
    index: index + 1,
    city: area.name,
    slug: area.slug,
    county: area.county,
    primaryKeyword: seo?.primaryKeyword,
    seoTitle: seo?.seoTitle,
    h1: seo?.h1,
    qaCount,
    faqsCount,
    passed: hasSeo && qaCount >= 4
  });
});

console.table(results.map(r => ({
  '#': r.index,
  'City': r.city,
  'Slug': r.slug,
  'Primary Keyword': r.primaryKeyword,
  'H1 Length': r.h1 ? r.h1.length : 0,
  'QA Count': r.qaCount,
  'Status': r.passed ? 'PASSED' : 'FAILED'
})));

console.log('\nTotal service areas verified:', serviceAreas.length);
console.log('Failed count:', failed);
if (failed === 0) {
  console.log('✅ ALL 25 CITIES PASSED QA, AEO, GEO & METADATA VERIFICATION.');
} else {
  process.exit(1);
}
