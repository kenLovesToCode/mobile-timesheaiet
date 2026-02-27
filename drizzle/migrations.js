// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_salty_puppet_master.sql';
import m0001 from './0001_mature_hellcat.sql';
import m0002 from './0002_aspiring_invisible_woman.sql';
import m0003 from './0003_quiet_recent_scans.sql';
import m0004 from './0004_breezy_shopping_list.sql';
import m0005 from './0005_calm_shopping_list_product_name.sql';
import m0006 from './0006_product_active_flag.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
  },
};
