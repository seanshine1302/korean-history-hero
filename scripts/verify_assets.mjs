import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

function checkAsset(relPath, context) {
  if (!relPath) return;
  const cleanRel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
  const full = path.join(publicDir, cleanRel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing asset referenced in ${context}: ${relPath}`);
  }
}

const baseCfg = JSON.parse(fs.readFileSync('public/data/config/base_graphics_config.json', 'utf-8'));
Object.values(baseCfg.eras).forEach((era) => {
  checkAsset(era.hero_boy, `base_graphics era ${era.era}`);
  checkAsset(era.hero_girl, `base_graphics era ${era.era}`);
  Object.values(era.base_levels).forEach((lv) => {
    checkAsset(lv.asset_path, `base_graphics era ${era.era} ${lv.name}`);
  });
});

const invCfg = JSON.parse(fs.readFileSync('public/data/config/invasion_rules.json', 'utf-8'));
Object.entries(invCfg.era_encounters).forEach(([era, enc]) => {
  checkAsset(enc.normal_enemy.asset, `invasion normal_enemy era ${era}`);
  if (enc.normal_enemy.sub_enemies) {
    enc.normal_enemy.sub_enemies.forEach((s) => checkAsset(s.asset, `sub_enemy ${s.id}`));
  }
  checkAsset(enc.boss.asset, `invasion boss era ${era}`);
});

const shopCfg = JSON.parse(fs.readFileSync('public/data/config/shop_catalog.json', 'utf-8'));
shopCfg.equipment_items.forEach((e) => checkAsset(e.asset, `equipment ${e.id}`));
shopCfg.display_artifacts.forEach((a) => checkAsset(a.asset, `artifact ${a.id}`));

const knowCfg = JSON.parse(fs.readFileSync('public/data/knowledge/knowledge_master_enriched.json', 'utf-8'));
knowCfg.items.forEach((k) => checkAsset(k.visual_asset, `knowledge ${k.knowledge_id}`));

for (let i = 1; i <= 8; i++) {
  const qBank = JSON.parse(fs.readFileSync(`public/data/questions/era_${i}.json`, 'utf-8'));
  qBank.questions.forEach((q) => checkAsset(q.visual_cue_asset, `question ${q.question_id}`));
}

console.log('ALL ASSET PATHS AND JSON CONFIGS VERIFIED 100%!');
